function formatDate(date, format = 'YYYY-MM-DD') {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

function getToday() {
  return formatDate(new Date());
}

function getWeekRange(date) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  };
}

function getMonthDays(year, month) {
  const days = [];
  const date = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();

  let firstWeekDay = date.getDay();
  if (firstWeekDay === 0) firstWeekDay = 7;

  for (let i = 1; i < firstWeekDay; i++) {
    days.push({ day: '', isEmpty: true });
  }

  const today = getToday();
  for (let i = 1; i <= lastDay; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({
      day: i,
      date: dateStr,
      isToday: dateStr === today,
      isEmpty: false
    });
  }

  while (days.length % 7 !== 0) {
    days.push({ day: '', isEmpty: true });
  }

  return days;
}

function timeAgo(dateStr) {
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diff = now - target;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;
  return formatDate(dateStr, 'MM-DD');
}

function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 });
}

function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true });
}

function hideLoading() {
  wx.hideLoading();
}

async function chooseAndCompressImage(count = 1) {
  const { tempFiles } = await wx.chooseMedia({
    count,
    mediaType: ['image'],
    sizeType: ['compressed'],
    sourceType: ['album', 'camera']
  });

  const compressPromises = tempFiles.map(file => {
    return new Promise((resolve) => {
      wx.compressImage({
        src: file.tempFilePath,
        quality: 70,
        success: (res) => resolve(res.tempFilePath),
        fail: () => resolve(file.tempFilePath)
      });
    });
  });

  return Promise.all(compressPromises);
}

async function uploadToCloud(filePath, cloudPath) {
  const { fileID } = await wx.cloud.uploadFile({
    cloudPath,
    filePath
  });
  return fileID;
}

module.exports = {
  formatDate,
  getToday,
  getWeekRange,
  getMonthDays,
  timeAgo,
  debounce,
  showToast,
  showLoading,
  hideLoading,
  chooseAndCompressImage,
  uploadToCloud
};
