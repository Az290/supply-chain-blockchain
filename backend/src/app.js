require('dotenv').config();
var express = require('express');
var cors = require('cors');
var path = require('path');

var productRoutes = require('./routes/product');
var participantRoutes = require('./routes/participant');
var authRoutes = require('./routes/auth');
var ipfsRoutes = require('./routes/ipfs');
var logsRoutes = require('./routes/logs');
var { enrollAdmin, createFileBasedIdentity } = require('./config/fabric');
var db = require('./config/database');

var app = express();
var PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// Trang web truy xuat nguon goc (khach hang quet QR)
app.get('/trace/:id', function(req, res) {
    var htmlPath = require('path').join(__dirname, 'views', 'trace.html');
    res.sendFile(htmlPath);
});

app.get('/api/health', function(req, res) {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
            blockchain: 'Hyperledger Fabric',
            database: 'MySQL (Off-chain)',
            auth: 'JWT (Access + Refresh Token)'
        }
    });
});

async function startServer() {
    try {
        console.log('Connecting to MySQL...');
        var dbOk = await db.testConnection();
        if (!dbOk) {
            console.error('WARNING: MySQL not connected');
        }

        console.log('Setting up admin identity...');
        try {
            await enrollAdmin();
        } catch (err) {
            console.log('CA enroll failed, trying file-based identity...');
            await createFileBasedIdentity();
        }
        console.log('Admin identity ready');

        app.listen(PORT, '0.0.0.0', function() {
            console.log('========================================');
            console.log('  Supply Chain API Server');
            console.log('  Port: ' + PORT);
            console.log('  MySQL: ' + (dbOk ? 'Connected' : 'Not connected'));
            console.log('  Blockchain: Hyperledger Fabric');
            console.log('========================================');
        });
    } catch (error) {
        console.error('Failed to start:', error.message);
        process.exit(1);
    }
}

startServer();
