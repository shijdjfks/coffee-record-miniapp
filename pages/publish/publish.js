const app = getApp();

Page({
  data: {
    text: '',
    images: [],
    location: '',
    locationAddress: '',
    textLength: 0,
    maxTextLength: 500
  },

  onLoad() {
    // 尝试从 storage 加载草稿
    const draft = wx.getStorageSync('publishDraft');
    if (draft) {
      this.setData({
        text: draft.text || '',
        images: draft.images || [],
        location: draft.location || '',
        locationAddress: draft.locationAddress || '',
        textLength: (draft.text || '').length
      });
    }
  },

  onUnload() {
    // 保存草稿
    if (this.data.text || this.data.images.length > 0) {
      wx.setStorageSync('publishDraft', {
        text: this.data.text,
        images: this.data.images,
        location: this.data.location,
        locationAddress: this.data.locationAddress
      });
    }
  },

  // 监听输入
  onTextInput(e) {
    const text = e.detail.value;
    this.setData({
      text,
      textLength: text.length
    });
  },

  // 选择图片
  chooseImage() {
    const remain = 9 - this.data.images.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多9张图片', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        // 静态演示：使用 emoji 模拟图片
        const icons = ['☕', '🍵', '🧋', '🥤', '🍪', '🧁', '🌸', '🌟', '☀️'];
        const newImages = [...this.data.images];
        tempFilePaths.forEach(() => {
          newImages.push(icons[Math.floor(Math.random() * icons.length)]);
        });
        this.setData({ images: newImages });
      }
    });
  },

  // 移除图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  // 选择位置
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          location: res.name,
          locationAddress: res.address
        });
        wx.showToast({ title: '位置已选择', icon: 'success' });
      },
      fail: () => {
        // 用户拒绝授权或选择失败，使用 mock
        wx.showModal({
          title: '位置选择',
          content: '请输入咖啡店名称（演示用）',
          editable: true,
          placeholderText: '例如：星巴克(人民广场店)',
          success: (modalRes) => {
            if (modalRes.confirm && modalRes.content) {
              this.setData({
                location: modalRes.content,
                locationAddress: ''
              });
            }
          }
        });
      }
    });
  },

  // 清除位置
  clearLocation() {
    this.setData({ location: '', locationAddress: '' });
  },

  // 取消
  onCancel() {
    if (this.data.text || this.data.images.length > 0) {
      wx.showModal({
        title: '提示',
        content: '是否放弃此次编辑？',
        success: (res) => {
          if (res.confirm) {
            wx.removeStorageSync('publishDraft');
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  // 发布 - 调用后端 POST /api/posts
  // 请求体：{ text, images, location }（与后端响应字段对齐）
  // 后端返回 201 + 创建后的 Post 对象
  onPublish() {
    if (!this.data.text.trim() && this.data.images.length === 0) {
      wx.showToast({ title: '请输入内容或添加图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...', mask: true });

    wx.request({
      url: 'http://10.7.81.244:8081/api/posts',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        text: this.data.text,
        images: this.data.images,
        location: this.data.location
      },
      success: (res) => {
        wx.hideLoading();
        // 后端约定：创建成功返回 201
        if (res.statusCode === 200 || res.statusCode === 201) {
          wx.removeStorageSync('publishDraft');
          wx.showToast({ title: '发布成功', icon: 'success' });
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/feed/feed' });
          }, 800);
        } else {
          wx.showToast({ title: '发布失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
      }
    });
  }
});
