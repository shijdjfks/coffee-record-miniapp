Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserProfile')
  },

  onLoad() {
    // 首页不需要加载年视图数据
  },

  onShow() {
    // 首页不需要刷新年视图数据
  },

  getUserProfile() {
    // 跳转到登录页面
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  skipLogin() {
    wx.showToast({
      title: '已跳过登录',
      icon: 'success'
    });
  },

  goHome() {
    // 已经在首页了，提示一下
    wx.showToast({
      title: '已在首页',
      icon: 'none',
      duration: 1000
    });
  },

  goToAddRecord() {
    wx.switchTab({
      url: '/pages/week/week'
    });
  },

  goToCamera() {
    wx.navigateTo({
      url: '/pages/feed/feed'
    });
  },

  goToStats() {
    // 跳转到年视图查看统计
    wx.switchTab({
      url: '/pages/year/year'
    });
  }
});
