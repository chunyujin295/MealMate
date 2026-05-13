const { fetchGroupDetail, fetchGroupFeed, leaveGroup, removeMember } = require('../../utils/cloud');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    groupId: '',
    group: {},
    members: [],
    isAdmin: false,
    feed: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ groupId: options.id });
      this.loadDetail();
      this.loadFeed();
    }
  },

  async loadDetail() {
    try {
      const { group, members, isAdmin } = await fetchGroupDetail(this.data.groupId);
      this.setData({ group, members, isAdmin });
    } catch (err) {
      showToast('加载群组信息失败');
    }
  },

  async loadFeed() {
    try {
      const { records } = await fetchGroupFeed(this.data.groupId);
      this.setData({ feed: records || [] });
    } catch (err) {
      console.error('加载动态失败:', err);
    }
  },

  inviteMembers() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });
  },

  async handleLeave() {
    wx.showModal({
      title: '退出群组',
      content: '确定要退出这个群组吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await leaveGroup(this.data.groupId);
            showToast('已退出群组', 'success');
            setTimeout(() => wx.navigateBack(), 1500);
          } catch (err) {
            showToast('退出失败');
          }
        }
      }
    });
  },

  async removeMember(e) {
    const memberId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '移除成员',
      content: '确定要移除该成员吗？',
      confirmColor: '#f44336',
      success: async (res) => {
        if (res.confirm) {
          try {
            await removeMember(this.data.groupId, memberId);
            showToast('已移除', 'success');
            this.loadDetail();
          } catch (err) {
            showToast('移除失败');
          }
        }
      }
    });
  },

  goToRecord(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onShareAppMessage() {
    return {
      title: `邀请你加入群组「${this.data.group.name}」`,
      path: `/pages/group-detail/group-detail?id=${this.data.groupId}`,
      imageUrl: ''
    };
  }
});
