# 🚀 DealPing Backend — Multi-Platform Price Tracking & Deal Radar API

<div align="center">

![DealPing Backend](https://img.shields.io/badge/DealPing-Backend_API-6366f1?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

> **Hệ thống API bóc tách dữ liệu & theo dõi biến động giá 24/7 trên Shopee, TikTok Shop, và Lazada.**

</div>

---

## 📖 Tổng Quan

DealPing Backend cung cấp hạ tầng phân giải link, cào dữ liệu giá trực tiếp theo thời gian thực (Real-time Price Engine), quản lý các mặt hàng theo dõi của người dùng, phân tích biến động giá (Price History), và tự động cảnh báo khi sản phẩm đạt mức giá mục tiêu (`TARGET_HIT`).

Dự án thuộc học phần **EXE101 — Khởi Nghiệp Đổi Mới Sáng Tạo (FA26)**.

---

## 🏗️ Cấu Trúc Dự Án

```
Dealping_Backend/
├── prisma/
│   └── schema.prisma              # Schema database: User, TrackingItem, PriceHistory
├── src/
│   ├── app.js                     # Cấu hình Express app, CORS, routes
│   ├── server.js                  # Entry point khởi chạy server
│   ├── config/
│   │   └── prisma.js              # Prisma Client instance singleton
│   ├── routes/
│   │   ├── trackingItems.routes.js # API quản lý món đồ theo dõi & preview link
│   │   └── test.routes.js          # API test simulation & Top Deals radar
│   ├── controllers/
│   │   ├── trackingItems.controller.js
│   │   └── test.controller.js
│   ├── services/
│   │   ├── dealsScannerService.js  # Engine quét top deal giảm sâu đa sàn (Lazada, Shopee, TikTok)
│   │   ├── shopeePriceService.js   # Bóc tách giá Shopee (AddLiveTag + Open API + Fallback)
│   │   ├── tiktokPriceService.js   # Bóc tách giá TikTok Shop & Deeplink
│   │   ├── lazadaPriceService.js   # Bóc tách giá Lazada & Deeplink
│   │   ├── linkParser.service.js   # Giải mã link rút gọn (shp.ee, vt.tiktok, s.lazada) & bóc item ID
│   │   ├── trackingItems.service.js # Logic nghiệp vụ CRUD tracking items & preview
│   │   └── cronService.js          # Cron job chạy ngầm quét giá định kỳ 24/7
│   ├── middlewares/
│   │   └── errorHandler.js        # Global error handling
│   └── utils/
│       └── ApiError.js
└── tests/
    ├── linkParser.service.test.js
    └── priceServices.test.js
```

---

## ⚡ Các Endpoint API Chính

### 1. Phân giải & Xem trước sản phẩm (Preview Link)
- **`POST /api/tracking-items/preview`**
- **Body**: `{ "shopeeUrl": "https://shopee.vn/..." }` (Hỗ trợ Shopee, TikTok Shop, Lazada)
- **Response**: Trả về Tên sản phẩm, Giá hiện hành, Giá sau Voucher, Ảnh đại diện CDN, Danh sách phân loại (SKU).

### 2. Quản lý Sản Phẩm Theo Dõi (Tracking Items)
- **`GET /api/tracking-items?userId=...`**: Lấy danh sách sản phẩm đang theo dõi.
- **`POST /api/tracking-items`**: Thêm sản phẩm mới vào Radar theo dõi.
- **`DELETE /api/tracking-items/:id`**: Hủy theo dõi sản phẩm.

### 3. Radar Quét Top Deal Giảm Sâu (Top Sales Scanner)
- **`GET /api/deals/top-sales`**: Trả về danh sách deal đang giảm sâu nhất trên các sàn được sắp xếp theo % giảm giá giảm dần.

### 4. Giả Lập Báo Động Sập Giá (Simulate Price Drop)
- **`GET /api/test/simulate-price-drop`**: Kích hoạt còi hú báo động mô phỏng cú sập giá phục vụ thuyết trình/demo pitch.

---

## 🛠️ Cài Đặt & Chạy Local

```bash
# 1. Cài đặt dependencies
npm install

# 2. Cấu hình biến môi trường
cp .env.example .env
# Chỉnh sửa DATABASE_URL trỏ tới PostgreSQL của bạn

# 3. Chạy Prisma Migrate
npx prisma migrate dev --name init
npx prisma generate

# 4. Khởi chạy server
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

---

## 👥 Đội Ngũ Phát Triển (Team DealPing - FA26)
- Dự án EXE101: Ứng Dụng Trợ Lý Săn Deal Sập Giá Đa Sàn TMĐT.
