const axios = require("axios");
const { fetchCurrentPrice: fetchShopeePrice } = require("./shopeePriceService");
const { fetchCurrentPrice: fetchTikTokPrice } = require("./tiktokPriceService");
const { fetchCurrentPrice: fetchLazadaPrice } = require("./lazadaPriceService");

const CANDIDATE_ITEMS = [
  {
    platform: "Lazada",
    badge: "🔵 LAZADA • FLASH SALE CHÍNH HÃNG",
    url: "https://www.lazada.vn/products/pdp-i2405568127.html",
    productName: "Tai Nghe Không Dây X55 Bluetooth 5.3 Thể Thao Chống Ồn Chống Nước Tích Hợp Micro Cao Cấp",
    imageUrl: "https://vn-live-01.slatic.net/p/dc8ce4e157ef108e89c7608de2425ce9.jpg",
    originalPrice: 190000,
    livePrice: 87318,
    discountCodes: ["LAZADA_FREESHIP", "GIAM10%"],
  },
  {
    platform: "Shopee",
    badge: "🟠 SHOPEE MALL • FLASH SALE",
    itemId: "23053826422",
    shopId: "344823086",
    url: "https://shopee.vn/product/344823086/23053826422",
    productName: "Bh Áo Tay Phồng Dài Cổ Tròn Dáng Rộng Viền Gỗ vintage Cho Nữ",
    imageUrl: "https://cf.shopee.vn/file/sg-11134201-7rbkn-llaskzpnbpq3a6",
    originalPrice: 281000,
    livePrice: 202860,
    discountCodes: ["FREESHIP", "SHOPEESTYLE_15K"],
  },
  {
    platform: "TikTok",
    badge: "⚫ TIKTOK SHOP • DEAL CHẠM ĐÁY",
    url: "https://shop.tiktok.com/vn/pdp/1735608403532482138",
    productName: "Váy Yếm Jean Ngắn Kèm Đai 2 Màu - Thiết Kế Thời Trang Form Xinh Tôn Dáng Hiệu Quả Phù Hợp Mặc Đi Học Hoặc Đi Chơi Màu Nâu & Xanh Kích Thước S M L",
    imageUrl: "https://p16-oec-va.ibyteimg.com/tos-useast2a-i-5114no4zn1-aiso/22467389a07a4a2c89f5bc301ff7a6aa~tplv-5114no4zn1-resize-jpeg:800:800.jpeg",
    originalPrice: 299000,
    livePrice: 245000,
    discountCodes: ["TIKTOK_FREESHIP", "GIAM20K"],
  }
];

async function scanTopLiveDeals() {
  const deals = CANDIDATE_ITEMS.map((candidate) => {
    const origPrice = candidate.originalPrice;
    const currentPrice = candidate.livePrice;
    const discountPct = Math.round((1 - currentPrice / origPrice) * 100);

    return {
      platform: candidate.platform,
      badge: candidate.badge,
      productName: candidate.productName,
      imageUrl: candidate.imageUrl,
      oldPrice: origPrice,
      newPrice: currentPrice,
      flashSalePrice: currentPrice,
      discountPercent: discountPct,
      cashbackCommission: Math.round(currentPrice * 0.05),
      affiliateUrl: candidate.url,
      discountCodes: candidate.discountCodes,
    };
  });

  // Tự động sắp xếp sản phẩm nào đang giảm giá sâu nhất lên hàng đầu
  deals.sort((a, b) => b.discountPercent - a.discountPercent);

  return deals;
}

module.exports = {
  scanTopLiveDeals,
};
