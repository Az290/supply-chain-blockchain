const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { connectGateway } = require('../config/fabric');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const QRCode = require('qrcode');
const db = require('../config/database');

// Cau hinh multer cho upload file
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
    const allowedExts = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
    const isImage = file.mimetype.startsWith('image/');
    const isDocument = /pdf|msword|vnd.openxmlformats-officedocument/.test(file.mimetype);
    if (extname && (isImage || isDocument)) {
        return cb(null, true);
    }
    cb(new Error('Only images and documents are allowed'));
}
});

// Tao hash tu file
function generateFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return 'Qm' + hashSum.digest('hex').substring(0, 44);
}
function getActionConfig(action) {
    var actions = {
        HARVEST: {
            status: 'HARVESTED',
            label: 'Thu hoạch',
            roles: ['PRODUCER', 'ADMIN'],
            defaultDescription: 'Sản phẩm đã được thu hoạch'
        },
        PROCESS: {
            status: 'PROCESSED',
            label: 'Chế biến',
            roles: ['PROCESSOR', 'ADMIN'],
            defaultDescription: 'Sản phẩm đã được chế biến'
        },
        PACKAGE: {
            status: 'PACKAGED',
            label: 'Đóng gói',
            roles: ['PROCESSOR', 'ADMIN'],
            defaultDescription: 'Sản phẩm đã được đóng gói'
        },
        START_TRANSPORT: {
            status: 'IN_TRANSIT',
            label: 'Bắt đầu vận chuyển',
            roles: ['TRANSPORTER', 'ADMIN'],
            defaultDescription: 'Sản phẩm đang được vận chuyển'
        },
        WAREHOUSE: {
    status: 'WAREHOUSED',
    label: 'Đã tới kho',
    roles: ['TRANSPORTER', 'ADMIN'],
    defaultDescription: 'Sản phẩm đã tới kho phân phối'
},
        DISTRIBUTE: {
            status: 'DISTRIBUTED',
            label: 'Phân phối',
            roles: ['DISTRIBUTOR', 'ADMIN'],
            defaultDescription: 'Sản phẩm đã được phân phối đến điểm bán lẻ'
        },
        PUT_IN_STORE: {
            status: 'IN_STORE',
            label: 'Lên kệ',
            roles: ['RETAILER', 'ADMIN'],
            defaultDescription: 'Sản phẩm đã được đưa lên kệ bán lẻ'
        }
    }

    return actions[action] || null
}

// ===== PUBLIC APIs (khong can dang nhap) =====

// POST - Init Ledger (chi dung khi setup)
router.post('/init', async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction('InitLedger');
        conn.gateway.disconnect();
        res.json({ success: true, message: 'Ledger initialized successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Trang web truy xuat nguon goc (PUBLIC - khach hang quet QR)
router.get('/trace/:id', async (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
        var htmlPath = require('path').join(__dirname, '..', 'views', 'trace.html');
        return res.sendFile(htmlPath);
    }
    try {
        var conn = await connectGateway('admin');
        var productResult = await conn.contract.evaluateTransaction('ReadProduct', req.params.id);
        var product = JSON.parse(productResult.toString());
        var verifyResult = await conn.contract.evaluateTransaction('VerifyProduct', req.params.id);
        var verify = JSON.parse(verifyResult.toString());
        conn.gateway.disconnect();
        res.json({ success: true, data: { verify: verify, product: product } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - QR Code truy xuat nguon goc (public)
router.get('/:id/qrcode', async (req, res) => {
    try {
        var productUrl = req.protocol + '://' + req.get('host') + '/api/products/trace/' + req.params.id;
        var qrCodeDataUrl = await QRCode.toDataURL(productUrl, { width: 300, margin: 2 });
        res.json({ success: true, data: { qrCode: qrCodeDataUrl, url: productUrl, type: 'TRACE' } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - QR Code ban le cho nhan vien quay hang (can dang nhap)
router.get('/:id/retail-qrcode', authenticateToken, authorizeRoles('RETAILER', 'ADMIN'), async (req, res) => {
    try {
        var retailContent = 'RETAIL:' + req.params.id;
        var qrCodeDataUrl = await QRCode.toDataURL(retailContent, { width: 300, margin: 2 });
        res.json({ success: true, data: { qrCode: qrCodeDataUrl, content: retailContent, type: 'RETAIL' } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== PROTECTED APIs (can dang nhap) =====

// GET - Lay tat ca san pham
router.get('/', authenticateToken, async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('GetAllProducts');
        conn.gateway.disconnect();
        var products = JSON.parse(result.toString());
        res.json({ success: true, data: products || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Thong ke (chi ADMIN)
router.get('/statistics', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('GetStatistics');
        conn.gateway.disconnect();
        var stats = JSON.parse(result.toString());
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Lay san pham theo trang thai
router.get('/status/:status', authenticateToken, async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('GetProductsByStatus', req.params.status);
        conn.gateway.disconnect();
        var products = JSON.parse(result.toString());
        res.json({ success: true, data: products || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Lay san pham theo chu so huu
router.get('/owner/:ownerID', authenticateToken, async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('GetProductsByOwner', req.params.ownerID);
        conn.gateway.disconnect();
        var products = JSON.parse(result.toString());
        res.json({ success: true, data: products || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Xac thuc san pham (can dang nhap)
router.get('/:id/verify', authenticateToken, async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('VerifyProduct', req.params.id);
        conn.gateway.disconnect();
        var verification = JSON.parse(result.toString());
        res.json({ success: true, data: verification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Lay san pham theo ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('ReadProduct', req.params.id);
        conn.gateway.disconnect();
        var product = JSON.parse(result.toString());
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Tao san pham moi (chi PRODUCER, ADMIN) - Ho tro upload anh
router.post('/', authenticateToken, authorizeRoles('PRODUCER'), upload.single('image'), async (req, res) => {
    try {
        var { id, name, productType, origin, batchNumber, quantity, unit, price, description } = req.body;
        if (!id || !name || !productType || !origin || !batchNumber || !quantity || !unit) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        var owner = req.user.id;
        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction(
            'CreateProduct',
            id, name, productType, origin, owner,
            batchNumber, quantity.toString(), unit,
            (price || 0).toString(), description || ''
        );
        // Neu co upload anh
        if (req.file) {
            var fileHash = generateFileHash(req.file.path);
            await conn.contract.submitTransaction('UpdateImageHash', id, fileHash);
            try {
                await db.saveFileRecord({
                    productId: id,
                    fileType: 'IMAGE',
                    originalName: req.file.originalname,
                    storedName: req.file.filename,
                    fileHash: fileHash,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                    uploadedBy: req.user.id
                });
            } catch (dbError) {
                console.error('Failed to save file metadata:', dbError.message);
            }
        }
        conn.gateway.disconnect();
        res.json({
            success: true,
            message: 'Product ' + id + ' created successfully',
            data: {
                productId: id,
                hasImage: !!req.file,
                imageFileName: req.file ? req.file.filename : null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Cap nhat san pham (thong tin co ban va anh)
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        var { price, description } = req.body;
        var productId = req.params.id;
        var updated = [];
        var conn = await connectGateway('admin');
        // Kiem tra san pham ton tai
        var result = await conn.contract.evaluateTransaction('ReadProduct', productId);
        var product = JSON.parse(result.toString());
        // Kiem tra quyen (owner hoac ADMIN)
        if (product.currentOwner !== req.user.id) {
            conn.gateway.disconnect();
            return res.status(403).json({
                success: false,
                message: 'Only current owner or ADMIN can update this product'
            });
        }
        // Cap nhat gia neu co
        if (price !== undefined && price !== null) {
            await conn.contract.submitTransaction('UpdateProductPrice', productId, price.toString());
            updated.push('price');
        }
        // Cap nhat anh neu co
        if (req.file) {
            var fileHash = generateFileHash(req.file.path);
            await conn.contract.submitTransaction('UpdateImageHash', productId, fileHash);
            try {
                await db.saveFileRecord({
                    productId: productId,
                    fileType: 'IMAGE',
                    originalName: req.file.originalname,
                    storedName: req.file.filename,
                    fileHash: fileHash,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                    uploadedBy: req.user.id
                });
            } catch (dbError) {
                console.error('Failed to save file metadata:', dbError.message);
            }
            updated.push('image');
        }
        conn.gateway.disconnect();
        if (updated.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        res.json({
            success: true,
            message: 'Product updated: ' + updated.join(', '),
            data: {
                productId: productId,
                updatedFields: updated,
                imageFileName: req.file ? req.file.filename : null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Thuc hien hanh dong nghiep vu tren san pham
router.put('/:id/action', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        var { action, location, description, temperature, humidity } = req.body;
        if (!action) {
            return res.status(400).json({ success: false, message: 'Missing required field: action' });
        }

        var config = getActionConfig(action);
        if (!config) {
            return res.status(400).json({ success: false, message: 'Invalid action: ' + action });
        }

        if (config.roles.indexOf(req.user.role) === -1) {
            return res.status(403).json({
                success: false,
                message: 'Role ' + req.user.role + ' không được phép thực hiện chức năng ' + config.label
            });
        }

        var conn = await connectGateway('admin');

        var result = await conn.contract.evaluateTransaction('ReadProduct', req.params.id);
        var product = JSON.parse(result.toString());

        if (product.currentOwner !== req.user.id) {
            conn.gateway.disconnect();
            return res.status(403).json({
                success: false,
                message: 'Chỉ chủ sở hữu hiện tại hoặc ADMIN được thao tác với sản phẩm này'
            });
        }

        await conn.contract.submitTransaction(
            'UpdateProductStatus',
            req.params.id,
            config.status,
            location || product.origin || '',
            req.user.id,
            description || config.defaultDescription,
            temperature || '',
            humidity || ''
        );

        if (req.file) {
            var fileHash = generateFileHash(req.file.path);
            await conn.contract.submitTransaction('UpdateImageHash', req.params.id, fileHash);

            try {
                await db.saveFileRecord({
                    productId: req.params.id,
                    fileType: 'IMAGE',
                    originalName: req.file.originalname,
                    storedName: req.file.filename,
                    fileHash: fileHash,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                    uploadedBy: req.user.id
                });
            } catch (dbError) {
                console.error('Failed to save file metadata:', dbError.message);
            }
        }

        var updatedResult = await conn.contract.evaluateTransaction('ReadProduct', req.params.id);
        conn.gateway.disconnect();

        var updatedProduct = JSON.parse(updatedResult.toString());

        res.json({
            success: true,
            message: config.label + ' thành công',
            data: {
                product: updatedProduct,
                action: action,
                status: config.status,
                hasImage: !!req.file
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Cap nhat trang thai (role phu hop moi duoc) - Ho tro dinh kem anh
router.put('/:id/status', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        var { status, location, description, temperature, humidity } = req.body;
        if (!status || !location || !description) {
            return res.status(400).json({ success: false, message: 'Missing required fields: status, location, description' });
        }
        var updatedBy = req.user.id;
        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction(
            'UpdateProductStatus',
            req.params.id, status, location, updatedBy,
            description, temperature || '', humidity || ''
        );
        // Neu co dinh kem anh khi cap nhat trang thai
        if (req.file) {
            var fileHash = generateFileHash(req.file.path);
            await conn.contract.submitTransaction('UpdateImageHash', req.params.id, fileHash);
            try {
                await db.saveFileRecord({
                    productId: req.params.id,
                    fileType: 'IMAGE',
                    originalName: req.file.originalname,
                    storedName: req.file.filename,
                    fileHash: fileHash,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                    uploadedBy: req.user.id
                });
            } catch (dbError) {
                console.error('Failed to save file metadata:', dbError.message);
            }
        }
        conn.gateway.disconnect();
        res.json({
            success: true,
            message: 'Status updated to ' + status + ' by ' + updatedBy,
            data: {
                hasImage: !!req.file
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Chuyen quyen so huu theo workflow
router.put('/:id/transfer', authenticateToken, async (req, res) => {
    try {
        var { newOwner } = req.body;
        if (!newOwner) {
            return res.status(400).json({ success: false, message: 'Missing newOwner field' });
        }

        var conn = await connectGateway('admin');

        var result = await conn.contract.evaluateTransaction('ReadProduct', req.params.id);
        var product = JSON.parse(result.toString());

        if (product.currentOwner !== req.user.id && req.user.role !== 'ADMIN') {
            conn.gateway.disconnect();
            return res.status(403).json({
                success: false,
                message: 'Only current owner (' + product.currentOwner + ') or ADMIN can transfer ownership'
            });
        }

        var ownerResult = await conn.contract.evaluateTransaction('GetParticipant', product.currentOwner);
        var ownerParticipant = JSON.parse(ownerResult.toString());
        var ownerRole = ownerParticipant.role;

        var recipientResult = await conn.contract.evaluateTransaction('GetParticipant', newOwner);
        var recipientParticipant = JSON.parse(recipientResult.toString());

        var transferRules = {
    'PRODUCER': {
        requiredStatus: 'HARVESTED',
        allowedRecipientRole: 'PROCESSOR'
    },
    'PROCESSOR': {
        requiredStatus: 'PACKAGED',
        allowedRecipientRole: 'TRANSPORTER'
    },
    'TRANSPORTER': {
    requiredStatus: 'WAREHOUSED',
    allowedRecipientRole: 'DISTRIBUTOR'
},
    'DISTRIBUTOR': {
        requiredStatus: 'DISTRIBUTED',
        allowedRecipientRole: 'RETAILER'
    }
 };

         {
            var rule = transferRules[ownerRole];
            if (!rule) {
                conn.gateway.disconnect();
                return res.status(400).json({
                    success: false,
                    message: 'Role ' + ownerRole + ' không được phép chuyển giao sản phẩm'
                });
            }

            if (product.currentStatus !== rule.requiredStatus) {
                conn.gateway.disconnect();
                return res.status(400).json({
                    success: false,
                    message: 'Sản phẩm phải ở trạng thái ' + rule.requiredStatus + ' mới được chuyển giao'
                });
            }

            if (recipientParticipant.role !== rule.allowedRecipientRole) {
                conn.gateway.disconnect();
                return res.status(400).json({
                    success: false,
                    message: ownerRole + ' chỉ được chuyển giao cho ' + rule.allowedRecipientRole
                });
            }
        }

        await conn.contract.submitTransaction('TransferOwnership', req.params.id, newOwner);

        var updatedResult = await conn.contract.evaluateTransaction('ReadProduct', req.params.id);
        conn.gateway.disconnect();

        var updatedProduct = JSON.parse(updatedResult.toString());

        res.json({
            success: true,
            message: ownerRole === 'TRANSPORTER'
                ? 'Đã chuyển giao cho bán lẻ và tự động cập nhật trạng thái Đã nhập kho'
                : 'Ownership transferred from ' + req.user.id + ' to ' + newOwner,
            data: updatedProduct
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Ban le va tru ton kho (chi RETAILER, ADMIN)
router.post('/:id/sell-retail', authenticateToken, authorizeRoles('RETAILER'), async (req, res) => {
    try {
        var { quantity, price, location } = req.body;
        var saleQuantity = parseInt(quantity || 1);

        if (!saleQuantity || saleQuantity <= 0) {
            return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
        }

        var conn = await connectGateway('admin');

        await conn.contract.submitTransaction(
            'SellRetail',
            req.params.id,
            saleQuantity.toString(),
            req.user.id,
            price !== undefined && price !== null ? price.toString() : '',
            location || ''
        );

        var result = await conn.contract.evaluateTransaction('ReadProduct', req.params.id);
        conn.gateway.disconnect();

        var product = JSON.parse(result.toString());

        try {
            await db.logActivity({
                userId: req.user.id,
                action: 'SELL_RETAIL',
                resourceType: 'PRODUCT',
                resourceId: req.params.id,
                details: 'Retail sale quantity ' + saleQuantity + ', remaining ' + product.quantity,
                ipAddress: req.ip
            });
        } catch (dbError) {
            console.error('Failed to log retail sale:', dbError.message);
        }

        res.json({
            success: true,
            message: product.quantity === 0 ? 'Sold out. Product status changed to SOLD' : 'Retail sale completed',
            data: {
                product: product,
                soldQuantity: saleQuantity,
                remainingQuantity: product.quantity,
                status: product.currentStatus
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Cap nhat gia (chi PRODUCER, ADMIN)
router.put('/:id/price', authenticateToken, authorizeRoles('PRODUCER'), async (req, res) => {
    try {
        var { price } = req.body;
        if (price === undefined) {
            return res.status(400).json({ success: false, message: 'Missing price field' });
        }
        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction('UpdateProductPrice', req.params.id, price.toString());
        conn.gateway.disconnect();
        res.json({ success: true, message: 'Price updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Lich su san pham
router.get('/:id/history', authenticateToken, async (req, res) => {
    try {
        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('GetProductHistory', req.params.id);
        conn.gateway.disconnect();
        var history = JSON.parse(result.toString());
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Cap nhat hash hinh anh (can dang nhap)
router.put('/:id/image', authenticateToken, async (req, res) => {
    try {
        var { imageHash } = req.body;
        if (!imageHash) {
            return res.status(400).json({ success: false, message: 'Missing imageHash field' });
        }
        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction('UpdateImageHash', req.params.id, imageHash);
        conn.gateway.disconnect();
        res.json({ success: true, message: 'Image hash updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Cap nhat hash chung nhan (can dang nhap)
router.put('/:id/certificate', authenticateToken, async (req, res) => {
    try {
        var { certHash } = req.body;
        if (!certHash) {
            return res.status(400).json({ success: false, message: 'Missing certHash field' });
        }
        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction('UpdateCertificateHash', req.params.id, certHash);
        conn.gateway.disconnect();
        res.json({ success: true, message: 'Certificate hash updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Xoa san pham (chi ADMIN)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    return res.status(403).json({ success: false, message: 'Xóa sản phẩm đã bị vô hiệu hóa để bảo toàn tính bất biến của sổ cái Blockchain' });
    /* Disabled for blockchain data integrity
    try {
        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction('DeleteProduct', req.params.id, req.user.id);
        conn.gateway.disconnect();
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
*/ });

module.exports = router;