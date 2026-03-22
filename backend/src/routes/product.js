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
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
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

// GET - QR Code (public)
router.get('/:id/qrcode', async (req, res) => {
    try {
        var productUrl = req.protocol + '://' + req.get('host') + '/api/products/trace/' + req.params.id;
        var qrCodeDataUrl = await QRCode.toDataURL(productUrl, { width: 300, margin: 2 });
        res.json({ success: true, data: { qrCode: qrCodeDataUrl, url: productUrl } });
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
router.post('/', authenticateToken, authorizeRoles('PRODUCER', 'ADMIN'), upload.single('image'), async (req, res) => {
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
        if (product.currentOwner !== req.user.id && req.user.role !== 'ADMIN') {
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

// PUT - Chuyen quyen so huu (chi owner hien tai hoac ADMIN)
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

        await conn.contract.submitTransaction('TransferOwnership', req.params.id, newOwner);
        conn.gateway.disconnect();
        res.json({ success: true, message: 'Ownership transferred from ' + req.user.id + ' to ' + newOwner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Cap nhat gia (chi PRODUCER, ADMIN)
router.put('/:id/price', authenticateToken, authorizeRoles('PRODUCER', 'ADMIN'), async (req, res) => {
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
    try {
        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction('DeleteProduct', req.params.id, req.user.id);
        conn.gateway.disconnect();
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
