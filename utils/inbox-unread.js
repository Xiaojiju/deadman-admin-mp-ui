import { fetchUnreadCount } from '~/api/notification';

export const INBOX_UNREAD_CHANGE = 'inbox:unreadChange';

export function getUnreadCount() {
  const app = getApp();
  return app?.globalData?.unreadNum || 0;
}

function syncTabBarUnread(count) {
  const pages = getCurrentPages();
  pages.forEach((page) => {
    if (typeof page.getTabBar !== 'function') return;
    const tabBar = page.getTabBar();
    if (tabBar && typeof tabBar.setUnreadCount === 'function') {
      tabBar.setUnreadCount(count);
    }
  });
}

export function setUnreadCount(count) {
  const normalized = Math.max(0, Number(count) || 0);
  const app = getApp();
  if (app) {
    app.globalData.unreadNum = normalized;
    app.eventBus.emit(INBOX_UNREAD_CHANGE, normalized);
  }
  syncTabBarUnread(normalized);
  return normalized;
}

export async function refreshUnreadCount() {
  try {
    const res = await fetchUnreadCount();
    return setUnreadCount(res.data ?? 0);
  } catch {
    return getUnreadCount();
  }
}
