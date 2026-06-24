const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'supplychain_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        var conn = await pool.getConnection();
        console.log('MySQL connected successfully');
        conn.release();
        return true;
    } catch (error) {
        console.error('MySQL connection failed:', error.message);
        return false;
    }
}

// ==================== USER ====================

async function findUserById(id) {
    var [rows] = await pool.execute('SELECT * FROM users WHERE id = ? AND is_active = TRUE', [id]);
    return rows[0] || null;
}

async function createUser(userData) {
    var sql = 'INSERT INTO users (id, password_hash, name, role, organization, location, phone, email, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await pool.execute(sql, [
        userData.id, userData.passwordHash, userData.name, userData.role,
        userData.organization, userData.location || '', userData.phone || '', userData.email || '',
        userData.mustChangePassword ? 1 : 0
    ]);
}

async function updateUserPassword(id, passwordHash) {
    await pool.execute('UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?', [passwordHash, id]);
}

async function getAllUsers() {
    var [rows] = await pool.execute('SELECT id, name, role, organization, location, phone, email, is_active FROM users ORDER BY created_at DESC');
    return rows;
}

async function softDeleteUser(id) {
    await pool.execute('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);
}

// ==================== REGISTRATION REQUESTS ====================

async function createRegistrationRequest(data) {
    var sql = `INSERT INTO registration_requests 
        (id, name, password_hash, role, organization, location, phone, email, otp_code, otp_expires_at, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OTP_PENDING')`;
    await pool.execute(sql, [
        data.id, data.name, data.passwordHash, data.role,
        data.organization, data.location || '', data.phone || '', data.email,
        data.otpCode, data.otpExpiresAt
    ]);
}

async function findRegistrationById(id) {
    var [rows] = await pool.execute('SELECT * FROM registration_requests WHERE id = ? ORDER BY created_at DESC LIMIT 1', [id]);
    return rows[0] || null;
}

async function findRegistrationByEmail(email) {
    var [rows] = await pool.execute('SELECT * FROM registration_requests WHERE email = ? ORDER BY created_at DESC LIMIT 1', [email]);
    return rows[0] || null;
}

async function updateRegistrationOTP(id, otpCode, otpExpiresAt) {
    await pool.execute(
        'UPDATE registration_requests SET otp_code = ?, otp_expires_at = ?, status = ? WHERE id = ? AND status IN (?, ?)',
        [otpCode, otpExpiresAt, 'OTP_PENDING', id, 'OTP_PENDING', 'PENDING']
    );
}

async function verifyRegistrationOTP(id, otpCode) {
    var [rows] = await pool.execute(
        'SELECT * FROM registration_requests WHERE id = ? AND otp_code = ? AND otp_expires_at > NOW() AND status = ?',
        [id, otpCode, 'OTP_PENDING']
    );
    if (rows.length > 0) {
        await pool.execute('UPDATE registration_requests SET status = ? WHERE id = ? AND status = ?', ['PENDING', id, 'OTP_PENDING']);
        return true;
    }
    return false;
}

async function getPendingRegistrations() {
    var [rows] = await pool.execute('SELECT * FROM registration_requests WHERE status = ? ORDER BY created_at DESC', ['PENDING']);
    return rows;
}

async function approveRegistration(id) {
    await pool.execute('UPDATE registration_requests SET status = ?, reviewed_at = NOW() WHERE id = ?', ['APPROVED', id]);
}

async function rejectRegistration(id, reason) {
    await pool.execute('UPDATE registration_requests SET status = ?, reject_reason = ?, reviewed_at = NOW() WHERE id = ?', ['REJECTED', reason || '', id]);
}

async function getRegistrationsByStatus(status) {
    var [rows] = await pool.execute('SELECT * FROM registration_requests WHERE status = ? ORDER BY created_at DESC', [status]);
    return rows;
}

// ==================== PRODUCT CACHE ====================

async function cacheProduct(product) {
    var sql = `INSERT INTO products_cache (id, name, product_type, origin, current_owner, current_status, batch_number, quantity, unit, price, description, image_hash, certificate_hash, blockchain_tx_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name=VALUES(name), product_type=VALUES(product_type), origin=VALUES(origin),
        current_owner=VALUES(current_owner), current_status=VALUES(current_status),
        batch_number=VALUES(batch_number), quantity=VALUES(quantity), unit=VALUES(unit),
        price=VALUES(price), description=VALUES(description), image_hash=VALUES(image_hash),
        certificate_hash=VALUES(certificate_hash), blockchain_tx_id=VALUES(blockchain_tx_id),
        updated_at=CURRENT_TIMESTAMP`;
    await pool.execute(sql, [
        product.id, product.name, product.productType, product.origin,
        product.currentOwner, product.currentStatus, product.batchNumber,
        product.quantity, product.unit, product.price || 0,
        product.description || '', product.imageHash || '',
        product.certificateHash || '', product.txId || ''
    ]);
}

async function getCachedProducts(filters) {
    var sql = 'SELECT * FROM products_cache WHERE 1=1';
    var params = [];
    if (filters && filters.status) {
        sql += ' AND current_status = ?';
        params.push(filters.status);
    }
    if (filters && filters.owner) {
        sql += ' AND current_owner = ?';
        params.push(filters.owner);
    }
    if (filters && filters.type) {
        sql += ' AND product_type = ?';
        params.push(filters.type);
    }
    if (filters && filters.search) {
        sql += ' AND (name LIKE ? OR origin LIKE ? OR batch_number LIKE ?)';
        var s = '%' + filters.search + '%';
        params.push(s, s, s);
    }
    sql += ' ORDER BY updated_at DESC';
    if (filters && filters.limit) {
        sql += ' LIMIT ' + parseInt(filters.limit);
    }
    if (filters && filters.offset) {
        sql += ' OFFSET ' + parseInt(filters.offset);
    }
    var [rows] = await pool.execute(sql, params);
    return rows;
}

async function getCachedProductById(id) {
    var [rows] = await pool.execute('SELECT * FROM products_cache WHERE id = ?', [id]);
    return rows[0] || null;
}

// ==================== ACTIVITY LOG ====================

async function logActivity(data) {
    var sql = 'INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, blockchain_tx_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    await pool.execute(sql, [
        data.userId, data.action, data.resourceType,
        data.resourceId || '', data.details || '',
        data.ipAddress || '', data.txId || ''
    ]);
}

async function getActivityLogs(filters) {
    var sql = 'SELECT * FROM activity_logs WHERE 1=1';
    var params = [];
    if (filters && filters.userId) {
        sql += ' AND user_id = ?';
        params.push(filters.userId);
    }
    if (filters && filters.action) {
        sql += ' AND action = ?';
        params.push(filters.action);
    }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    var [rows] = await pool.execute(sql, params);
    return rows;
}

// ==================== UPLOADED FILES ====================

async function saveFileRecord(data) {
    var sql = 'INSERT INTO uploaded_files (product_id, file_type, original_name, stored_name, file_hash, file_size, mime_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    await pool.execute(sql, [
        data.productId, data.fileType, data.originalName,
        data.storedName, data.fileHash, data.fileSize,
        data.mimeType, data.uploadedBy
    ]);
}

async function getFilesByProduct(productId) {
    var [rows] = await pool.execute('SELECT * FROM uploaded_files WHERE product_id = ? ORDER BY created_at DESC', [productId]);
    return rows;
}

// ==================== NOTIFICATION ====================

async function createNotification(data) {
    var sql = 'INSERT INTO notifications (user_id, title, message, type, related_product_id) VALUES (?, ?, ?, ?, ?)';
    await pool.execute(sql, [
        data.userId, data.title, data.message || '',
        data.type, data.relatedProductId || ''
    ]);
}

async function getNotifications(userId, onlyUnread) {
    var sql = 'SELECT * FROM notifications WHERE user_id = ?';
    if (onlyUnread) sql += ' AND is_read = FALSE';
    sql += ' ORDER BY created_at DESC LIMIT 50';
    var [rows] = await pool.execute(sql, [userId]);
    return rows;
}

async function markNotificationRead(id, userId) {
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
}

async function markAllNotificationsRead(userId) {
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
}
async function createRetailPayment(data) {
    var sql = `INSERT INTO retail_payments
        (order_id, product_id, retailer_id, quantity, unit_price, amount, status, vnp_txn_ref)
        VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`;

    await pool.execute(sql, [
        data.orderId,
        data.productId,
        data.retailerId,
        data.quantity,
        data.unitPrice,
        data.amount,
        data.orderId
    ]);
}

async function findRetailPaymentByOrderId(orderId) {
    var [rows] = await pool.execute(
        'SELECT * FROM retail_payments WHERE order_id = ? LIMIT 1',
        [orderId]
    );
    return rows[0] || null;
}

async function markRetailPaymentPaid(orderId, vnpTransactionNo, responseCode) {
    await pool.execute(
        `UPDATE retail_payments
         SET status = 'PAID', vnp_transaction_no = ?, vnp_response_code = ?, paid_at = NOW()
         WHERE order_id = ? AND status = 'PENDING'`,
        [vnpTransactionNo || '', responseCode || '', orderId]
    );
}

async function markRetailPaymentFailed(orderId, responseCode) {
    await pool.execute(
        `UPDATE retail_payments
         SET status = 'FAILED', vnp_response_code = ?
         WHERE order_id = ? AND status = 'PENDING'`,
        [responseCode || '', orderId]
    );
}

module.exports = {
    pool,
    testConnection,
    findUserById,
    createUser,
    updateUserPassword,
    getAllUsers,
    softDeleteUser,
    createRegistrationRequest,
    findRegistrationById,
    findRegistrationByEmail,
    updateRegistrationOTP,
    verifyRegistrationOTP,
    getPendingRegistrations,
    approveRegistration,
    rejectRegistration,
    getRegistrationsByStatus,
    cacheProduct,
    getCachedProducts,
    getCachedProductById,
    logActivity,
    getActivityLogs,
    saveFileRecord,
    getFilesByProduct,
    createNotification,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    createRetailPayment,
findRetailPaymentByOrderId,
markRetailPaymentPaid,
markRetailPaymentFailed,
};
