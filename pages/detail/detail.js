Page({
  data: {
    id: '',
    record: null
  },

  apiBase: 'http://10.7.81.244:8081/api/coffee-records',

  onLoad(options) {
    console.log('[detail] onLoad options:', options);
    const id = options.id;
    if (id && id !== 'undefined' && id !== 'null') {
      this.setData({ id: id });
      // 不在此处调用 loadDetail，由 onShow 统一处理加载
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      console.error('[detail] 无效的 id:', id);
    }
  },

  // 每次页面显示时都重新加载数据（解决编辑后不更新的问题）
  onShow() {
    console.log('[detail] ===== onShow 调用 =====');
    console.log('[detail] this.data.id:', this.data.id, typeof this.data.id);
    console.log('[detail] this.data.record:', this.data.record);
    
    const id = this.data.id;
    if (id && id !== 'undefined' && id !== 'null' && id !== '') {
      console.log('[detail] onShow 准备调用 loadDetail, id:', id);
      this.loadDetail(id);
    } else {
      console.log('[detail] onShow 未执行加载，id 无效');
    }
  },

  async loadDetail(id) {
    wx.showLoading({ title: '加载中...' });
    console.log('[detail] loadDetail 请求 id:', id);
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
      console.log('[detail] loadDetail 响应:', res.statusCode, res.data);
      if (res.statusCode === 200) {
        // 关键：同时设置 record 和 id
        this.setData({ 
          record: res.data,
          id: res.data.id
        });
        console.log('[detail] 设置后 this.data.id:', this.data.id);
      } else {
        throw new Error('加载失败');
      }
    } catch (err) {
      wx.hideLoading();
      console.error('加载详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  deleteRecord() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.doDelete();
        }
      }
    });
  },

  async doDelete() {
    wx.showLoading({ title: '删除中...' });
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.apiBase}/${this.data.id}`,
          method: 'DELETE',
          success: resolve,
          fail: reject
        });
      });
      wx.hideLoading();
      if (res.statusCode === 200 || res.statusCode === 204) {
        wx.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      } else {
        throw new Error('删除失败');
      }
    } catch (err) {
      wx.hideLoading();
      console.error('删除失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  editRecord() {
    const id = this.data.id;
    // 安全检查
    if (!id || id === 'undefined' || id === 'null') {
      wx.showToast({ title: '记录ID无效', icon: 'none' });
      console.error('[detail] editRecord: 无效的 id', id);
      return;
    }
    wx.navigateTo({
      url: `/pages/add/add?id=${id}`
    });
  },

  goBack() {
    wx.navigateBack();
  },

  goHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});