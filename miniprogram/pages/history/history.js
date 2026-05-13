const { getToday, formatDate, getMonthDays, showToast } = require('../../utils/util');
const { fetchRecords } = require('../../utils/cloud');
const { MEAL_TYPES, PAGE_SIZE } = require('../../utils/constants');

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

Page({
  data: {
    viewMode: 'calendar',
    // 日历视图
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    calendarDays: [],
    recordDates: {},
    selectedDate: '',
    selectedRecords: [],
    weekDays: WEEK_DAYS,
    // 列表视图
    filterDate: '',
    mealFilterIndex: 0,
    mealFilterOptions: ['全部餐次', '早餐', '午餐', '晚餐', '加餐'],
    listRecords: [],
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.buildCalendar();
  },

  async onShow() {
    await this.loadRecordDates();
    this.buildCalendar();
  },

  async loadRecordDates() {
    try {
      const { records } = await fetchRecords({ pageSize: 500 });
      const recordDates = {};
      records.forEach(r => {
        if (!recordDates[r.date]) recordDates[r.date] = [];
        recordDates[r.date].push(r);
      });
      this.setData({ recordDates });
    } catch (err) {
      console.error('加载记录日期失败:', err);
    }
  },

  buildCalendar() {
    const { currentYear, currentMonth, recordDates } = this.data;
    const days = getMonthDays(currentYear, currentMonth);
    const calendarDays = days.map(d => ({
      ...d,
      hasRecord: !d.isEmpty && !!recordDates[d.date] && recordDates[d.date].length > 0
    }));
    this.setData({ calendarDays });
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 0) {
      this.setData({ currentYear: currentYear - 1, currentMonth: 11 });
    } else {
      this.setData({ currentMonth: currentMonth - 1 });
    }
    setTimeout(() => this.buildCalendar(), 50);
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 11) {
      this.setData({ currentYear: currentYear + 1, currentMonth: 0 });
    } else {
      this.setData({ currentMonth: currentMonth + 1 });
    }
    setTimeout(() => this.buildCalendar(), 50);
  },

  selectDay(e) {
    const { date } = e.currentTarget.dataset;
    if (!date) return;
    const records = this.data.recordDates[date] || [];
    const mealIcons = {};
    MEAL_TYPES.forEach(m => { mealIcons[m.key] = m.icon; });

    this.setData({
      selectedDate: date,
      selectedRecords: records.map(r => ({
        ...r,
        mealIcon: mealIcons[r.mealType] || '🍽️'
      }))
    });
  },

  switchView(e) {
    const { mode } = e.currentTarget.dataset;
    this.setData({ viewMode: mode });
    if (mode === 'list') {
      this.loadListRecords(true);
    }
  },

  async loadListRecords(reset = false) {
    try {
      const page = reset ? 1 : this.data.page;
      const params = { page, pageSize: PAGE_SIZE };

      if (this.data.filterDate) params.date = this.data.filterDate;
      if (this.data.mealFilterIndex > 0) {
        params.mealType = MEAL_TYPES[this.data.mealFilterIndex - 1].key;
      }

      const { records, total } = await fetchRecords(params);

      const mealIcons = {};
      MEAL_TYPES.forEach(m => {
        mealIcons[m.key] = { icon: m.icon, label: m.label };
      });

      const mapped = records.map(r => ({
        ...r,
        mealIcon: mealIcons[r.mealType]?.icon || '🍽️',
        mealTypeLabel: mealIcons[r.mealType]?.label || r.mealType
      }));

      const listRecords = reset ? mapped : [...this.data.listRecords, ...mapped];
      const hasMore = listRecords.length < total;

      this.setData({
        listRecords,
        page: page + 1,
        hasMore
      });
    } catch (err) {
      showToast('加载失败');
    }
  },

  onFilterDateChange(e) {
    this.setData({ filterDate: e.detail.value }, () => this.loadListRecords(true));
  },

  onMealFilterChange(e) {
    this.setData({ mealFilterIndex: parseInt(e.detail.value) }, () => this.loadListRecords(true));
  },

  clearFilters() {
    this.setData({ filterDate: '', mealFilterIndex: 0 }, () => this.loadListRecords(true));
  },

  loadMore() {
    if (!this.data.hasMore) return;
    this.loadListRecords(false);
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
