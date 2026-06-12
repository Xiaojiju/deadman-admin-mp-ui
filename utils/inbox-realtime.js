import { connectInboxWebSocket, disconnectInboxWebSocket } from '~/utils/inbox-ws';
import { refreshUnreadCount, setUnreadCount } from '~/utils/inbox-unread';
import { showInboxNotificationMessage } from '~/utils/message';

export const INBOX_NOTIFICATION_EVENT = 'inbox:notification';

function handleInboxNotification(payload) {
  refreshUnreadCount();
  const app = getApp();
  app.eventBus.emit(INBOX_NOTIFICATION_EVENT, payload);
  showInboxNotificationMessage(payload);
}

export function initInboxRealtime() {
  refreshUnreadCount();
  connectInboxWebSocket({ onNotification: handleInboxNotification });
}

export function teardownInboxRealtime() {
  disconnectInboxWebSocket();
  setUnreadCount(0);
}
