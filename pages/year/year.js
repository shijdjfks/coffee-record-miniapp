Page({
  data: {
    year: new Date().getFullYear(),
    months: [],
    yearTotal: 0,
    yearShops: 0,
    thisMonth: 0,
    thisMonthShops: 0,
    monthNames: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  },

  apiBase: 'http://10.7.81.244:8081/api/coffee-records',

  onLoad() {
    this.loadYearData();
  },

  onShow() {
    this.loadYearData();
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
        
        // 过滤掉 date 为 null/undefined/无效 的记录
        const validLogs = logs.filter(log => {
          if (!log.date || typeof log.date !== 'string') {
            console.warn('[year] 跳过无效 date 记录:', log.id, log.date);
            return false;
          }
          return true;
        });
        
        console.log('[year] 有效记录数:', validLogs.length, '/ 总记录数:', logs.length);
        
        const monthStats = Array(12).fill(0).map(() => ({ cups: 0, shops: new Set() }));
        
        let yearTotal = 0;
        const allShops = new Set();
        
        validLogs.forEach(log => {
          // 安全解析日期：使用 YYYY-MM-DD 格式的字符串直接提取月份
          // 避免 new Date() 的时区问题
          const dateParts = log.date.split('-');
          if (dateParts.length >= 2) {
            const month = parseInt(dateParts[1], 10) - 1;  // "01" -> 0 (January)
            if (month >= 0 && month <= 11) {
              monthStats[month].cups += log.cups || 1;
              if (log.coffeeShop) {
                monthStats[month].shops.add(log.coffeeShop);
              }
              yearTotal += log.cups || 1;
              if (log.coffeeShop) {
                allShops.add(log.coffeeShop);
              }
            } else {
              console.warn('[year] 无效月份:', month, 'log.date:', log.date);
            }
          } else {
            console.warn('[year] 日期格式错误:', log.date);
          }
        });
        
        // 打印每月统计，方便调试
        monthStats.forEach((stat, index) => {
          console.log(`[year] ${this.data.monthNames[index]}: ${stat.cups} cups, ${stat.shops.size} shops`);
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
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
