const { getToday, formatDate, timeAgo, showToast } = require('../../utils/util');
const { fetchRecords, fetchNutritionStats } = require('../../utils/cloud');
const { MEAL_TYPES } = require('../../utils/constants');

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

Page({
  data: {
    currentDate: getToday(),
    displayDate: '',
    weekday: '',
    isToday: true,
    mealTypes: MEAL_TYPES,
    mealRecords: {},
    todaySummary: {},
    totalRecords: 0
  },

  onLoad() {
    this.updateDisplayDate();
  },

  onShow() {
    this.loadRecords();
  },

  onPullDownRefresh() {
    this.loadRecords().then(() => wx.stopPullDownRefresh());
  },

  updateDisplayDate() {
    const d = new Date(this.data.currentDate);
    const today = getToday();
    const displayDate = formatDate(d, 'MM月DD日');
    const weekday = `星期${WEEKDAY_NAMES[d.getDay()]}`;
    const isToday = this.data.currentDate === today;

    this.setData({ displayDate, weekday, isToday });
  },

  goPrevDay() {
    const d = new Date(this.data.currentDate);
    d.setDate(d.getDate() - 1);
    this.setData({ currentDate: formatDate(d) }, () => {
      this.updateDisplayDate();
      this.loadRecords();
    });
  },

  goNextDay() {
    const d = new Date(this.data.currentDate);
    d.setDate(d.getDate() + 1);
    this.setData({ currentDate: formatDate(d) }, () => {
      this.updateDisplayDate();
      this.loadRecords();
    });
  },

  goToday() {
    this.setData({ currentDate: getToday() }, () => {
      this.updateDisplayDate();
      this.loadRecords();
    });
  },

  async loadRecords() {
    try {
      const today = getToday();
      const { currentDate } = this.data;

      const { records } = await fetchRecords({ date: currentDate });

      const mealRecords = {};
      MEAL_TYPES.forEach(m => { mealRecords[m.key] = []; });

      let totalRecords = 0;
      records.forEach(r => {
        totalRecords++;
        if (mealRecords[r.mealType]) {
          mealRecords[r.mealType].push({
            ...r,
            timeText: timeAgo(r.createdAt)
          });
        }
      });

      // 今日营养统计
      let todaySummary = {};
      if (currentDate === today) {
        const stats = await fetchNutritionStats({ startDate: today, endDate: today });
        todaySummary = stats.summary || {};
      } else {
        const stats = await fetchNutritionStats({
          startDate: currentDate,
          endDate: currentDate
        });
        todaySummary = stats.summary || {};
      }

      this.setData({ mealRecords, todaySummary, totalRecords });
    } catch (err) {
      console.error('加载记录失败:', err);
      showToast('加载失败，请下拉刷新');
    }
  },

  addRecord(e) {
    const { meal } = e.currentTarget.dataset;
    let url = '/pages/record/record';
    if (meal) url += `?mealType=${meal}`;
    url += `&date=${this.data.currentDate}`;
    wx.navigateTo({ url });
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  goToNutrition() {
    wx.navigateTo({ url: '/pages/nutrition/nutrition' });
  }
});
