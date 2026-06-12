/** 获取状态栏高度（替代已废弃的 wx.getSystemInfoSync） */
export function getStatusBarHeight() {
  const { statusBarHeight = 0 } = wx.getWindowInfo();
  return statusBarHeight;
}

/**
 * 自定义导航栏总高度（px）
 * 算法：(胶囊 top - 状态栏高度) * 2 + 胶囊高度 + 状态栏高度
 */
export function getNavigationBarHeight() {
  const statusBarHeight = getStatusBarHeight();
  try {
    const menuButton = wx.getMenuButtonBoundingClientRect();
    if (!menuButton || !menuButton.height) {
      return statusBarHeight + 44;
    }
    const gap = menuButton.top - statusBarHeight;
    return statusBarHeight + gap * 2 + menuButton.height;
  } catch {
    return statusBarHeight + 44;
  }
}

/** 当前运行平台（ios / android / ...） */
export function getPlatform() {
  try {
    return (wx.getDeviceInfo().platform || '').toLowerCase();
  } catch {
    return '';
  }
}

export function isIOS() {
  return getPlatform() === 'ios';
}

export function isAndroid() {
  return getPlatform() === 'android';
}

/** 底部安全区高度（px），用于 Home Indicator 等区域 */
export function getSafeAreaBottom() {
  try {
    const { screenHeight = 0, safeArea } = wx.getWindowInfo();
    if (!safeArea) return 0;
    return Math.max(0, screenHeight - safeArea.bottom);
  } catch {
    return 0;
  }
}
