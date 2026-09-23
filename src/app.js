const express = require("express");
const cors = require("cors");
const trackingItemsRoutes = require("./routes/trackingItems.routes");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

// API test giả lập sập giá để test âm thanh chuông báo động trên web
app.get("/api/test/simulate-price-drop", (req, res) => {
  res.json({
    status: "success",
    isPriceDrop: true,
    message: "Báo động sập giá! Nút test gọi thành công.",
    data: {
      productName: "Chuột không dây Logitech (Test)",
      oldPrice: 350000,
      newPrice: 99000,
      flashSalePrice: 99000,
      cashbackCommission: 5000,
      discountCodes: ["GIAM99K", "FREESHIP"],
      timestamp: new Date().toISOString()
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tracking-items", trackingItemsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
