const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET - Activity logs (chi ADMIN)
router.get('/activities', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        var filters = {
            userId: req.query.userId,
            action: req.query.action
        };
        var logs = await db.getActivityLogs(filters);
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Thong bao cua user
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        var onlyUnread = req.query.unread === 'true';
        var notifications = await db.getNotifications(req.user.id, onlyUnread);
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Danh dau da doc 1 thong bao
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        await db.markNotificationRead(req.params.id, req.user.id);
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Danh dau da doc tat ca
router.put('/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        await db.markAllNotificationsRead(req.user.id);
        res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
