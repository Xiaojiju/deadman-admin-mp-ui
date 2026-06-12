import { getUnreadCount, INBOX_UNREAD_CHANGE } from '~/utils/inbox-unread';
import { getThemePageData, offThemeChange, onThemeChange } from '~/utils/theme';

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  data: {
    value: '',
    themeClass: 'theme-light',
    notificationBadge: {},
    list: [
      {
        icon: 'chat',
        value: 'notification',
        label: '站内信',
      },
      {
        icon: 'home',
        value: 'workspace',
        label: '工作台',
      },
      {
        icon: 'user',
        value: 'my',
        label: '我的',
      },
    ],
  },
  lifetimes: {
    ready() {
      const pages = getCurrentPages();
      const curPage = pages[pages.length - 1];
      if (curPage) {
        const nameRe = /pages\/(\w+)\/index/.exec(curPage.route);
        if (nameRe === null) return;
        if (nameRe[1] && nameRe) {
          this.setData({
            value: nameRe[1],
          });
        }
      }
      this._syncTheme();
      this._themeHandler = (payload) => this._syncTheme(payload);
      onThemeChange(this._themeHandler);
      this.setUnreadCount(getUnreadCount());
      const app = getApp();
      this._unreadHandler = (count) => this.setUnreadCount(count);
      app.eventBus.on(INBOX_UNREAD_CHANGE, this._unreadHandler);
    },
    detached() {
      if (this._themeHandler) {
        offThemeChange(this._themeHandler);
      }
      const app = getApp();
      if (app && this._unreadHandler) {
        app.eventBus.off(INBOX_UNREAD_CHANGE, this._unreadHandler);
      }
    },
  },
  methods: {
    _syncTheme(payload) {
      const { themeClass } = getThemePageData(payload);
      this.setData({ themeClass });
    },

    setUnreadCount(count) {
      const normalized = Math.max(0, Number(count) || 0);
      const notificationBadge =
        normalized > 0 ? { count: normalized, maxCount: 99, offset: [4, 4] } : {};
      this.setData({ notificationBadge });
    },

    handleChange(e) {
      const { value } = e.detail;
      wx.switchTab({ url: `/pages/${value}/index` });
    },
  },
});
