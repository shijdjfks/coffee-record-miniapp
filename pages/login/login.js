Page({
  data: {
    year: new Date().getFullYear(),
    months: [],
    yearTotal: 0,
    yearShops: 0,
    thisMonth: 0,
    thisMonthShops: 0,
    monthNames: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    canIUse: wx.canIUse('button.open-type.getUserProfile')
  },

  apiBase: 'http://10.7.81.244:8081/api/coffee-records',

  onLoad() {
    this.loadYearData();
  },

  onShow() {
    this.loadYearData();
  },

  checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.showToast({
        title: '已登录',
        icon: 'success'
      });
    }
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
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/add/add'
      });
    }, 100);
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
    wx.showToast({
      title: '查看年度统计',
      icon: 'none',
      duration: 1500
    });
  },

  prevYear() {
    this.setData({ year: this.data.year - 1 }, () => {
      this.loadYearData();
    });
  },

  nextYear() {
    this.setData({ year: this.data.year + 1 }, () => {
      this.loadYearData();
    });
  },

  async loadYearData() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      const year = this.data.year;
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.apiBase}?startDate=${startDate}&endDate=${endDate}`,
          method: 'GET',
          success: resolve,
          fail: reject
        });
      });
      
      wx.hideLoading();
      
      if (res.statusCode === 200) {
        const logs = res.data || [];
        const monthStats = Array(12).fill(0).map(() => ({ cups: 0, shops: new Set() }));
        
        let yearTotal = 0;
        const allShops = new Set();
        
        logs.forEach(log => {
          const month = new Date(log.date).getMonth();
          monthStats[month].cups += log.cups || 1;
          if (log.coffeeShop) {
            monthStats[month].shops.add(log.coffeeShop);
          }
          yearTotal += log.cups || 1;
          if (log.coffeeShop) {
            allShops.add(log.coffeeShop);
          }
        });
        
        const currentMonth = new Date().getMonth();
        const thisMonthData = monthStats[currentMonth];
        
        const months = monthStats.map((stat, index) => ({
          month: index + 1,
          monthName: this.data.monthNames[index],
          cups: stat.cups,
          shops: stat.shops.size,
          isCurrentMonth: index === currentMonth,
          isEmpty: stat.cups === 0
        }));
        
        this.setData({
          months,
          yearTotal,
          yearShops: allShops.size,
          thisMonth: thisMonthData.cups,
          thisMonthShops: thisMonthData.shops.size
        });
      } else {
        throw new Error('请求失败');
      }
      
    } catch (err) {
      wx.hideLoading();
      console.error('加载数据失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      const months = this.data.monthNames.map((name, index) => ({
        month: index + 1,
        monthName: name,
        cups: 0,
        shops: 0,
        isCurrentMonth: index === new Date().getMonth(),
        isEmpty: true
      }));
      this.setData({ months });
    }
  },

  goToMonth(e) {
    const { month } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/month/month?year=${this.data.year}&month=${month}`
    });
  }
});
