import { initInboxRealtime, teardownInboxRealtime } from '~/utils/inbox-realtime';

const LOGIN_URL = '/pages/login/index';

export function isLoggedIn() {
  return !!wx.getStorageSync('access_token');
}

export function goLogin() {
  wx.navigateTo({ url: LOGIN_URL });
}

export function redirectToLogin() {
  wx.reLaunch({ url: LOGIN_URL });
}

export function ensureLoggedIn() {
  if (!isLoggedIn()) {
    redirectToLogin();
    return false;
  }
  return true;
}

export function saveAuthSession(authData = {}) {
  if (authData.accessToken) {
    wx.setStorageSync('access_token', authData.accessToken);
  }
  if (authData.userCode) {
    wx.setStorageSync('user_code', authData.userCode);
  }
  if (authData.nickname) {
    wx.setStorageSync('nickname', authData.nickname);
  }
  initInboxRealtime();
}

export function clearAuthSession() {
  wx.removeStorageSync('access_token');
  wx.removeStorageSync('user_code');
  wx.removeStorageSync('nickname');
  wx.removeStorageSync('avatar');
  const app = getApp();
  if (app) {
    app.globalData.userInfo = null;
  }
  teardownInboxRealtime();
}
