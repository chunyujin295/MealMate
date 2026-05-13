const app = getApp();
const { formatDate, showToast } = require('../../utils/util');
const { updateUser, fetchUser } = require('../../utils/cloud');

Page({
  data: {
    userInfo: {}
  },

  onShow() {
    this.loadUser();
  },

  loadUser() {
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo });
    } else {
      fetchUser().then(res => {
        this.setData({ userInfo: res.userInfo });
      }).catch(() => {});
    }
  },

  formatCreateTime(timestamp) {
    if (!timestamp) return '';
    return formatDate(new Date(timestamp), 'YYYY-MM-DD');
  },

  editProfile() {
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '输入新昵称',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await updateUser({ nickName: res.content.trim() });
            app.globalData.userInfo = { ...app.globalData.userInfo, nickName: res.content.trim() };
            this.loadUser();
            showToast('昵称已更新', 'success');
          } catch (err) {
            showToast('更新失败');
          }
        }
      }
    });
  },

  async updateAvatar() {
    try {
      const { tempFiles } = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      wx.showLoading({ title: '上传中...' });

      const cloudPath = `avatars/${Date.now()}.jpg`;
      const { fileID } = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFiles[0].tempFilePath
      });

      await updateUser({ avatarUrl: fileID });
      app.globalData.userInfo = { ...app.globalData.userInfo, avatarUrl: fileID };
      this.loadUser();
      wx.hideLoading();
      showToast('头像已更新', 'success');
    } catch (err) {
      wx.hideLoading();
      if (!err.errMsg || !err.errMsg.includes('cancel')) {
        showToast('上传失败');
      }
    }
  },

  async setPrivacy(e) {
    const privacy = e.currentTarget.dataset.value;
    try {
      await updateUser({ privacy });
      app.globalData.userInfo = { ...app.globalData.userInfo, privacy };
      this.loadUser();
      showToast('隐私设置已更新', 'success');
    } catch (err) {
      showToast('设置失败');
    }
  },

  goToNutrition() {
    wx.navigateTo({ url: '/pages/nutrition/nutrition' });
  },

  goToHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goToGroups() {
    wx.switchTab({ url: '/pages/groups/groups' });
  }
});
