# Supply Chain Blockchain

Hệ thống quản lý chuỗi cung ứng nông sản sử dụng Hyperledger Fabric: truy xuất nguồn gốc, chuyển giao quyền sở hữu theo vai trò và bán lẻ tích hợp thanh toán.

## Kiến trúc hệ thống

### Blockchain Network (Custom)
- 4 tổ chức: OrdererMSP (điều phối) + ProducerMSP, LogisticsMSP, RetailerMSP (nghiệp vụ)
- 3 Orderer nodes (Raft consensus)
- 3 Peer nodes + 3 CouchDB
- Channel: `supplychannel`

### Smart Contract (Chaincode)
- Ngôn ngữ: Go (`fabric-contract-api-go`)
- 20+ hàm nghiệp vụ
- Vòng đời 9 trạng thái, phân quyền theo Role, chuyển giao theo workflow

### Backend API
- Node.js / Express + Fabric SDK
- JWT Authentication (Access + Refresh Token)
- MySQL (off-chain), tích hợp VNPay, lưu tệp gắn mã băm (CID-like)

### Web Admin
- React / Vite — dành cho vai trò Admin: dashboard thống kê, quản lý sản phẩm / thành viên / nhật ký

### Ứng dụng Android
- Kotlin / Jetpack Compose theo Clean Architecture (Hilt, Retrofit, Room)
- Tạo sản phẩm, cập nhật trạng thái, chuyển giao, bán lẻ, quét QR truy xuất nguồn gốc

### Database (Off-chain)
- MySQL/MariaDB: tài khoản, nhật ký hoạt động, thanh toán, metadata tệp

## Cấu trúc thư mục

```
supply-chain-blockchain/
├── network/              # Mạng Hyperledger Fabric (custom)
│   ├── configtx/         # Cấu hình kênh
│   ├── docker/           # Docker compose files
│   ├── organizations/    # Crypto config / chứng thư
│   ├── scripts/          # Script phụ trợ
│   └── network.sh        # Script quản lý mạng
├── chaincode/
│   └── chaincode-go/     # Smart Contract (Go)
├── backend/              # Backend API Server (Node.js/Express)
│   ├── src/
│   │   ├── config/       # Fabric & DB config
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # JWT auth
│   │   ├── services/     # VNPay, email
│   │   └── app.js        # Entry point
│   └── package.json
├── web-admin/            # Trang quản trị (React/Vite)
│   ├── src/
│   └── package.json
├── supplychainapp/       # Ứng dụng Android (Kotlin/Compose)
│   └── app/src/
├── Database/
│   └── supplychain.sql   # CSDL off-chain (MySQL)
├── .gitignore
└── README.md
```

## Yêu cầu

- Docker & Docker Compose
- Go 1.21+
- Node.js 18+
- Hyperledger Fabric 2.5
- MySQL/MariaDB
- Android Studio + JDK 11 (cho ứng dụng Android)

## Hướng dẫn chạy

### 1. Khởi động mạng Blockchain
```bash
cd network
./network.sh all          # khởi tạo & chạy mạng (orderer, peer, couchdb), tạo kênh
./network.sh deploycc     # đóng gói & triển khai chaincode
```

### 2. Nhập cơ sở dữ liệu
```bash
mysql -u root -p -e "CREATE DATABASE supplychain_db CHARACTER SET utf8mb4;"
mysql -u root -p supplychain_db < Database/supplychain.sql
```

### 3. Khởi động Backend
```bash
cd backend
cp .env.example .env      # sửa cấu hình DB, JWT, FABRIC_NETWORK_PATH...
npm install
npm start                 # Backend chạy ở cổng 3001
```
> Sau khi Backend chạy, khởi tạo dữ liệu mẫu: `POST http://localhost:3001/api/products/init`

### 4. Khởi động Web Admin
```bash
cd web-admin
npm install
npm run dev               # mở http://localhost:5173/admin
```

### 5. Chạy ứng dụng Android
- Mở thư mục `supplychainapp/` bằng Android Studio, chờ Gradle Sync.
- Sửa `BASE_URL` trong `RetrofitClient.kt` trỏ tới địa chỉ Backend (IP LAN / ngrok; emulator dùng `http://10.0.2.2:3001/`).
- Chọn thiết bị (Android 8.0+) và Run.

## Tài khoản mặc định

| Mã đăng nhập | Vai trò |
|---|---|
| ADMIN | Quản trị viên (đăng nhập Web Admin) |
| NSX001 | Nhà sản xuất (Producer) |
| CB001 | Chế biến (Processor) |
| VC001 | Vận chuyển (Transporter) |
| PP001 | Phân phối (Distributor) |
| BL001 | Bán lẻ (Retailer) |

> Mật khẩu mặc định: `123456`. Người tiêu dùng không cần đăng nhập, chỉ quét QR để truy xuất.
