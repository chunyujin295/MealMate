const { getToday, getWeekRange, formatDate, showToast } = require('../../utils/util');
const { fetchNutritionStats } = require('../../utils/cloud');

Page({
  data: {
    period: 'day',
    periodLabel: '今日',
    summary: {},
    dailyData: [],
    carbsPercent: 0,
    proteinPercent: 0,
    fatPercent: 0,
    macroRatio: { carbs: 0, protein: 0, fat: 0 }
  },

  onLoad() {
    this.loadStats();
  },

  switchPeriod(e) {
    this.setData({ period: e.currentTarget.dataset.period }, () => {
      this.loadStats();
    });
  },

  async loadStats() {
    const { period } = this.data;
    const today = getToday();
    let startDate, endDate, periodLabel;

    if (period === 'day') {
      startDate = today;
      endDate = today;
      periodLabel = '今日';
    } else if (period === 'week') {
      const range = getWeekRange(new Date());
      startDate = range.start;
      endDate = range.end;
      periodLabel = `本周 (${startDate} ~ ${endDate})`;
    } else {
      startDate = today.substring(0, 7) + '-01';
      endDate = today;
      periodLabel = `本月 (${startDate} ~ ${endDate})`;
    }

    try {
      const { summary, dailyData } = await fetchNutritionStats({ startDate, endDate });

      // 计算宏量营养素占比
      const totalMacroCal =
        (summary.totalCarbs || 0) * 4 +
        (summary.totalProtein || 0) * 4 +
        (summary.totalFat || 0) * 9;

      let carbsRatio = 0, proteinRatio = 0, fatRatio = 0;
      if (totalMacroCal > 0) {
        carbsRatio = Math.round(((summary.totalCarbs || 0) * 4 / totalMacroCal) * 100);
        proteinRatio = Math.round(((summary.totalProtein || 0) * 4 / totalMacroCal) * 100);
        fatRatio = Math.round(((summary.totalFat || 0) * 9 / totalMacroCal) * 100);
      }

      // 进度条百分比（基准参考值：碳水 250g, 蛋白质 60g, 脂肪 65g）
      const carbsPercent = Math.min(100, ((summary.totalCarbs || 0) / 250) * 100);
      const proteinPercent = Math.min(100, ((summary.totalProtein || 0) / 60) * 100);
      const fatPercent = Math.min(100, ((summary.totalFat || 0) / 65) * 100);

      this.setData({
        periodLabel,
        summary,
        dailyData: dailyData || [],
        carbsPercent,
        proteinPercent,
        fatPercent,
        macroRatio: { carbs: carbsRatio, protein: proteinRatio, fat: fatRatio }
      });
    } catch (err) {
      showToast('加载统计数据失败');
    }
  }
});
