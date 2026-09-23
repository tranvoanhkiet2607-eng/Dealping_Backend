const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const { parseShopeeLink } = require("./linkParser.service");
const { fetchCurrentPrice } = require("./shopeePriceService");

/**
 * unlockedSlot2 = false -> tối đa 1 item
 * unlockedSlot2 = true  -> tối đa 2 item (hard cap theo yêu cầu)
 */
function getMaxSlots(user) {
  return user.unlockedSlot2 ? 2 : 1;
}

async function createTrackingItem({ userId, shopeeUrl, targetPrice, variantName, selectedModelId }) {
  if (!userId || !shopeeUrl || targetPrice === undefined) {
    throw new ApiError(400, "Thiếu userId, shopeeUrl hoặc targetPrice");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "Không tìm thấy user");
  }

  // ---- VALIDATION CỨNG: chặn tạo item thứ 3 (hoặc thứ 2 nếu chưa unlock) ----
  const currentCount = await prisma.trackingItem.count({ where: { userId } });
  const maxSlots = getMaxSlots(user);

  if (currentCount >= maxSlots) {
    throw new ApiError(
      400,
      `Bạn đã đạt giới hạn ${maxSlots} sản phẩm theo dõi. Vui lòng xoá bớt hoặc mở khoá thêm slot.`
    );
  }
  // ---------------------------------------------------------------------

  const { itemId, shopId, resolvedUrl } = await parseShopeeLink(shopeeUrl);

  // Kiểm tra user đã theo dõi item này chưa (tránh trùng lặp trong 2 slot)
  const existingWhere = itemId
    ? { userId, itemId: BigInt(itemId) }
    : { userId, shopeeUrl: resolvedUrl };

  const existing = await prisma.trackingItem.findFirst({
    where: existingWhere,
  });
  if (existing) {
    throw new ApiError(400, "Bạn đã theo dõi sản phẩm này rồi");
  }

  let currentPrice = null;
  let productName = null;
  try {
    const priceInfo = await fetchCurrentPrice(itemId, shopId);
    currentPrice = priceInfo.price;
    productName = priceInfo.productName;
  } catch {
    // Không chặn việc tạo item nếu Shopee tạm thời không phản hồi -
    // job check giá định kỳ sẽ tự cập nhật lại sau.
  }

  const item = await prisma.trackingItem.create({
    data: {
      userId,
      productName,
      itemId: itemId ? BigInt(itemId) : null,
      shopId: shopId ? BigInt(shopId) : null,
      originalPrice: currentPrice,
      targetPrice,
      shopeeUrl: resolvedUrl,
      status: "TRACKING",
      variantName,
      selectedModelId: selectedModelId ? BigInt(selectedModelId) : null,
    },
  });

  return serializeItem(item);
}

async function listTrackingItems(userId) {
  if (!userId) throw new ApiError(400, "Thiếu userId");
  const items = await prisma.trackingItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return items.map(serializeItem);
}

async function deleteTrackingItem(id, userId) {
  const item = await prisma.trackingItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) {
    throw new ApiError(404, "Không tìm thấy item để xoá");
  }
  await prisma.trackingItem.delete({ where: { id } });
}

// BigInt không tự serialize sang JSON được -> convert sang string trước khi trả response
function serializeItem(item) {
  return {
    ...item,
    itemId: item.itemId?.toString() ?? null,
    shopId: item.shopId?.toString() ?? null,
    selectedModelId: item.selectedModelId?.toString() ?? null,
  };
}

async function getTrackingItemHistory(id) {
  const item = await prisma.trackingItem.findUnique({ where: { id } });
  if (!item) {
    throw new ApiError(404, "Không tìm thấy item");
  }

  const history = await prisma.priceHistory.findMany({
    where: { trackingItemId: id },
    orderBy: { timestamp: "desc" },
  });

  return history;
}

async function previewTrackingItem(shopeeUrl) {
  if (!shopeeUrl) throw new ApiError(400, "Thiếu shopeeUrl");
  const { itemId, shopId, resolvedUrl } = await parseShopeeLink(shopeeUrl);
  let currentPrice = null;
  let productName = null;

  // Helper: trích tên sản phẩm từ Shopee URL (slug trước -i.shopId.itemId)
  function extractShopeeNameFromUrl(url) {
    try {
      const pathname = new URL(url).pathname;
      // Pattern: /Ten-san-pham-i.shopId.itemId
      const match = pathname.match(/^\/(.+)-i\.\d+\.\d+/);
      if (match) {
        return decodeURIComponent(match[1])
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
          .trim();
      }
      // Pattern: /product/shopId/itemId (không có tên)
      return null;
    } catch {
      return null;
    }
  }

  // ── Xác định platform dựa trên hostname của resolvedUrl ──────────────────
  let hostname = "";
  try { hostname = new URL(resolvedUrl).hostname; } catch { /* ignore */ }

  const isLazada = hostname.includes("lazada");
  const isTikTok = hostname.includes("tiktok");
  const isShopee = !isLazada && !isTikTok; // mọi thứ còn lại coi là Shopee

  if (isShopee) {
    // Preview: chỉ trích tên từ URL slug, không gọi Shopee API (bị block → treo request)
    // Giá thật sẽ được lấy khi user kích hoạt Radar (createTrackingItem)
    productName = extractShopeeNameFromUrl(resolvedUrl) || "Sản phẩm Shopee";
    currentPrice = null;
  } else if (isLazada) {
    // Lazada: trích tên từ URL slug
    // Pattern 1: /products/Ten-San-Pham-i539784851-s9802267124.html
    // Pattern 2: /products/Ten-San-Pham
    const matchSlug =
      resolvedUrl.match(/\/products\/([^/?#]+?)-i\d+/) ||
      resolvedUrl.match(/\/products\/([^/?#]+?)(?:-s\d+)?(?:\.html|\?|$|#)/) ||
      resolvedUrl.match(/\/products\/([^/?#]+)/);
    if (matchSlug) {
      productName = decodeURIComponent(matchSlug[1])
        .replace(/-/g, " ")
        .trim()
        // Viết hoa chữ đầu mỗi từ (tiếng Anh); giữ nguyên các từ tiếng Việt
        .replace(/\b([a-zA-Z])/g, (l) => l.toUpperCase());
    } else {
      productName = "Sản phẩm Lazada";
    }
    // Lazada block Axios → không lấy được giá thật; để null (frontend hiện "Chưa có giá")
    currentPrice = null;
  } else if (isTikTok) {
    // TikTok Shop: trích tên từ URL nếu có
    try {
      const tiktokPath = new URL(resolvedUrl).pathname;
      const tiktokMatch = tiktokPath.match(/\/view\/item\/(\d+)/) ||
                          tiktokPath.match(/\/product\/([^/?#]+)/);
      productName = tiktokMatch ? "Sản phẩm TikTok Shop" : "Sản phẩm TikTok Shop";
    } catch {
      productName = "Sản phẩm TikTok Shop";
    }
    // TikTok block Axios → không lấy được giá thật
    currentPrice = null;
  } else {
    // Shopee nhưng không có itemId/shopId → fallback tên từ URL
    productName = extractShopeeNameFromUrl(resolvedUrl) || "Sản phẩm Shopee";
    currentPrice = null;
  }

  return {
    productName,
    currentPrice,
    resolvedUrl,
    variants: [
      "Mặc định (Tất cả phân loại)",
      "Màu Đen",
      "Màu Trắng",
      "Size M",
      "Size L"
    ]
  };
}

module.exports = {
  getMaxSlots,
  createTrackingItem,
  listTrackingItems,
  deleteTrackingItem,
  getTrackingItemHistory,
  previewTrackingItem,
};
