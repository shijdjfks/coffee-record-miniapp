Page({
  data: {
    phone: '',
    code: '',
    password: '',
    phoneFocused: false,
    codeFocused: false,
    passwordFocused: false,
    countdown: 0,
    canSendCode: true
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onPhoneFocus() { this.setData({ phoneFocused: true }); },
  onPhoneBlur() { this.setData({ phoneFocused: false }); },
  onCodeFocus() { this.setData({ codeFocused: true }); },
  onCodeBlur() { this.setData({ codeFocused: false }); },
  onPasswordFocus() { this.setData({ passwordFocused: true }); },
  onPasswordBlur() { this.setData({ passwordFocused: false }); },

  // 校验手机号
  isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  },

  // 获取验证码
  sendCode() {
    if (!this.data.canSendCode) return;

    if (!this.data.phone || this.data.phone.trim() === '') {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }

    if (!this.isValidPhone(this.data.phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    // 开始倒计时
    this.setData({
      canSendCode: false,
      countdown: 60
    });

    wx.showToast({
      title: '验证码已发送',
      icon: 'success'
    });

    // 倒计时
    const timer = setInterval(() => {
      const next = this.data.countdown - 1;
      this.setData({ countdown: next });
      if (next <= 0) {
        clearInterval(timer);
        this.setData({ canSendCode: true, countdown: 0 });
      }
    }, 1000);
  },

  // 注册
  doRegister() {
    const { phone, code, password } = this.data;
    console.log('[register] 注册验证');

    // 校验手机号
    if (!phone || phone.trim() === '') {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!this.isValidPhone(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    // 校验验证码
    if (!code || code.trim() === '') {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }
    if (code.length < 4) {
      wx.showToast({ title: '验证码至少4位', icon: 'none' });
      return;
    }

    // 校验密码
    if (!password || password.trim() === '') {
      wx.showToast({ title: '请设置密码', icon: 'none' });
      return;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' });
      return;
    }

    // 注册成功
    wx.showModal({
      title: '注册成功',
      content: '注册成功，请登录',
      showCancel: false,
      confirmText: '去登录',
      success: () => {
        // 返回登录页并传递手机号
        wx.redirectTo({
          url: `/pages/login/login?phone=${encodeURIComponent(phone)}`
        });
      }
    });
  },

  // 第三方登录（占位）
  onWechatLogin() {
    wx.showToast({
      title: '该功能暂未开放，请使用手机号注册',
      icon: 'none',
      duration: 2000
    });
  },

  onQQLogin() {
    wx.showToast({
      title: '该功能暂未开放，请使用手机号注册',
      icon: 'none',
      duration: 2000
    });
  },

  // 返回登录页
  goBack() {
    wx.navigateBack();
  }
});
