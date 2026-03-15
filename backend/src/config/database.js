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
    var sql = 'INSERT INTO users (id, password_hash, name, role, organization, location, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    await pool.execute(sql, [
        userData.id, userData.passwordHash, userData.name, userData.role,
        userData.organization, userData.location || '', userData.phone || '', userData.email || ''
    ]);
}

async function updateUserPassword(id, passwordHash) {
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
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

module.exports = {
    pool,
    testConnection,
    findUserById,
    createUser,
    updateUserPassword,
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
    markAllNotificationsRead
};
