const { MEAL_TYPE_MAP, NUTRITION_FIELDS } = require('../../utils/constants');
const { fetchRecordById } = require('../../utils/cloud');
const { showToast } = require('../../utils/util');

Page({
  data: {
    record: null,
    mealInfo: {},
    nutritionFields: NUTRITION_FIELDS
  },

  onLoad(options) {
    if (options.id) {
      this.loadRecord(options.id);
    }
  },

  async loadRecord(id) {
    try {
      const { record } = await fetchRecordById(id);
      this.setData({
        record,
        mealInfo: MEAL_TYPE_MAP[record.mealType] || {}
      });
    } catch (err) {
      showToast('加载记录失败');
    }
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: this.data.record.images
    });
  },

  handleEdit() {
    wx.navigateTo({
      url: `/pages/record/record?id=${this.data.record._id}`
    });
  },

  handleShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onShareAppMessage() {
    const { record } = this.data;
    return {
      title: `吃了么 - ${record.content || '饮食记录'}`,
      path: `/pages/detail/detail?id=${record._id}`,
      imageUrl: record.images && record.images.length > 0 ? record.images[0] : ''
    };
  }
});
