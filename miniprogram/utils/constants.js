const MEAL_TYPES = [
  { key: 'breakfast', label: '早餐', icon: '🌅', order: 1 },
  { key: 'lunch', label: '午餐', icon: '☀️', order: 2 },
  { key: 'dinner', label: '晚餐', icon: '🌙', order: 3 },
  { key: 'snack', label: '加餐', icon: '🍪', order: 4 }
];

const MEAL_TYPE_MAP = {};
MEAL_TYPES.forEach(m => { MEAL_TYPE_MAP[m.key] = m; });

const NUTRITION_FIELDS = [
  { key: 'calories', label: '热量', unit: 'kcal', icon: '🔥' },
  { key: 'carbs', label: '碳水', unit: 'g', icon: '🍚' },
  { key: 'protein', label: '蛋白质', unit: 'g', icon: '🥩' },
  { key: 'fat', label: '脂肪', unit: 'g', icon: '🧈' },
  { key: 'fiber', label: '膳食纤维', unit: 'g', icon: '🥬' },
  { key: 'sodium', label: '钠', unit: 'mg', icon: '🧂' }
];

const VISIBILITY_OPTIONS = [
  { key: 'private', label: '仅自己可见', icon: '🔒' },
  { key: 'public', label: '全部群组可见', icon: '🌐' }
];

const MAX_IMAGES = 9;
const IMAGE_COMPRESS_QUALITY = 70;
const PAGE_SIZE = 20;

module.exports = {
  MEAL_TYPES,
  MEAL_TYPE_MAP,
  NUTRITION_FIELDS,
  VISIBILITY_OPTIONS,
  MAX_IMAGES,
  IMAGE_COMPRESS_QUALITY,
  PAGE_SIZE
};
