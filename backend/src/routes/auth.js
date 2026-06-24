const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { connectGateway } = require('../config/fabric');
const db = require('../config/database');
const { sendOTP, sendApprovalNotification } = require('../services/email');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    authenticateToken,
    authorizeRoles
} = require('../middleware/auth');

// Tao OTP 6 so
function generateOTPCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Luu OTP reset password tam thoi (in-memory)
var resetOTPStore = new Map();

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
                requirePasswordChange: !!user.must_change_password,
                user: {
                    id: user.id, name: user.name, role: user.role,
                    organization: user.organization, location: user.location,
                    phone: user.phone, email: user.email,
                    mustChangePassword: !!user.must_change_password
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
                phone: user.phone, email: user.email,
                mustChangePassword: !!user.must_change_password
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== DANG KY CONG KHAI DA TAT ====================

router.post('/register', function(req, res) {
    res.status(403).json({
        success: false,
        message: 'Đăng ký công khai đã tắt. Vui lòng liên hệ quản trị viên để tạo tài khoản.'
    });
});

router.post('/verify-otp', function(req, res) {
    res.status(403).json({
        success: false,
        message: 'Xác thực OTP đăng ký đã tắt vì đăng ký công khai không còn được hỗ trợ.'
    });
});

router.post('/resend-otp', function(req, res) {
    res.status(403).json({
        success: false,
        message: 'Gửi lại OTP đăng ký đã tắt vì đăng ký công khai không còn được hỗ trợ.'
    });
});

// ==================== QUEN MAT KHAU ====================

// POST - Yeu cau reset password (gui OTP qua email)
router.post('/forgot-password', async (req, res) => {
    try {
        var { id, email } = req.body;
        if (!id || !email) {
            return res.status(400).json({ success: false, message: 'Thiếu mã thành viên hoặc email' });
        }

        var user = await db.findUserById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
        }
        if (user.email !== email) {
            return res.status(400).json({ success: false, message: 'Email không khớp với tài khoản' });
        }

        var otpCode = generateOTPCode();
        var expiresAt = Date.now() + 5 * 60 * 1000;
        resetOTPStore.set(id, { otp: otpCode, expiresAt: expiresAt, email: email });

        try {
            await sendOTP(email, otpCode, user.name);
        } catch (emailErr) {
            return res.status(500).json({ success: false, message: 'Không thể gửi email' });
        }

        res.json({ success: true, message: 'Mã xác nhận đã được gửi đến email' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Xac nhan OTP va doi mat khau
router.post('/reset-password', async (req, res) => {
    try {
        var { id, otpCode, newPassword } = req.body;
        if (!id || !otpCode || !newPassword) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
        }
        if (newPassword === '123456') {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới không được là mật khẩu mặc định' });
        }

        var stored = resetOTPStore.get(id);
        if (!stored) {
            return res.status(400).json({ success: false, message: 'Chưa yêu cầu đặt lại mật khẩu' });
        }
        if (stored.otp !== otpCode) {
            return res.status(400).json({ success: false, message: 'Mã OTP không đúng' });
        }
        if (Date.now() > stored.expiresAt) {
            resetOTPStore.delete(id);
            return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn' });
        }

        var passwordHash = await bcrypt.hash(newPassword, 10);
        await db.updateUserPassword(id, passwordHash);
        resetOTPStore.delete(id);

        await db.logActivity({
            userId: id, action: 'RESET_PASSWORD', resourceType: 'AUTH',
            details: 'Password reset via OTP', ipAddress: req.ip
        });

        res.json({ success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Doi mat khau khi dang nhap
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        var { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' });
        }
        if (newPassword === '123456') {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới không được là mật khẩu mặc định' });
        }

        var user = await db.findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
        }

        var validPassword = false;
        if (user.password_hash.startsWith('$2b$10$default_hash_')) {
            validPassword = currentPassword === '123456' || currentPassword === 'admin123';
        } else {
            validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        }

        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
        }

        var passwordHash = await bcrypt.hash(newPassword, 10);
        await db.updateUserPassword(req.user.id, passwordHash);

        await db.logActivity({
            userId: req.user.id, action: 'CHANGE_PASSWORD', resourceType: 'AUTH',
            details: 'Password changed by user', ipAddress: req.ip
        });

        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== ADMIN DUYET DON DA TAT ====================

router.get('/registrations', authenticateToken, authorizeRoles('ADMIN'), function(req, res) {
    res.status(410).json({
        success: false,
        message: 'Luồng duyệt đơn đăng ký đã tắt. Admin tạo thành viên trực tiếp trong mục Thành viên.'
    });
});

router.put('/registrations/:id/approve', authenticateToken, authorizeRoles('ADMIN'), function(req, res) {
    res.status(410).json({
        success: false,
        message: 'Luồng duyệt đơn đăng ký đã tắt. Admin tạo thành viên trực tiếp trong mục Thành viên.'
    });
});

router.put('/registrations/:id/reject', authenticateToken, authorizeRoles('ADMIN'), function(req, res) {
    res.status(410).json({
        success: false,
        message: 'Luồng duyệt đơn đăng ký đã tắt. Admin tạo thành viên trực tiếp trong mục Thành viên.'
    });
});

module.exports = router;
