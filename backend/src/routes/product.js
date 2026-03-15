const express = require('express');
const router = express.Router();
const { connectGateway } = require('../config/fabric');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const QRCode = require('qrcode');

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

// GET - Truy xuat nguon goc san pham (public cho nguoi tieu dung)
router.get('/trace/:id', async (req, res) => {
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

// POST - Tao san pham moi (chi PRODUCER, ADMIN)
router.post('/', authenticateToken, authorizeRoles('PRODUCER', 'ADMIN'), async (req, res) => {
    try {
        var { id, name, productType, origin, batchNumber, quantity, unit, price, description } = req.body;

        if (!id || !name || !productType || !origin || !batchNumber || !quantity || !unit) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Dung user.id tu JWT lam owner
        var owner = req.user.id;

        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction(
            'CreateProduct',
            id, name, productType, origin, owner,
            batchNumber, quantity.toString(), unit,
            (price || 0).toString(), description || ''
        );
        conn.gateway.disconnect();
        res.json({ success: true, message: 'Product ' + id + ' created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Cap nhat trang thai (role phu hop moi duoc)
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        var { status, location, description, temperature, humidity } = req.body;

        if (!status || !location || !description) {
            return res.status(400).json({ success: false, message: 'Missing required fields: status, location, description' });
        }

        // Dung user.id tu JWT lam updatedBy (khong cho client tu truyen)
        var updatedBy = req.user.id;

        var conn = await connectGateway('admin');
        await conn.contract.submitTransaction(
            'UpdateProductStatus',
            req.params.id, status, location, updatedBy,
            description, temperature || '', humidity || ''
        );
        conn.gateway.disconnect();
        res.json({ success: true, message: 'Status updated to ' + status + ' by ' + updatedBy });
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

        // Kiem tra nguoi goi co phai owner hien tai khong
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
