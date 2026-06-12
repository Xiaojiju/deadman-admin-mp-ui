import { getCachedMessageDetail, markMessageRead } from '~/api/notification';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { ensureLoggedIn } from '~/utils/auth';
import { refreshUnreadCount } from '~/utils/inbox-unread';
import { isIOS } from '~/utils/system';

Page({
  behaviors: [useThemeBehavior, useToastBehavior],

  data: {
    message: null,
    mailbox: 'inbox',
    platformClass: '',
  },

  async onLoad(options) {
    this.setData({
      platformClass: isIOS() ? 'detail--ios' : 'detail--android',
    });

    if (!ensureLoggedIn()) return;
    const { id, mailbox = 'inbox' } = options;
    const message = getCachedMessageDetail();

    if (!id || !message || message.id !== id) {
      this.onShowToast('#t-toast', '消息不存在');
      return;
    }

    this.setData({ message, mailbox });

    if (mailbox === 'inbox' && message.unread && message.recipientId) {
      try {
        await markMessageRead(message.recipientId);
        await refreshUnreadCount();
      } catch (err) {
        // 详情已展示，标记已读失败不阻断阅读
      }
    }
  },
});
