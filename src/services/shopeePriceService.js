const axios = require("axios");
const ApiError = require("../utils/ApiError");

// LƯU Ý QUAN TRỌNG (đúng rủi ro #1 trong bản kế hoạch DealPing):
// Endpoint dưới đây là API public không chính thức của Shopee (v4/item/get),
// dùng tạm cho giai đoạn MVP. Về lâu dài PHẢI thay bằng Shopee Affiliate Open API
// chính thức để tránh bị chặn IP - xem lại mục V (Ma trận rủi ro) trong plan.
const SHOPEE_ITEM_ENDPOINT = "https://shopee.vn/api/v4/item/get";

/**
 * Gọi API lấy thông tin giá hiện tại của sản phẩm theo itemId + shopId.
 * Giá trả về từ Shopee là số nguyên đã nhân 100000 (đơn vị nhỏ nhất) -> cần chia lại.
 */
async function fetchCurrentPrice(itemId, shopId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    const { data } = await axios.get(SHOPEE_ITEM_ENDPOINT, {
      params: { itemid: itemId, shopid: shopId },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      timeout: 2500,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const item = data?.data;
    if (!item || typeof item.price !== "number") {
      throw new ApiError(502, "Shopee không trả về dữ liệu giá hợp lệ");
    }

    return {
      price: item.price / 100000,
      productName: item.name,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, "Không gọi được API giá Shopee", { cause: err.message });
  }
}

module.exports = { fetchCurrentPrice };
