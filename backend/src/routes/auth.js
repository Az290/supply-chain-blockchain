const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { connectGateway } = require('../config/fabric');
const db = require('../config/database');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    authenticateToken
} = require('../middleware/auth');

// POST - Dang nhap
router.post('/login', async (req, res) => {
    try {
        var { id, password } = req.body;
        if (!id || !password) {
            return res.status(400).json({ success: false, message: 'Missing id or password' });
        }

        // Tim user trong MySQL
        var user = await db.findUserById(id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Kiem tra password
        var validPassword = false;
        if (user.password_hash.startsWith('$2b$10$default_hash_')) {
            if (password === '123456' || password === 'admin123') {
                validPassword = true;
                var hashed = await bcrypt.hash(password, 10);
                await db.updateUserPassword(id, hashed);
            }
        } else {
            validPassword = await bcrypt.compare(password, user.password_hash);
        }

        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        var userData = { id: user.id, name: user.name, role: user.role, organization: user.organization };
        var accessToken = generateAccessToken(userData);
        var refreshToken = generateRefreshToken(userData);

        // Ghi log
        await db.logActivity({
            userId: user.id, action: 'LOGIN', resourceType: 'AUTH',
            details: 'User logged in', ipAddress: req.ip
        });

        res.json({
            success: true,
            data: {
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiresIn: '15m',
                user: {
                    id: user.id, name: user.name, role: user.role,
                    organization: user.organization, location: user.location,
                    phone: user.phone, email: user.email
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Refresh token
router.post('/refresh', function(req, res) {
    try {
        var refreshToken = req.body.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token required' });
        }

        var user = verifyRefreshToken(refreshToken);
        if (!user) {
            return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
        }

        revokeRefreshToken(user.id);

        var userData = { id: user.id, name: user.name, role: user.role, organization: user.organization };
        var newAccessToken = generateAccessToken(userData);
        var newRefreshToken = generateRefreshToken(userData);

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: '15m'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        revokeRefreshToken(req.user.id);
        await db.logActivity({
            userId: req.user.id, action: 'LOGOUT', resourceType: 'AUTH',
            details: 'User logged out', ipAddress: req.ip
        });
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Thong tin user hien tai
router.get('/me', authenticateToken, async (req, res) => {
    try {
        var user = await db.findUserById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({
            success: true,
            data: {
                id: user.id, name: user.name, role: user.role,
                organization: user.organization, location: user.location,
                phone: user.phone, email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Dang ky
router.post('/register', async (req, res) => {
    try {
        var { id, name, password, role, organization, location, phone, email } = req.body;
        if (!id || !name || !password || !role || !organization || !location) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        var existing = await db.findUserById(id);
        if (existing) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        var passwordHash = await bcrypt.hash(password, 10);
        await db.createUser({
            id: id, passwordHash: passwordHash, name: name, role: role,
            organization: organization, location: location, phone: phone, email: email
        });

        // Dang ky len Blockchain
        try {
            var conn = await connectGateway('admin');
            await conn.contract.submitTransaction('RegisterParticipant', id, name, role, organization, location, phone || '', email || '');
            conn.gateway.disconnect();
        } catch (err) {
            console.log('Blockchain register warning:', err.message);
        }

        var userData = { id: id, name: name, role: role, organization: organization };
        var accessToken = generateAccessToken(userData);
        var refreshToken = generateRefreshToken(userData);

        await db.logActivity({
            userId: id, action: 'REGISTER', resourceType: 'AUTH',
            details: 'New user role ' + role, ipAddress: req.ip
        });

        res.json({
            success: true,
            data: {
                accessToken: accessToken, refreshToken: refreshToken, expiresIn: '15m',
                user: { id: id, name: name, role: role, organization: organization, location: location, phone: phone, email: email }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
