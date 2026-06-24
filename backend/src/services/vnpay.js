const crypto = require('crypto');
const qs = require('qs');

const VNP_TMN_CODE = 'X2KFA4GZ';
const VNP_HASH_SECRET = '4XRKYJ0JT8LSA3SFNLM032LZLVH37YAR';
const VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_RETURN_URL = 'https://lamprophyric-janina-intracranial.ngrok-free.dev/api/payments/vnpay-return';

function sortObject(obj) {
    var sorted = {};
    var keys = [];

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            keys.push(encodeURIComponent(key));
        }
    }

    keys.sort();

    for (var i = 0; i < keys.length; i++) {
        var encodedKey = keys[i];
        var rawValue = obj[encodedKey];

        if (rawValue === undefined) {
            rawValue = obj[decodeURIComponent(encodedKey)];
        }

        sorted[encodedKey] = encodeURIComponent(rawValue).replace(/%20/g, '+');
    }

    return sorted;
}

function formatDate(date) {
    function pad(n) {
        return n.toString().padStart(2, '0');
    }

    return date.getFullYear().toString()
        + pad(date.getMonth() + 1)
        + pad(date.getDate())
        + pad(date.getHours())
        + pad(date.getMinutes())
        + pad(date.getSeconds());
}

function createPaymentUrl({ orderId, amount, ipAddress, orderInfo }) {
    var now = new Date();

    var vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: VNP_TMN_CODE,
        vnp_Amount: Math.round(amount * 100),
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: VNP_RETURN_URL,
        vnp_IpAddr: ipAddress || '127.0.0.1',
        vnp_CreateDate: formatDate(now)
    };

    vnpParams = sortObject(vnpParams);

    var signData = qs.stringify(vnpParams, { encode: false });
    var hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
    var secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams.vnp_SecureHash = secureHash;

    return VNP_URL + '?' + qs.stringify(vnpParams, { encode: false });
}

function verifyReturnParams(query) {
    var vnpParams = { ...query };
    var secureHash = vnpParams.vnp_SecureHash;

    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    vnpParams = sortObject(vnpParams);

    var signData = qs.stringify(vnpParams, { encode: false });
    var hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
}

module.exports = {
    createPaymentUrl,
    verifyReturnParams
};
