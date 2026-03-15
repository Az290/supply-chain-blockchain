const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supplychain_secret_2025';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supplychain_refresh_secret_2025';

// Refresh tokens luu trong memory (bao mat hon database)
var refreshTokenStore = new Map();

function generateAccessToken(user) {
    return jwt.sign(
        { id: user.id, name: user.name, role: user.role, organization: user.organization },
        JWT_SECRET,
        { expiresIn: '15m' }
    );
}

function generateRefreshToken(user) {
    var token = jwt.sign(
        { id: user.id, name: user.name, role: user.role, organization: user.organization },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    refreshTokenStore.set(user.id, token);
    return token;
}

function verifyRefreshToken(token) {
    try {
        var decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        var stored = refreshTokenStore.get(decoded.id);
        if (!stored || stored !== token) return null;
        return decoded;
    } catch (err) {
        return null;
    }
}

function revokeRefreshToken(userId) {
    refreshTokenStore.delete(userId);
}

function authenticateToken(req, res, next) {
    var authHeader = req.headers['authorization'];
    var token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, function(err, user) {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Access token expired' });
            }
            return res.status(403).json({ success: false, message: 'Invalid access token' });
        }
        req.user = user;
        next();
    });
}

function authorizeRoles() {
    var roles = Array.prototype.slice.call(arguments);
    return function(req, res, next) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Role ' + req.user.role + ' not authorized. Required: ' + roles.join(', ')
            });
        }
        next();
    };
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    authenticateToken,
    authorizeRoles
};
