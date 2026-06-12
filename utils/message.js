import Message from 'tdesign-miniprogram/message/index';

const MESSAGE_SELECTOR = '#t-message';
const INBOX_MESSAGE_DURATION = 3000;

function getTopPageContext() {
  const pages = getCurrentPages();
  return pages.length ? pages[pages.length - 1] : null;
}

/** 在当前页面展示 TDesign Message */
export function showPageMessage(content, options = {}) {
  const context = getTopPageContext();
  if (!context) return;

  const { theme = 'info', duration = INBOX_MESSAGE_DURATION, offset } = options;
  const show = Message[theme] || Message.info;

  show({
    context,
    selector: MESSAGE_SELECTOR,
    content: content || '',
    duration,
    offset,
  });
}

/** 新站内信到达提示 */
export function showInboxNotificationMessage(payload = {}) {
  showPageMessage(payload.title || '收到新站内信', { theme: 'info' });
}
