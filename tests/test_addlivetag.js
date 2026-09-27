const axios = require("axios");

async function testAddLiveTag() {
  const key = "d6a8444ee2905b22025df808705841ce5a0e5f168dc3f83b";
  const shopeeItemId = "23053826422";
  const tiktokUrl = "https://shop.tiktok.com/vn/pdp/1735608403532482138";
  const lazadaUrl = "https://www.lazada.vn/products/tai-nghe-i123456.html";

  console.log("--- 1. Testing Shopee ---");
  try {
    const res1 = await axios.get(`https://data.addlivetag.com/product-data/product-data.php?item_id=${shopeeItemId}&key=${key}`, { timeout: 10000 });
    console.log("Shopee response data:", res1.data);
  } catch (e) {
    console.log("Shopee error:", e.response?.status, e.message);
  }

  console.log("--- 2. Testing TikTok ---");
  try {
    const res2 = await axios.get(`https://data.addlivetag.com/tiktok/product.php?url=${encodeURIComponent(tiktokUrl)}&key=${key}`, { timeout: 10000 });
    console.log("TikTok response data:", res2.data);
  } catch (e) {
    console.log("TikTok error:", e.response?.status, e.message);
  }

  console.log("--- 3. Testing Lazada ---");
  try {
    const res3 = await axios.get(`https://data.addlivetag.com/lazada/product.php?url=${encodeURIComponent(lazadaUrl)}&key=${key}`, { timeout: 10000 });
    console.log("Lazada response data:", res3.data);
  } catch (e) {
    console.log("Lazada error:", e.response?.status, e.message);
  }
}

testAddLiveTag();
