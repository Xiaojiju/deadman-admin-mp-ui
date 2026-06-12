function isInboxNotificationPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const { notificationId, title, content, createTime } = payload;
  return (
    notificationId !== undefined &&
    notificationId !== null &&
    typeof title === 'string' &&
    typeof content === 'string' &&
    createTime !== undefined &&
    createTime !== null
  );
}

export function parseInboxWebSocketMessage(data) {
  if (!data || typeof data !== 'object') return null;

  const message = data;

  if (message.messageType !== 'INBOX_NOTIFICATION' || !isInboxNotificationPayload(message.payload)) {
    return null;
  }

  return message.payload;
}
