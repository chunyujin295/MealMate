const app = getApp();
const { fetchMyGroups } = require('../../utils/cloud');
const { showToast } = require('../../utils/util');

Page({
  data: {
    groups: [],
    userId: ''
  },

  onShow() {
    this.loadGroups();
  },

  async loadGroups() {
    try {
      const { groups } = await fetchMyGroups();
      const userId = app.globalData.userInfo?._openid || '';
      this.setData({ groups, userId });
    } catch (err) {
      showToast('加载群组失败');
    }
  },

  createGroup() {
    wx.navigateTo({ url: '/pages/group-create/group-create' });
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/group-detail/group-detail?id=${id}` });
  }
});
