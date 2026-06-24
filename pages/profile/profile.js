Page({
  data: {
    avatarUrl: '',
    nickName: '',
    totalCups: 0,
    totalShops: 0,
    daysActive: 0
  },

  onShow() {
    // 从缓存读取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        avatarUrl: userInfo.avatarUrl || '',
        nickName: userInfo.nickName || ''
      })
    }

    // 加载统计数据（调用后端或云函数）
    this.loadStats()
  },

  // 模拟加载统计数据，后续可对接后端
  loadStats() {
    // 从本地缓存读取模拟数据，真实场景应调用后端 API
    const stats = wx.getStorageSync('coffeeStats')
    if (stats) {
      this.setData({
        totalCups: stats.totalCups || 0,
        totalShops: stats.totalShops || 0,
        daysActive: stats.daysActive || 0
      })
    } else {
      // 设置示例占位数据
      this.setData({
        totalCups: '--',
        totalShops: '--',
        daysActive: '--'
      })
    }
  },

  login() {
    // 跳转到登录页面进行登录
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  goToYear() {
    wx.switchTab({
      url: '/pages/year/year'
    })
  },

  goToWeek() {
    wx.switchTab({
      url: '/pages/week/week'
    })
  },

  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    })
  },

  showAbout() {
    wx.showModal({
      title: '关于 Brewlog',
      content: '☕ Brewlog v1.0\n\n个人咖啡手帐小程序\n记录每一杯咖啡的美好时光',
      showCancel: false,
      confirmText: '好的'
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
