const { createGroup } = require('../../utils/cloud');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    name: '',
    description: '',
    isPrivate: true
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  onPrivateChange(e) {
    this.setData({ isPrivate: e.detail.value });
  },

  async handleCreate() {
    const { name, description, isPrivate } = this.data;

    if (!name.trim()) {
      showToast('请输入群组名称');
      return;
    }

    showLoading('创建中...');
    try {
      const { group } = await createGroup({
        name: name.trim(),
        description: description.trim(),
        isPrivate
      });
      hideLoading();
      showToast('创建成功', 'success');

      // 跳转到群组详情页
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/group-detail/group-detail?id=${group._id}` });
      }, 1000);
    } catch (err) {
      hideLoading();
      showToast('创建失败，请重试');
    }
  }
});
