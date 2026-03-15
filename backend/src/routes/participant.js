const express = require('express');
const router = express.Router();
const { connectGateway } = require('../config/fabric');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET - Lay tat ca thanh vien (can dang nhap)
router.get('/', authenticateToken, async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('GetAllParticipants');
        conn.gateway.disconnect();
        var participants = JSON.parse(result.toString());
        res.json({ success: true, data: participants || [] });
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
        var { id, name, role, organization, location, phone, email } = req.body;

        if (!id || !name || !role || !organization || !location) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction(
            'RegisterParticipant',
            id, name, role, organization, location,
            phone || '', email || ''
        );
        conn.gateway.disconnect();
        res.json({ success: true, message: 'Participant ' + id + ' registered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
