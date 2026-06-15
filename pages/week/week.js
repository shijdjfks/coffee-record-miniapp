Page({
  data: {
    weekDays: [],
    weekLogs: {},
    weekTotal: 0,
    weekShops: 0,
    currentWeekStart: null,
    weekRange: ''
  },

  // 后端 API 地址（直接写死，避免 undefined 问题）
  apiBase: 'http://10.7.81.244:8081/api/coffee-records',

  onLoad() {
    this.initWeekView();
  },

  onShow() {
    // 每次显示页面时刷新数据（例如从添加页返回）
    if (this.data.currentWeekStart) {
      this.loadWeekData(this.data.currentWeekStart);
    } else {
      this.initWeekView();
    }
  },

  initWeekView() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日, 1=周一...
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // 本周起始（周日）
    this.setData({ currentWeekStart: startOfWeek });
    this.loadWeekData(startOfWeek);
  },

  getWeekRange(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const startMonth = startDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();
    if (startMonth === endMonth) {
      return `${startMonth}月${startDay}日 - ${endDay}日`;
    } else {
      return `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`;
    }
  },

  generateWeekDays(startDate) {
    const days = [];
    const weekDaysCn = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const isToday = date.toDateString() === today.toDateString();
      days.push({
        dayName: weekDaysCn[i],
        day: date.getDate(),
        dateStr: this.formatDate(date),
        isToday,
        month: date.getMonth() + 1,
        records: [],
        totalCups: 0
      });
    }
    return days;
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  async loadWeekData(startDate) {
    wx.showLoading({ title: '加载中...' });
    // 计算本周的起止日期（用于前端过滤）
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const startStr = this.formatDate(startDate);
    const endStr = this.formatDate(endDate);
    
    console.log('[week] 本周范围:', startStr, '~', endStr);
    
    try {
      // 请求全量数据（不带参数）
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: this.apiBase,
          method: 'GET',
          success: resolve,
          fail: reject
        });
      });
      wx.hideLoading();
      
      if (res.statusCode === 200) {
        const allRecords = res.data || [];
        console.log('[week] 后端返回总记录数:', allRecords.length);
        if (allRecords.length > 0) {
          console.log('[week] 示例记录:', allRecords[0]);
        }
        
        // 过滤出本周的记录（日期比较）
        const weekRecords = allRecords.filter(record => {
          const recordDate = record.date;
          if (!recordDate) {
            console.warn('[week] 记录缺少 date 字段:', record);
            return false;
          }
          const inRange = recordDate >= startStr && recordDate <= endStr;
          if (!inRange) {
            console.log(`[week] 记录日期 ${recordDate} 不在范围 ${startStr}~${endStr}`);
          }
          return inRange;
        });
        console.log('[week] 本周记录数:', weekRecords.length);
        
        // 按日期分组
        const weekLogs = {};
        let weekTotal = 0;
        const shopsSet = new Set();
        
        weekRecords.forEach(record => {
          const d = record.date;
          if (!weekLogs[d]) weekLogs[d] = [];
          weekLogs[d].push(record);
          weekTotal += record.cups || 1;
          if (record.coffeeShop) shopsSet.add(record.coffeeShop);
        });
        
        // 生成一周的日期数组并填充记录
        const weekDays = this.generateWeekDays(startDate);
        weekDays.forEach(day => {
          const dayRecords = weekLogs[day.dateStr] || [];
          day.records = dayRecords;
          day.totalCups = dayRecords.reduce((sum, r) => sum + (r.cups || 1), 0);
        });
        
        this.setData({
          weekDays,
          weekLogs,
          weekTotal,
          weekShops: shopsSet.size,
          weekRange: this.getWeekRange(startDate)
        });
      } else {
        throw new Error(`请求失败，状态码: ${res.statusCode}`);
      }
    } catch (err) {
      wx.hideLoading();
      console.error('[week] 加载数据失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      // 即使失败也显示空框架
      const weekDays = this.generateWeekDays(startDate);
      this.setData({
        weekDays,
        weekTotal: 0,
        weekShops: 0,
        weekRange: this.getWeekRange(startDate)
      });
    }
  },

  prevWeek() {
    const currentStart = new Date(this.data.currentWeekStart);
    currentStart.setDate(currentStart.getDate() - 7);
    this.setData({ currentWeekStart: currentStart });
    this.loadWeekData(currentStart);
  },

  nextWeek() {
    const currentStart = new Date(this.data.currentWeekStart);
    currentStart.setDate(currentStart.getDate() + 7);
    this.setData({ currentWeekStart: currentStart });
    this.loadWeekData(currentStart);
  },

  goToAdd(e) {
    const { date } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/add/add?date=${date}`
    });
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    if (!id || id === 'undefined') {
      wx.showToast({ title: '记录无效', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});