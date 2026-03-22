CREATE DATABASE supplychain_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE supplychain_db;
-- Bang users: luu tai khoan dang nhap (thay hardcode)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('PRODUCER','PROCESSOR','TRANSPORTER','DISTRIBUTOR','RETAILER','ADMIN') NOT NULL,
    organization VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bang refresh_tokens: luu refresh token (thay Map trong memory)
CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bang products_cache: cache san pham tu blockchain
CREATE TABLE products_cache (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    product_type VARCHAR(100),
    origin VARCHAR(200),
    current_owner VARCHAR(50),
    current_status VARCHAR(20),
    batch_number VARCHAR(50),
    quantity INT DEFAULT 0,
    unit VARCHAR(20),
    price DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    image_hash VARCHAR(100),
    certificate_hash VARCHAR(100),
    blockchain_tx_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (current_status),
    INDEX idx_owner (current_owner),
    INDEX idx_type (product_type)
);

-- Bang activity_logs: ghi log moi hoat dong
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(30) NOT NULL,
    resource_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    blockchain_tx_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_time (created_at)
);

-- Bang uploaded_files: quan ly file upload
CREATE TABLE uploaded_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50),
    file_type ENUM('IMAGE','CERTIFICATE','DOCUMENT') NOT NULL,
    original_name VARCHAR(255),
    stored_name VARCHAR(255),
    file_hash VARCHAR(100),
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product (product_id),
    INDEX idx_hash (file_hash)
);

-- Bang notifications: thong bao cho nguoi dung
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type ENUM('STATUS_UPDATE','TRANSFER','SYSTEM','ALERT') NOT NULL,
    related_product_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_time (created_at)
);

-- Them du lieu user mac dinh
INSERT INTO users (id, password_hash, name, role, organization, location, phone, email) VALUES
('NSX001', '$2b$10$default_hash_nsx001', 'Nong trai Soc Trang', 'PRODUCER', 'Org1', 'Soc Trang', '0901234567', 'nsx@soctrang.vn'),
('CB001', '$2b$10$default_hash_cb001', 'Nha may che bien ABC', 'PROCESSOR', 'Org1', 'Can Tho', '0901234568', 'cb@abc.vn'),
('VC001', '$2b$10$default_hash_vc001', 'Van chuyen VNPost', 'TRANSPORTER', 'Org2', 'Ho Chi Minh', '0901234569', 'vc@vnpost.vn'),
('PP001', '$2b$10$default_hash_pp001', 'Nha phan phoi MegaMarket', 'DISTRIBUTOR', 'Org2', 'Ha Noi', '0901234570', 'pp@mega.vn'),
('BL001', '$2b$10$default_hash_bl001', 'Sieu thi CoopMart', 'RETAILER', 'Org2', 'Ha Noi', '0901234571', 'bl@coop.vn'),
('ADMIN', '$2b$10$default_hash_admin', 'Administrator', 'ADMIN', 'Org1', 'Ha Noi', '0900000000', 'admin@supplychain.vn');
