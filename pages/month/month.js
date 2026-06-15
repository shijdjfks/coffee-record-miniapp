Page({
  data: {
    year: 0,
    month: 0,
    monthName: '',
    days: [],
    selectedDay: null,
    dayRecords: [],
    monthTotal: 0,
    monthShops: 0,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    showQuickAdd: false,
    tempPhotoPath: '',
    generatedIcon: ''
  },

  apiBase: 'http://10.7.81.244:8081/api/coffee-records',

  onLoad(options) {
    const year = parseInt(options.year) || new Date().getFullYear();
    const month = parseInt(options.month) || new Date().getMonth() + 1;
    this.setData({ year, month });
    // 直接传递 year 和 month 参数，避免 setData 异步问题
    this.loadMonthData(year, month);
  },

  onShow() {
    if (this.data.year && this.data.month) {
      // 直接传递 this.data 的值
      this.loadMonthData(this.data.year, this.data.month);
    }
  },

  getMonthName(month) {
    const names = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return names[month - 1];
  },

  generateCalendarDays(year, month) {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', empty: true });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getFullYear() === year && 
                      today.getMonth() + 1 === month && 
                      today.getDate() === day;
      days.push({
        day,
        empty: false,
        isToday,
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      });
    }
    
    return days;
  },

  async loadMonthData(year, month) {
    wx.showLoading({ title: '加载中...' });
    
    const monthStr = String(month).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-31`;
    
    console.log('[month] ===== loadMonthData 开始 =====');
    console.log('[month] 请求参数: year=', year, 'month=', month, 'startDate=', startDate, 'endDate=', endDate);
    
    try {
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
        const monthStr = String(month).padStart(2, '0');
        
        // 过滤掉 date 为 null/undefined/空 的记录
        // 同时只保留当前月份的数据（前端二次过滤，防止后端忽略日期参数）
        const logs = (res.data || [])
          .filter(log => log.date && typeof log.date === 'string')
          .filter(log => {
            // 确保记录属于当前月份
            const logMonth = log.date.substring(0, 7);  // "2026-02-15" → "2026-02"
            const targetMonth = `${year}-${monthStr}`;
            console.log(`[month] 记录 id=${log.id}, date=${log.date}, logMonth=${logMonth}, targetMonth=${targetMonth}, inRange=${logMonth === targetMonth}`);
            return logMonth === targetMonth;
          })
          .map(log => ({
            ...log,
            id: log.id || log._id
          }));
        
        console.log('[month] 过滤后的记录数:', logs.length);
        
        const dayMap = {};
        
        logs.forEach(log => {
          const day = log.date.split('-')[2];
          if (!dayMap[day]) {
            dayMap[day] = [];
          }
          dayMap[day].push(log);
        });
        
        const days = this.generateCalendarDays(year, month);
        let monthTotal = 0;
        const shops = new Set();
        
        days.forEach(d => {
          if (d.day && dayMap[d.day]) {
            const dayRecords = dayMap[d.day];
            d.hasRecord = true;
            d.cupCount = dayRecords.reduce((sum, log) => sum + (log.cups || 1), 0);
            d.shops = [...new Set(dayRecords.map(l => l.coffeeShop).filter(s => s))];
            // 取当天第一条记录的图标作为代表图标
            d.firstIcon = dayRecords[0].icon || '☕';
            // 如果有多个不同图标，收集所有不同图标
            const uniqueIcons = [...new Set(dayRecords.map(l => l.icon).filter(i => i))];
            d.icons = uniqueIcons.length > 0 ? uniqueIcons : ['☕'];
            monthTotal += d.cupCount;
            d.shops.forEach(s => shops.add(s));
          } else {
            d.hasRecord = false;
            d.cupCount = 0;
            d.firstIcon = '☕';
            d.icons = ['☕'];
          }
        });
        
        this.setData({
          days,
          monthName: this.getMonthName(month),
          monthTotal,
          monthShops: shops.size,
          allLogs: dayMap
        });
      } else {
        throw new Error('请求失败');
      }
      
    } catch (err) {
      wx.hideLoading();
      console.error('加载数据失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      const days = this.generateCalendarDays(year, month);
      this.setData({
        days,
        monthName: this.getMonthName(month),
        monthTotal: 0,
        monthShops: 0
      });
    }
  },

  selectDay(e) {
    const { day, date } = e.currentTarget.dataset;
    if (!day) return;
    
    const dayStr = String(day).padStart(2, '0');
    const logs = (this.data.allLogs && this.data.allLogs[dayStr]) || [];
    
    this.setData({
      selectedDay: day,
      selectedDate: date,
      dayRecords: logs
    });
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    if (!id || id === 'undefined') {
      wx.showToast({ title: '记录无效', icon: 'none' });
      console.error('[month] goToDetail: id 无效', id);
      return;
    }
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  goToAdd() {
    const date = this.data.selectedDate || this.getTodayDate();
    wx.navigateTo({
      url: `/pages/add/add?date=${date}`
    });
  },

  getTodayDate() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  },

  takePhotoForIcon() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ tempPhotoPath: tempFilePath });
        this.generateIconFromPhoto(tempFilePath);
      }
    });
  },

  generateIconFromPhoto(photoPath) {
    wx.showLoading({ title: '生成中...' });
    
    setTimeout(() => {
      const icons = ['☕', '🍵', '🧋', '🥤', '☕️', '🫖'];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];
      
      this.setData({
        generatedIcon: randomIcon,
        showQuickAdd: true
      });
      
      wx.hideLoading();
      
      wx.showToast({
        title: '已生成小图标!',
        icon: 'success'
      });
    }, 1500);
  },

  confirmIconAndAdd() {
    if (this.data.selectedDate) {
      wx.navigateTo({
        url: `/pages/add/add?date=${this.data.selectedDate}&icon=${encodeURIComponent(this.data.generatedIcon)}`
      });
    } else {
      wx.showToast({
        title: '请先选择日期',
        icon: 'none'
      });
    }
  },

  closeQuickAdd() {
    this.setData({
      showQuickAdd: false,
      tempPhotoPath: '',
      generatedIcon: ''
    });
  },

  onShareAppMessage() {
    return {
      title: 'Brewlog - 我的咖啡手帐',
      path: '/pages/index/index'
    };
  },

  goBack() {
    wx.navigateBack();
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
