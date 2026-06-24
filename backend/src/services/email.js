const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'lenhhung123@gmail.com',
        pass: process.env.EMAIL_PASS || 'hung2003'
    }
});

async function sendOTP(toEmail, otp, userName) {
    var mailOptions = {
        from: '"SupplyChain App" <' + (process.env.EMAIL_USER || 'lenhhung123@gmail.com') + '>',
        to: toEmail,
        subject: 'Mã xác nhận - SupplyChain',
        html: '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">'
            + '<h2 style="color:#1976D2;text-align:center;">SupplyChain Blockchain</h2>'
            + '<p>Xin chào <strong>' + userName + '</strong>,</p>'
            + '<p>Mã xác nhận của bạn là:</p>'
            + '<div style="text-align:center;margin:20px 0;">'
            + '<span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1976D2;background:#E3F2FD;padding:12px 24px;border-radius:8px;">' + otp + '</span>'
            + '</div>'
            + '<p>Mã có hiệu lực trong <strong>5 phút</strong>.</p>'
            + '<p style="color:#666;font-size:12px;">Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>'
            + '</div>'
    };

    await transporter.sendMail(mailOptions);
}

async function sendApprovalNotification(toEmail, userName, approved, reason) {
    var status = approved ? 'ĐƯỢC CHẤP NHẬN' : 'BỊ TỪ CHỐI';
    var color = approved ? '#4CAF50' : '#F44336';
    var message = approved
        ? 'Tài khoản của bạn đã được admin phê duyệt. Bạn có thể đăng nhập ngay bây giờ.'
        : 'Đơn đăng ký của bạn đã bị từ chối.' + (reason ? ' Lý do: ' + reason : '');

    var mailOptions = {
        from: '"SupplyChain App" <' + (process.env.EMAIL_USER || 'your_email@gmail.com') + '>',
        to: toEmail,
        subject: 'Kết quả đăng ký - SupplyChain',
        html: '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">'
            + '<h2 style="color:#1976D2;text-align:center;">SupplyChain Blockchain</h2>'
            + '<p>Xin chào <strong>' + userName + '</strong>,</p>'
            + '<p>Trạng thái đơn đăng ký: <strong style="color:' + color + ';">' + status + '</strong></p>'
            + '<p>' + message + '</p>'
            + '</div>'
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendOTP, sendApprovalNotification };
