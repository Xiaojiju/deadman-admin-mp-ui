import { loginByPassword, loginByWechatMiniprogram, saveAuthSession } from '~/api/auth';
import { getCurrentUser } from '~/api/user';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { isLoggedIn } from '~/utils/auth';
import { getStatusBarHeight } from '~/utils/system';
import { createFieldErrors, inputPatch, mergeValidation } from '~/utils/form-field';

Page({
  behaviors: [useThemeBehavior, useToastBehavior],

  data: {
    statusBarHeight: 0,
    loginType: 'wechat',
    account: '',
    password: '',
    showPassword: false,
    fieldErrors: createFieldErrors(['account', 'password']),
    loggingIn: false,
  },

  onLoad() {
    this.setData({ statusBarHeight: getStatusBarHeight() });
  },

  onShow() {
    if (isLoggedIn()) {
      wx.switchTab({ url: '/pages/workspace/index' });
    }
  },

  validatePasswordLogin() {
    const { account, password } = this.data;
    const { valid, errors } = mergeValidation(this.data.fieldErrors, [
      { field: 'account', message: '请输入账号', ok: account.trim() !== '' },
      { field: 'password', message: '请输入密码', ok: password.trim() !== '' },
    ]);
    this.setData({ fieldErrors: errors });
    return valid;
  },

  onTabChange(e) {
    if (this.data.loggingIn) return;
    const { type } = e.currentTarget.dataset;
    if (type === this.data.loginType) return;

    this.setData({
      loginType: type,
      fieldErrors: createFieldErrors(['account', 'password']),
    });
  },

  onAccountInput(e) {
    this.setData(inputPatch(this.data, 'account', e.detail.value));
  },

  onPasswordInput(e) {
    this.setData(inputPatch(this.data, 'password', e.detail.value));
  },

  onTogglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({ success: resolve, fail: reject });
    });
  },

  async syncUserProfile(authData) {
    const app = getApp();
    app.globalData.userInfo = {
      nickName: authData.nickname || '',
      userCode: authData.userCode || '',
    };

    try {
      const userRes = await getCurrentUser();
      const profile = userRes.data || {};
      app.globalData.userInfo = profile;
      if (profile.nickname) {
        wx.setStorageSync('nickname', profile.nickname);
      }
      if (profile.avatar) {
        wx.setStorageSync('avatar', profile.avatar);
      }
    } catch (err) {
      // 登录成功但拉取资料失败时不阻断跳转
    }
  },

  async onLogin() {
    const { loginType, account, password, loggingIn } = this.data;

    if (loggingIn) return;
    if (loginType === 'password' && !this.validatePasswordLogin()) return;

    this.setData({ loggingIn: true });
    try {
      let res;
      if (loginType === 'wechat') {
        const loginRes = await this.wxLogin();
        if (!loginRes.code) {
          this.onShowToast('#t-toast', '微信登录失败');
          this.setData({ loggingIn: false });
          return;
        }
        res = await loginByWechatMiniprogram(loginRes.code);
      } else {
        res = await loginByPassword(account.trim(), password);
      }

      saveAuthSession(res.data);
      await this.syncUserProfile(res.data || {});
      wx.switchTab({ url: '/pages/workspace/index' });
    } catch (err) {
      const message =
        loginType === 'wechat'
          ? err?.msg || '微信登录失败，请稍后重试'
          : err?.msg || '登录失败，请检查账号信息';
      this.onShowToast('#t-toast', message);
      this.setData({ loggingIn: false });
    }
  },

  onForgetPassword() {
    this.onShowToast('#t-toast', '忘记密码功能开发中');
  },

  onServiceAgreement() {
    this.onShowToast('#t-toast', '服务协议页面开发中');
  },

  onPrivacyPolicy() {
    this.onShowToast('#t-toast', '隐私政策页面开发中');
  },
});
