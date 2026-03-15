# Supply Chain Blockchain

Hệ thống quản lý chuỗi cung ứng nông sản sử dụng Hyperledger Fabric.

## Kiến trúc hệ thống

### Blockchain Network (Custom)
- 3 Organization: ProducerMSP, LogisticsMSP, RetailerMSP
- 3 Orderer nodes (Raft consensus)
- 3 Peer nodes + 3 CouchDB
- Channel: supplychannel

### Backend API
- Node.js/Express
- Fabric SDK
- JWT Authentication (Access + Refresh Token)
- MySQL (Off-chain Database)

### Smart Contract (Chaincode)
- Ngôn ngữ: Go
- 20+ hàm nghiệp vụ
- Phân quyền theo Role

## Cấu trúc thư mục
supply-chain-blockchain/
├── network/ # Custom Hyperledger Fabric network
│ ├── configtx/ # Channel configuration
│ ├── docker/ # Docker compose files
│ ├── organizations/ # Crypto config templates
│ ├── scripts/ # Helper scripts
│ └── network.sh # Network management script
├── chaincode/ # Smart Contract
│ └── chaincode-go/ # Go chaincode source
├── backend/ # Backend API Server
│ ├── src/
│ │ ├── config/ # Fabric & DB config
│ │ ├── routes/ # API routes
│ │ ├── middleware/ # JWT auth
│ │ └── app.js # Entry point
│ └── package.json
└── README.md

## Yêu cầu

- Docker & Docker Compose
- Go 1.21+
- Node.js 18+
- Hyperledger Fabric 2.5
- MySQL/MariaDB

## Hướng dẫn chạy

### 1. Khởi động mạng Blockchain
```bash
cd network
./network.sh all
./network.sh deploycc
### 2. Khởi động Backend
cd backend
cp .env.example .env  # Sửa cấu hình
npm install
npm start

