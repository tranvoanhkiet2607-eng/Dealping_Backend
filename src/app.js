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

const { scanTopLiveDeals } = require("./services/dealsScannerService");

// API quét trực tiếp các món SALE CHẠM ĐÁY nhiều nhất trên 3 sàn Shopee, TikTok, Lazada
app.get("/api/deals/top-sales", async (req, res) => {
  try {
    const deals = await scanTopLiveDeals();
    res.json({
      status: "success",
      count: deals.length,
      data: deals,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// API test giả lập sập giá để test âm thanh chuông báo động trên web (Demo Trigger)
app.get("/api/test/simulate-price-drop", (req, res) => {
  const { productName, targetPrice, basePrice, oldPrice: queryOldPrice, imageUrl, affiliateUrl } = req.query;
  const numTarget = Number(targetPrice);
  const numBase = Number(basePrice) || Number(queryOldPrice);
  const hasTarget = !isNaN(numTarget) && numTarget > 0;
  const hasBase = !isNaN(numBase) && numBase > 0;

  const oldPrice = hasBase ? numBase : (hasTarget ? Math.round(numTarget * 1.3) : 350000);
  const newPrice = hasTarget ? numTarget : (hasBase ? Math.round(numBase * 0.78) : 99000);

  res.json({
    status: "success",
    isPriceDrop: true,
    message: "Báo động sập giá kích hoạt thành công.",
    data: {
      productName: productName || "Sản phẩm Shopee / TikTok Shop",
      oldPrice,
      newPrice,
      flashSalePrice: newPrice,
      imageUrl: imageUrl || null,
      affiliateUrl: affiliateUrl || null,
      cashbackCommission: Math.round(newPrice * 0.05),
      discountCodes: ["FREESHIP", "GIAM20K"],
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
