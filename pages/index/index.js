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
    wx.getUserProfile({
      desc: '用于完善您的咖啡手帐记录',
      success: (res) => {
        const userInfo = {
          avatarUrl: res.userInfo.avatarUrl,
          nickName: res.userInfo.nickName
        };
        wx.setStorageSync('userInfo', userInfo);
        wx.showToast({
          title: '登录成功！',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '请允许授权',
          icon: 'none'
        });
      }
    });
  },

  skipLogin() {
    wx.showToast({
      title: '已跳过登录',
      icon: 'success'
    });
  },

  goHome() {
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
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const icons = ['☕', '🍵', '🧋', '🥤', '☕️', '🫖'];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        
        wx.showModal({
          title: '📸 拍照生成小图标',
          content: `已为你生成专属咖啡图标：${randomIcon}`,
          confirmText: '去添加记录',
          cancelText: '好的',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.switchTab({
                url: '/pages/week/week'
              });
              setTimeout(() => {
                wx.navigateTo({
                  url: `/pages/add/add?icon=${encodeURIComponent(randomIcon)}&photo=${encodeURIComponent(tempFilePath)}`
                });
              }, 100);
            }
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '未选择照片',
          icon: 'none'
        });
      }
    });
  },

  goToStats() {
    // 跳转到年视图查看统计
    wx.switchTab({
      url: '/pages/year/year'
    });
  }
});
