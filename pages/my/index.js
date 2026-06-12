import useThemeBehavior from '~/behaviors/useTheme';
import { getCurrentUserPermissions } from '~/api/auth';
import { getCurrentUser } from '~/api/user';
import { clearAuthSession, goLogin, isLoggedIn } from '~/utils/auth';
import { getNavigationBarHeight } from '~/utils/system';
import { formatOrgLabel, formatPositionsLabel, normalizeRoleCodes } from '~/utils/user-profile';
import { resolveAssetUrl } from '~/utils/url';
import config from '~/config';

const { baseUrl } = config;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

Page({
  behaviors: [useThemeBehavior],

  data: {
    navBarHeight: 0,
    isLoggedIn: false,
    greeting: '',
    userName: '',
    avatar: '',
    avatarText: '',
    departmentText: '',
    positionText: '',
    roles: [],
    hasWorkInfo: false,
    tools: [
      { type: 'setting', label: '设置', icon: 'setting' },
    ],
  },

  onLoad() {
    this.setData({ navBarHeight: getNavigationBarHeight() });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'my' });
    }

    const loggedIn = isLoggedIn();
    this.setData({ isLoggedIn: loggedIn, greeting: getGreeting() });

    if (loggedIn) {
      this.loadUserProfile();
    } else {
      this.setData({
        userName: '',
        avatar: '',
        avatarText: '',
        departmentText: '',
        positionText: '',
        roles: [],
        hasWorkInfo: false,
      });
    }
  },

  async loadUserProfile() {
    const cachedNickname = wx.getStorageSync('nickname');
    const cachedAvatar = wx.getStorageSync('avatar');
    if (cachedNickname || cachedAvatar) {
      this.applyUserProfile({ nickname: cachedNickname, avatar: cachedAvatar });
    }

    try {
      const [profileRes, authorityRes] = await Promise.all([
        getCurrentUser(),
        getCurrentUserPermissions(),
      ]);
      const profile = profileRes.data || {};
      const authority = authorityRes?.data || {};
      const app = getApp();
      app.globalData.userInfo = profile;
      if (profile.nickname) {
        wx.setStorageSync('nickname', profile.nickname);
      }
      if (profile.avatar) {
        wx.setStorageSync('avatar', baseUrl + profile.avatar);
      }
      this.applyUserProfile(profile, authority);
    } catch (err) {
      if (err?.code === 401 || err?.statusCode === 401) {
        clearAuthSession();
        this.setData({
          isLoggedIn: false,
          userName: '',
          avatar: '',
          avatarText: '',
          departmentText: '',
          positionText: '',
          roles: [],
          hasWorkInfo: false,
        });
        return;
      }
      if (!cachedNickname) {
        this.applyUserProfile({ nickname: '用户' });
      }
    }
  },

  applyUserProfile(profile, authority = {}) {
    const userName = profile.nickname || profile.username || '用户';
    const avatarPath = profile.avatar || '';
    const departmentText = formatOrgLabel(profile.department);
    const positionText = formatPositionsLabel(profile.positions);
    const roles = normalizeRoleCodes(authority.roleCodes);
    const hasWorkInfo = !!(departmentText || positionText || roles.length || authority.superAdmin);
    const displayRoles = authority.superAdmin ? ['超级管理员', ...roles] : roles;

    this.setData({
      userName,
      avatar: resolveAssetUrl(avatarPath),
      avatarText: userName.charAt(0),
      departmentText,
      positionText,
      roles: displayRoles,
      hasWorkInfo,
    });
  },

  onProfile() {
    if (!this.data.isLoggedIn) {
      goLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/my/profile/index' });
  },

  onToolTap(e) {
    const { type } = e.currentTarget.dataset;
    if (!this.data.isLoggedIn) {
      goLogin();
      return;
    }
    if (type === 'permissions') {
      wx.navigateTo({ url: '/pages/my/permissions/index' });
      return;
    }
    if (type === 'setting' || type === 'theme') {
      wx.navigateTo({ url: '/pages/my/settings/index' });
      return;
    }
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },
});
