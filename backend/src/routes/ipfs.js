const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { connectGateway } = require('../config/fabric');
const db = require('../config/database');

// Cau hinh luu file upload
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

// Tao hash tu file (mo phong IPFS hash)
function generateFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return 'Qm' + hashSum.digest('hex').substring(0, 44);
}

// POST - Upload hinh anh san pham
router.post('/upload/image/:productId', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileHash = generateFileHash(req.file.path);

        const { gateway, contract } = await connectGateway('admin');
        await contract.submitTransaction('UpdateImageHash', req.params.productId, fileHash);
        gateway.disconnect();

        try {
            await db.saveFileRecord({
                productId: req.params.productId,
                fileType: 'IMAGE',
                originalName: req.file.originalname,
                storedName: req.file.filename,
                fileHash: fileHash,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                uploadedBy: req.user ? req.user.id : 'anonymous'
            });
        } catch (dbError) {
            console.error('Failed to save file metadata:', dbError.message);
        }

        res.json({
            success: true,
            data: {
                fileHash: fileHash,
                fileName: req.file.filename,
                fileSize: req.file.size,
                filePath: '/api/ipfs/file/' + req.file.filename,
                message: 'Image uploaded and hash stored on blockchain'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Upload chung nhan san pham
router.post('/upload/certificate/:productId', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileHash = generateFileHash(req.file.path);

        const { gateway, contract } = await connectGateway('admin');
        await contract.submitTransaction('UpdateCertificateHash', req.params.productId, fileHash);
        gateway.disconnect();

        try {
            await db.saveFileRecord({
                productId: req.params.productId,
                fileType: 'CERTIFICATE',
                originalName: req.file.originalname,
                storedName: req.file.filename,
                fileHash: fileHash,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                uploadedBy: req.user ? req.user.id : 'anonymous'
            });
        } catch (dbError) {
            console.error('Failed to save file metadata:', dbError.message);
        }

        res.json({
            success: true,
            data: {
                fileHash: fileHash,
                fileName: req.file.filename,
                fileSize: req.file.size,
                filePath: '/api/ipfs/file/' + req.file.filename,
                message: 'Certificate uploaded and hash stored on blockchain'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Lay file theo ten
router.get('/file/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.sendFile(filePath);
});

// GET - Danh sach file da upload
router.get('/files', (req, res) => {
    try {
        if (!fs.existsSync(uploadDir)) {
            return res.json({ success: true, data: [] });
        }
        const files = fs.readdirSync(uploadDir).map(filename => {
            const filePath = path.join(uploadDir, filename);
            const stats = fs.statSync(filePath);
            return {
                filename: filename,
                size: stats.size,
                uploadedAt: stats.mtime,
                url: '/api/ipfs/file/' + filename
            };
        });
        res.json({ success: true, data: files });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Lay hinh anh san pham theo productId
router.get('/product/:productId/image', async (req, res) => {
    try {
        const files = await db.getFilesByProduct(req.params.productId);
        const imageFile = files.find(f => f.file_type === 'IMAGE');
        
        if (!imageFile) {
            return res.status(404).json({ success: false, message: 'No image found for this product' });
        }

        const filePath = path.join(uploadDir, imageFile.stored_name);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Image file not found on disk' });
        }

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Lay chung nhan san pham theo productId
router.get('/product/:productId/certificate', async (req, res) => {
    try {
        const files = await db.getFilesByProduct(req.params.productId);
        const certFile = files.find(f => f.file_type === 'CERTIFICATE');
        
        if (!certFile) {
            return res.status(404).json({ success: false, message: 'No certificate found for this product' });
        }

        const filePath = path.join(uploadDir, certFile.stored_name);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Certificate file not found on disk' });
        }

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Lay metadata cac file cua san pham
router.get('/product/:productId/files', async (req, res) => {
    try {
        const files = await db.getFilesByProduct(req.params.productId);
        
        const filesWithUrls = files.map(f => ({
            id: f.id,
            type: f.file_type,
            originalName: f.original_name,
            fileHash: f.file_hash,
            fileSize: f.file_size,
            mimeType: f.mime_type,
            uploadedBy: f.uploaded_by,
            uploadedAt: f.created_at,
            url: '/api/ipfs/file/' + f.stored_name
        }));

        res.json({ success: true, data: filesWithUrls });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
