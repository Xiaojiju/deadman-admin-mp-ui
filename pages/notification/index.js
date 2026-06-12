import { cacheMessageDetail, fetchMessages, markAllRead } from '~/api/notification';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { ensureLoggedIn } from '~/utils/auth';
import { INBOX_NOTIFICATION_EVENT } from '~/utils/inbox-realtime';
import { getUnreadCount, INBOX_UNREAD_CHANGE, refreshUnreadCount } from '~/utils/inbox-unread';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    mailbox: 'inbox',
    filter: 'all',
    keyword: '',
    messages: [],
    loading: false,
    unreadCount: 0,
    canViewSent: false,
    canSend: false,
  },

  onLoad() {
    const app = getApp();
    this._onUnreadChange = (count) => {
      this.setData({ unreadCount: count });
    };
    this._onNewNotification = () => {
      this.loadMessages();
    };
    app.eventBus.on(INBOX_UNREAD_CHANGE, this._onUnreadChange);
    app.eventBus.on(INBOX_NOTIFICATION_EVENT, this._onNewNotification);
  },

  onUnload() {
    const app = getApp();
    if (this._onUnreadChange) {
      app.eventBus.off(INBOX_UNREAD_CHANGE, this._onUnreadChange);
    }
    if (this._onNewNotification) {
      app.eventBus.off(INBOX_NOTIFICATION_EVENT, this._onNewNotification);
    }
  },

  async onShow() {
    if (!ensureLoggedIn()) return;
    await this.initAuthority();
    const canViewSent = this.can(PermissionCode.NOTIFICATION_SENT_READ);
    const canSend = this.can(PermissionCode.NOTIFICATION_SEND);
    const patch = { canViewSent, canSend, unreadCount: getUnreadCount() };
    if (!canViewSent && this.data.mailbox === 'sent') {
      patch.mailbox = 'inbox';
      patch.filter = 'all';
    }
    this.setData(patch);
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar();
      tabBar.setData({ value: 'notification' });
      if (typeof tabBar.setUnreadCount === 'function') {
        tabBar.setUnreadCount(getUnreadCount());
      }
    }
    refreshUnreadCount();
    this.loadMessages();
  },

  async loadMessages() {
    const { mailbox, filter, keyword } = this.data;
    this.setData({ loading: true });
    try {
      const res = await fetchMessages({ mailbox, filter, keyword });
      this.setData({ messages: res.data?.list || [] });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载消息失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  onMailboxChange(e) {
    const { mailbox } = e.currentTarget.dataset;
    if (mailbox === 'sent' && !this.data.canViewSent) return;
    if (mailbox === this.data.mailbox) return;
    const filter = mailbox === 'sent' ? 'all' : this.data.filter;
    this.setData({ mailbox, filter }, () => this.loadMessages());
  },

  onFilterChange(e) {
    const { filter } = e.currentTarget.dataset;
    if (filter === this.data.filter || this.data.mailbox === 'sent') return;
    this.setData({ filter }, () => this.loadMessages());
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearchConfirm() {
    this.loadMessages();
  },

  async onMarkAllRead() {
    if (this.data.mailbox !== 'inbox') {
      this.onShowToast('#t-toast', '仅收件箱支持全部已读');
      return;
    }
    try {
      await markAllRead();
      this.onShowToast('#t-toast', '已全部标记为已读');
      await refreshUnreadCount();
      this.loadMessages();
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '操作失败');
    }
  },

  onCompose() {
    wx.navigateTo({ url: '/pages/notification/compose/index' });
  },

  onMessageTap(e) {
    const { id } = e.currentTarget.dataset;
    const message = this.data.messages.find((item) => item.id === id);
    if (message) {
      cacheMessageDetail(message);
    }
    wx.navigateTo({
      url: `/pages/notification/detail/index?id=${id}&mailbox=${this.data.mailbox}`,
    });
  },
});
