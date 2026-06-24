const express = require('express');
const router = express.Router();
const { connectGateway } = require('../config/fabric');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const db = require('../config/database');
const { createPaymentUrl, verifyReturnParams } = require('../services/vnpay');

function createOrderId(productId, retailerId) {
    return 'SALE_' + productId + '_' + retailerId + '_' + Date.now();
}

// POST - Tao QR thanh toan VNPay sandbox cho ban le
router.post('/retail/create', authenticateToken, authorizeRoles('RETAILER'), async (req, res) => {
    try {
        var { productId, quantity } = req.body;
        var saleQuantity = parseInt(quantity || 0);

        if (!productId || !saleQuantity || saleQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu productId hoặc số lượng bán không hợp lệ'
            });
        }

        var conn = await connectGateway('admin');
        var result = await conn.contract.evaluateTransaction('ReadProduct', productId);
        conn.gateway.disconnect();

        var product = JSON.parse(result.toString());

        if (product.currentOwner !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Chỉ siêu thị đang sở hữu sản phẩm mới được bán lẻ'
            });
        }

        if (product.currentStatus !== 'IN_STORE') {
            return res.status(400).json({
                success: false,
                message: 'Sản phẩm phải ở trạng thái lên kệ mới được bán lẻ'
            });
        }

        if (saleQuantity > product.quantity) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng bán vượt quá số lượng còn lại'
            });
        }

        var unitPrice = Number(product.price || 0);
        var amount = saleQuantity * unitPrice;
        var orderId = createOrderId(productId, req.user.id);

        await db.createRetailPayment({
            orderId: orderId,
            productId: productId,
            retailerId: req.user.id,
            quantity: saleQuantity,
            unitPrice: unitPrice,
            amount: amount
        });

        var paymentUrl = createPaymentUrl({
            orderId: orderId,
            amount: amount,
            ipAddress: req.ip,
            orderInfo: 'Thanh toan ban le san pham ' + productId + ', so luong ' + saleQuantity
        });

        res.json({
            success: true,
            message: 'Đa tao ma thanh toan VNPay demo',
            data: {
                orderId: orderId,
                productId: productId,
                quantity: saleQuantity,
                unitPrice: unitPrice,
                amount: amount,
                paymentUrl: paymentUrl
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - VNPay return URL
router.get('/vnpay-return', async (req, res) => {
    try {
        var validSignature = verifyReturnParams(req.query);

        if (!validSignature) {
            return res.status(400).send('Sai chữ ký thanh toán VNPay');
        }

        var orderId = req.query.vnp_TxnRef;
        var responseCode = req.query.vnp_ResponseCode;
        var transactionNo = req.query.vnp_TransactionNo || '';

        var payment = await db.findRetailPaymentByOrderId(orderId);
        if (!payment) {
            return res.status(404).send('Không tìm thấy đơn thanh toán');
        }

        if (payment.status === 'PAID') {
            return res.send('Đơn hàng đã được xử lý trước đó');
        }

        if (responseCode !== '00') {
            await db.markRetailPaymentFailed(orderId, responseCode);
            return res.send('Thanh toán thất bại hoặc bị hủy');
        }

        var conn = await connectGateway('admin');

        await conn.contract.submitTransaction(
            'SellRetail',
            payment.product_id,
            payment.quantity.toString(),
            payment.retailer_id,
            payment.unit_price.toString(),
            ''
        );

        var productResult = await conn.contract.evaluateTransaction('ReadProduct', payment.product_id);
        conn.gateway.disconnect();

        var product = JSON.parse(productResult.toString());

        await db.markRetailPaymentPaid(orderId, transactionNo, responseCode);

        res.send(`
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Thanh toán thành công</title>
                </head>
                <body style="font-family: Arial; padding: 24px;">
                    <h2>Thanh toán thành công</h2>
                    <p>Mã đơn: ${orderId}</p>
                    <p>Sản phẩm: ${payment.product_id}</p>
                    <p>Đã bán: ${payment.quantity}</p>
                    <p>Số lượng còn lại: ${product.quantity}</p>
                    <p>Trạng thái hiện tại: ${product.currentStatus}</p>
                </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Lỗi xử lý thanh toán: ' + error.message);
    }
});

// GET - Kiem tra trang thai payment cho app
router.get('/retail/:orderId', authenticateToken, async (req, res) => {
    try {
        var payment = await db.findRetailPaymentByOrderId(req.params.orderId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn thanh toán' });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
