Page({
  data: {
    id: '',
    date: '',
    shop: '',
    coffeeName: '',
    cups: 1,
    size: '中杯',
    notes: '',
    icon: '',
    photo: '',
    isEditing: false,
    sizes: ['小杯', '中杯', '大杯', '超大杯'],
    showIconPicker: false,
    iconList: ['☕', '🍵', '🧋', '🥤', '☕️', '🫖', '🫘', '🥛', '🍺', '🍷', '🍹', '🧃', '💧', '🧊', '🌸', '🍀']
  },

  // 后端 API 基础地址（开发阶段用 localhost，需在工具中勾选“不校验合法域名”）
  apiBase: 'http://10.7.81.244:8081/api/coffee-records',

  onLoad(options) {
    console.log('[add] onLoad options:', options);
    if (options.date) {
      this.setData({ date: options.date });
    }
    if (options.icon) {
      this.setData({ icon: decodeURIComponent(options.icon) });
    }
    // 安全检查：确保 id 是有效的非空字符串
    const id = options.id;
    if (id && id !== 'undefined' && id !== 'null') {
      this.setData({ id: id, isEditing: true });
      this.loadRecord(id);
    } else {
      this.setData({ isEditing: false });
    }
  },

  // 加载单条记录（编辑时使用）
  async loadRecord(id) {
    wx.showLoading({ title: '加载中...' });
    console.log('[add] loadRecord 请求 id:', id);
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.apiBase}/${id}`,
          method: 'GET',
          success: resolve,
          fail: reject
        });
      });
      wx.hideLoading();
      console.log('[add] loadRecord 响应:', res.statusCode, res.data);
      if (res.statusCode === 200) {
        const record = res.data;
        // 关键：同时设置 id 和所有表单字段
        this.setData({
          id: record.id,  // 重要！
          shop: record.coffeeShop || '',
          coffeeName: record.name || '',
          cups: record.cups || 1,
          size: record.cupSize || '中杯',
          notes: record.comment || '',
          icon: record.icon || '',
          photo: record.photoUrl || '',
          date: record.date
        });
        console.log('[add] 加载后 this.data.id:', this.data.id);
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('加载记录失败:', err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    }
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onShopInput(e) {
    this.setData({ shop: e.detail.value });
  },

  onCoffeeNameInput(e) {
    this.setData({ coffeeName: e.detail.value });
  },

  onCupsChange(e) {
    this.setData({ cups: parseInt(e.detail.value) || 1 });
  },

  onSizeChange(e) {
    this.setData({ size: this.data.sizes[e.detail.value] });
  },

  onNotesInput(e) {
    this.setData({ notes: e.detail.value });
  },

  toggleIconPicker() {
    this.setData({ showIconPicker: !this.data.showIconPicker });
  },

  selectIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    this.setData({ 
      icon: icon,
      showIconPicker: false
    });
  },

  // 拍照/选图（只保存临时路径，不立即上传）
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ photo: tempFilePath });
      }
    });
  },

  removePhoto() {
    this.setData({ photo: '' });
  },

  // 保存记录（新增或更新）
  async saveRecord() {
    const { isEditing, id, coffeeName, shop, date, cups, size, notes, photo, icon } = this.data;
    console.log('[add] saveRecord 开始，isEditing:', isEditing, 'id:', id);
    console.log('[add] 当前选择的 icon:', icon);

    // 安全检查：编辑模式下必须要有有效的 id
    if (isEditing && (!id || id === 'undefined' || id === 'null')) {
      console.error('[add] 编辑模式但 id 无效:', id);
      wx.showToast({ title: '记录ID无效', icon: 'none' });
      return;
    }

    // 构造要发送给后端的数据对象（字段名与后端实体一致）
    let postData = {
      name: coffeeName || shop || '咖啡',   // name 不能为空
      coffeeShop: shop,
      date: date,
      cups: cups,
      cupSize: size,
      comment: notes,
      photoUrl: '',
      icon: icon || ''  // 添加 icon 字段
    };
    console.log('[add] postData:', postData);

    // 如果没有日期，使用今天
    if (!postData.date) {
      const today = new Date();
      postData.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    wx.showLoading({ title: '保存中...' });

    // 处理图片：如果 photo 是新选择的本地文件（wxfile://），则先上传到后端
    if (photo && photo.startsWith('wxfile://')) {
      try {
        const uploadUrl = await this.uploadImage(photo);
        postData.photoUrl = uploadUrl;
      } catch (err) {
        console.error('图片上传失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '图片上传失败', icon: 'none' });
        return;
      }
    } else if (photo) {
      // 已存在的图片URL（编辑时可能已有 photoUrl）
      postData.photoUrl = photo;
    }

    try {
      let res;
      if (isEditing) {
        // 更新：PUT 请求
        console.log('[add] 发送 PUT 请求到:', `${this.apiBase}/${id}`);
        res = await new Promise((resolve, reject) => {
          wx.request({
            url: `${this.apiBase}/${id}`,
            method: 'PUT',
            header: { 'content-type': 'application/json' },
            data: postData,
            success: resolve,
            fail: reject
          });
        });
        console.log('[add] PUT 响应:', res.statusCode, res.data);
        // PUT 成功返回 200
        if (res.statusCode !== 200) {
          throw new Error(`更新失败(${res.statusCode})`);
        }
      } else {
        // 新增：POST 请求
        console.log('[add] 发送 POST 请求到:', this.apiBase);
        res = await new Promise((resolve, reject) => {
          wx.request({
            url: this.apiBase,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: postData,
            success: resolve,
            fail: reject
          });
        });
        console.log('[add] POST 响应:', res.statusCode, res.data);
        // POST 成功返回 200 或 201
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          throw new Error(`保存失败(${res.statusCode})`);
        }
      }

      wx.hideLoading();
      wx.showToast({ title: '已保存', icon: 'success' });

      // 通知上一页刷新数据
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];  // 获取上一个页面实例
      console.log('[add] 保存成功，通知上一页刷新, prevPage:', prevPage ? prevPage.route : 'null');
      if (prevPage && prevPage.loadDetail) {
        // 详情页：调用其 loadDetail 刷新数据
        prevPage.loadDetail(this.data.id);
      } else if (prevPage && prevPage.initWeekView) {
        // 周视图：调用其刷新方法
        prevPage.initWeekView();
      } else if (prevPage && prevPage.loadMonthData) {
        // 月视图：调用其刷新方法
        prevPage.loadMonthData();
      }

      setTimeout(() => {
        wx.navigateBack();
      }, 500);  // 稍微延迟，确保刷新完成
    } catch (err) {
      wx.hideLoading();
      console.error('保存失败:', err);
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
  },

  // 上传图片到你的后端
  uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: 'http://10.7.81.244:8081/api/upload',
        filePath: filePath,
        name: 'file',
        success(res) {
          const data = JSON.parse(res.data);
          if (data.url) resolve(data.url);
          else reject(new Error('上传失败'));
        },
        fail: reject
      });
    });
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