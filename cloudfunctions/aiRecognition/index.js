const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const BAIDU_API_KEY = process.env.BAIDU_API_KEY || '';
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || '';
const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const BAIDU_DISH_URL = 'https://aip.baidubce.com/rest/2.0/image-classify/v2/dish';

const FOOD_NUTRITION_DB = {
  '米饭': { calories: 116, carbs: 25.9, protein: 2.6, fat: 0.3, fiber: 0.3, sodium: 2 },
  '面条': { calories: 110, carbs: 24.3, protein: 4.2, fat: 0.6, fiber: 0.7, sodium: 3 },
  '馒头': { calories: 223, carbs: 44.2, protein: 7.0, fat: 1.1, fiber: 1.3, sodium: 165 },
  '鸡蛋': { calories: 144, carbs: 2.8, protein: 13.3, fat: 8.8, fiber: 0, sodium: 131 },
  '鸡肉': { calories: 167, carbs: 1.3, protein: 19.3, fat: 9.4, fiber: 0, sodium: 63 },
  '猪肉': { calories: 395, carbs: 2.4, protein: 13.2, fat: 37, fiber: 0, sodium: 59 },
  '牛肉': { calories: 125, carbs: 2.0, protein: 19.9, fat: 4.2, fiber: 0, sodium: 84 },
  '鱼肉': { calories: 104, carbs: 0.5, protein: 17.6, fat: 3.4, fiber: 0, sodium: 43 },
  '虾': { calories: 93, carbs: 2.8, protein: 18.6, fat: 0.8, fiber: 0, sodium: 165 },
  '西红柿': { calories: 19, carbs: 4.0, protein: 0.9, fat: 0.2, fiber: 1.2, sodium: 5 },
  '黄瓜': { calories: 15, carbs: 2.9, protein: 0.6, fat: 0.2, fiber: 0.5, sodium: 3 },
  '白菜': { calories: 13, carbs: 2.7, protein: 1.4, fat: 0.2, fiber: 1.0, sodium: 57 },
  '土豆': { calories: 76, carbs: 17.5, protein: 2.0, fat: 0.2, fiber: 0.4, sodium: 6 },
  '豆腐': { calories: 81, carbs: 3.8, protein: 8.1, fat: 3.7, fiber: 0.4, sodium: 7 },
  '牛奶': { calories: 54, carbs: 5.2, protein: 3.0, fat: 3.2, fiber: 0, sodium: 37 },
  '苹果': { calories: 52, carbs: 13.8, protein: 0.3, fat: 0.2, fiber: 2.4, sodium: 1 },
  '香蕉': { calories: 91, carbs: 20.8, protein: 1.4, fat: 0.2, fiber: 2.6, sodium: 1 },
  '橙子': { calories: 47, carbs: 11.8, protein: 0.9, fat: 0.1, fiber: 2.4, sodium: 1 },
  '面包': { calories: 312, carbs: 58.6, protein: 8.8, fat: 5.1, fiber: 2.7, sodium: 230 },
  '汉堡': { calories: 256, carbs: 30.3, protein: 12.0, fat: 9.8, fiber: 1.2, sodium: 378 },
  '饺子': { calories: 220, carbs: 28.0, protein: 9.0, fat: 8.0, fiber: 0.8, sodium: 350 },
  '炒青菜': { calories: 45, carbs: 6.0, protein: 2.5, fat: 1.5, fiber: 2.0, sodium: 200 },
  '火锅': { calories: 180, carbs: 8.0, protein: 12.0, fat: 10.0, fiber: 1.5, sodium: 800 }
};

function matchNutrition(foodName) {
  for (const [key, value] of Object.entries(FOOD_NUTRITION_DB)) {
    if (foodName.includes(key)) return value;
  }
  return { calories: 150, carbs: 15, protein: 8, fat: 6, fiber: 1, sodium: 100 };
}

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (options.data) req.write(options.data);
    req.end();
  });
}

let cachedToken = { access_token: '', expiresAt: 0 };

async function getBaiduToken() {
  if (cachedToken.access_token && Date.now() < cachedToken.expiresAt) {
    return cachedToken.access_token;
  }

  if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
    throw new Error('百度API密钥未配置，请在云函数环境变量中设置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY');
  }

  const data = await httpRequest(
    `${BAIDU_TOKEN_URL}?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`
  );

  if (data.error) {
    throw new Error(`获取百度token失败: ${data.error_description || data.error}`);
  }

  cachedToken = {
    access_token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000
  };

  return cachedToken.access_token;
}

async function recognizeDish(imageBase64) {
  const token = await getBaiduToken();
  const data = await httpRequest(`${BAIDU_DISH_URL}?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: `image=${encodeURIComponent(imageBase64)}&top_num=3`
  });

  if (data.error_code) {
    throw new Error(`百度识别失败: ${data.error_msg}`);
  }

  if (!data.result || data.result.length === 0) {
    return [];
  }

  return data.result.map(item => ({
    name: item.name,
    confidence: item.calorie || 0,
    nutrition: matchNutrition(item.name)
  }));
}

exports.main = async (event) => {
  const { action, imageUrl, imageBase64 } = event;

  switch (action) {
    case 'recognize': {
      let imageData = imageBase64;

      if (!imageData && imageUrl) {
        const { fileContent } = await cloud.downloadFile({ fileID: imageUrl });
        imageData = Buffer.from(fileContent).toString('base64');
      }

      if (!imageData) {
        return { errCode: 1, errMsg: '请提供图片数据' };
      }

      const results = await recognizeDish(imageData);
      return { results };
    }

    default:
      return { errCode: 2, errMsg: `未知操作: ${action}` };
  }
};
