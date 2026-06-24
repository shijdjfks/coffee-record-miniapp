Page({
  data: {
    phone: '',
    password: '',
    phoneFocused: false,
    passwordFocused: false
  },

  onLoad() {
    // 检查是否已登录
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    if (isLoggedIn) {
      console.log('[login] 用户已登录');
    }
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onPhoneFocus() {
    this.setData({ phoneFocused: true });
  },

  onPhoneBlur() {
    this.setData({ phoneFocused: false });
  },

  onPasswordFocus() {
    this.setData({ passwordFocused: true });
  },

  onPasswordBlur() {
    this.setData({ passwordFocused: false });
  },

  // 校验手机号格式
  isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  },

  doLogin() {
    const { phone, password } = this.data;
    console.log('[login] 登录验证，phone:', phone);

    // 校验手机号
    if (!phone || phone.trim() === '') {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }

    if (!this.isValidPhone(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    // 校验密码
    if (!password || password.trim() === '') {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    if (password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' });
      return;
    }

    // 模拟登录成功
    wx.showLoading({ title: '登录中...' });

    setTimeout(() => {
      wx.hideLoading();
      
      // 保存登录状态
      wx.setStorageSync('isLoggedIn', true);
      wx.setStorageSync('userPhone', phone);

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });

      // 登录成功后返回首页
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }, 1500);
    }, 800);
  },

  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  goToForgotPassword() {
    wx.showToast({
      title: '请联系咖啡师',
      icon: 'none'
    });
  },

  goHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});
