import useThemeBehavior from '~/behaviors/useTheme';
import { clearAuthSession } from '~/utils/auth';
import { getErrorPreset } from '~/utils/error-nav';

Page({
  behaviors: [useThemeBehavior],

  data: {
    type: 'generic',
    code: '',
    msg: '',
    title: '',
    description: '',
    icon: 'error-circle',
    showCode: true,
    primaryText: '返回上一页',
    primaryAction: 'back',
    secondaryText: '回工作台',
    secondaryAction: 'workspace',
  },

  onShow() {
    if (typeof this._applyTheme === 'function') {
      this._applyTheme();
    }
  },

  onLoad(options = {}) {
    const type = options.type || 'generic';
    const preset = getErrorPreset(type);
    const msg = options.msg ? decodeURIComponent(options.msg) : '';

    this.setData({
      type,
      code: options.code || '',
      msg,
      title: preset.title,
      description: msg || preset.description,
      icon: preset.icon,
      showCode: preset.showCode,
      primaryText: preset.primaryText,
      primaryAction: preset.primaryAction,
      secondaryText: preset.secondaryText,
      secondaryAction: preset.secondaryAction,
    });
  },

  onPrimaryAction() {
    this.runAction(this.data.primaryAction);
  },

  onSecondaryAction() {
    this.runAction(this.data.secondaryAction);
  },

  runAction(action) {
    if (action === 'back') {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.switchTab({ url: '/pages/workspace/index' });
      }
      return;
    }
    if (action === 'workspace') {
      wx.switchTab({ url: '/pages/workspace/index' });
      return;
    }
    if (action === 'logout') {
      clearAuthSession();
      wx.reLaunch({ url: '/pages/login/index' });
    }
  },
});
