import useThemeBehavior from '~/behaviors/useTheme';
import { clearAuthSession, ensureLoggedIn } from '~/utils/auth';

Page({
  behaviors: [useThemeBehavior],

  onLoad() {
    if (!ensureLoggedIn()) return;
  },

  onGoProfile() {
    wx.navigateTo({ url: '/pages/my/profile/index' });
  },

  onGoPassword() {
    wx.navigateTo({ url: '/pages/my/password/index' });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmText: '退出',
      confirmColor: '#e34d59',
      success: (res) => {
        if (!res.confirm) return;
        clearAuthSession();
        wx.switchTab({ url: '/pages/my/index' });
      },
    });
  },
});
