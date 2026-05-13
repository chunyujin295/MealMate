App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上版本的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'cloud1-d7g5qr3qbb6bb5662',
      traceUser: true
    });

    this.autoLogin();
  },

  async autoLogin() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'login',
        data: {}
      });
      this.globalData.userInfo = result.userInfo;
      this.globalData.isLoggedIn = true;
    } catch (err) {
      console.error('登录失败:', err);
      this.globalData.isLoggedIn = false;
    }
    if (this.loginCallback) {
      this.loginCallback(this.globalData.isLoggedIn);
    }
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    mealTypes: [
      { key: 'breakfast', label: '早餐', icon: '🌅' },
      { key: 'lunch', label: '午餐', icon: '☀️' },
      { key: 'dinner', label: '晚餐', icon: '🌙' },
      { key: 'snack', label: '加餐', icon: '🍪' }
    ],
    nutritionFields: [
      { key: 'calories', label: '热量', unit: 'kcal' },
      { key: 'carbs', label: '碳水', unit: 'g' },
      { key: 'protein', label: '蛋白质', unit: 'g' },
      { key: 'fat', label: '脂肪', unit: 'g' },
      { key: 'fiber', label: '膳食纤维', unit: 'g' },
      { key: 'sodium', label: '钠', unit: 'mg' }
    ]
  }
});
