const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { connectGateway } = require('../config/fabric');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const db = require('../config/database');

// GET - Lay tat ca thanh vien (can dang nhap)
router.get('/', authenticateToken, async (req, res) => {
    try {
        var users = await db.getAllUsers();
        var participants = users.map(function(user) {
            return {
                id: user.id,
                name: user.name,
                role: user.role,
                organization: user.organization,
                location: user.location || '',
                phone: user.phone || '',
                email: user.email || '',
                isActive: !!user.is_active
            };
        });
        res.json({ success: true, data: participants });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Lay thanh vien theo role (can dang nhap)
router.get('/role/:role', authenticateToken, async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('GetParticipantsByRole', req.params.role);
        conn.gateway.disconnect();
        var participants = JSON.parse(result.toString());
        res.json({ success: true, data: participants || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Lay thanh vien theo ID (can dang nhap)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('GetParticipant', req.params.id);
        conn.gateway.disconnect();
        var participant = JSON.parse(result.toString());
        res.json({ success: true, data: participant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Dang ky thanh vien moi (chi ADMIN)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        var { id, name, role, organization, location, phone, email, password } = req.body;

        if (!id || !name || !role || !organization || !location) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 1. Dang ky len Blockchain
        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction(
            'RegisterParticipant',
            id, name, role, organization, location,
            phone || '', email || ''
        );
        conn.gateway.disconnect();

        // 2. Tao user trong MySQL neu chua ton tai
        var defaultPassword = '123456';
        var mysqlCreated = false;
        try {
            var existing = await db.findUserById(id);
            if (!existing) {
                var passwordHash = await bcrypt.hash(defaultPassword, 10);
                await db.createUser({
                    id: id,
                    passwordHash: passwordHash,
                    name: name,
                    role: role,
                    organization: organization,
                    location: location,
                    phone: phone || '',
                    email: email || '',
                    mustChangePassword: true
                });
                mysqlCreated = true;
            }
        } catch (dbErr) {
            // Khong fail toan bo request neu MySQL loi, chi log canh bao
            console.warn('MySQL user creation warning:', dbErr.message);
        }

        res.json({
            success: true,
            message: 'Participant ' + id + ' registered successfully',
            data: {
                id: id,
                defaultPassword: mysqlCreated ? defaultPassword : null,
                note: mysqlCreated
                    ? 'MySQL account created. Default password: ' + defaultPassword + '. User must change password on first login.'
                    : 'Blockchain registered. MySQL account already exists or creation failed.'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// DELETE - Xoa mem thanh vien (chi ADMIN)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        var id = req.params.id;
        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Không thể xóa chính tài khoản đang đăng nhập' });
        }

        var user = await db.findUserById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
        }

        await db.softDeleteUser(id);

        try {
            var conn = await connectGateway('admin');
            await conn.contract.submitTransaction('DeactivateParticipant', id);
            conn.gateway.disconnect();
        } catch (err) {
            console.log('Blockchain deactivate warning:', err.message);
        }

        await db.logActivity({
            userId: req.user.id, action: 'DELETE_PARTICIPANT', resourceType: 'PARTICIPANT',
            resourceId: id, details: 'Soft deleted participant ' + id, ipAddress: req.ip
        });

        res.json({ success: true, message: 'Đã xóa mềm thành viên ' + id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
