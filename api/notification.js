import request from '~/api/request';
import { formatDetailTime, formatMessageTime } from '~/utils/format';

function mapInboxItem(item) {
  return {
    id: String(item.recipientId),
    recipientId: item.recipientId,
    notificationId: item.notificationId,
    title: item.title,
    content: item.content,
    snippet: (item.content || '').trim(),
    readStatus: item.readStatus,
    unread: item.readStatus === 0,
    mailbox: 'inbox',
    time: formatMessageTime(item.createTime),
    detailTime: formatDetailTime(item.createTime),
    createTime: item.createTime,
    sender: '系统通知',
  };
}

function mapSentItem(item) {
  return {
    id: String(item.id),
    notificationId: item.id,
    title: item.title,
    content: item.content,
    snippet: (item.content || '').trim(),
    readStatus: 1,
    unread: false,
    mailbox: 'sent',
    time: formatMessageTime(item.createTime),
    detailTime: formatDetailTime(item.createTime),
    createTime: item.createTime,
    sender: '我',
    recipientCount: item.recipientCount,
  };
}

function filterByKeyword(list, keyword) {
  const kw = (keyword || '').trim().toLowerCase();
  if (!kw) return list;
  return list.filter(
    (item) =>
      item.title.toLowerCase().includes(kw) || item.content.toLowerCase().includes(kw),
  );
}

/** 收件箱分页 */
export function fetchInbox({ current = 1, size = 50, filter = 'all', keyword = '' } = {}) {
  const params = { current, size };
  if (filter === 'unread') params.readStatus = 0;
  if (filter === 'read') params.readStatus = 1;

  return request('/api/notifications/inbox', 'GET', params).then((res) => {
    const records = (res.data?.records || []).map(mapInboxItem);
    return {
      ...res,
      data: {
        list: filterByKeyword(records, keyword),
        total: res.data?.total || 0,
      },
    };
  });
}

/** 已发送分页 */
export function fetchSent({ current = 1, size = 50, keyword = '' } = {}) {
  const params = { current, size };
  if (keyword.trim()) params.keyword = keyword.trim();

  return request('/api/notifications/sent', 'GET', params).then((res) => ({
    ...res,
    data: {
      list: (res.data?.records || []).map(mapSentItem),
      total: res.data?.total || 0,
    },
  }));
}

export function fetchMessages({ mailbox = 'inbox', filter = 'all', keyword = '' } = {}) {
  if (mailbox === 'sent') {
    return fetchSent({ keyword });
  }
  return fetchInbox({ filter, keyword });
}

/** 未读数量 */
export function fetchUnreadCount() {
  return request('/api/notifications/inbox/unread-count', 'GET');
}

/** 标记单条已读 */
export function markMessageRead(recipientId) {
  return request(`/api/notifications/inbox/${recipientId}/read`, 'POST');
}

/** 全部标记已读 */
export function markAllRead() {
  return request('/api/notifications/inbox/read-all', 'POST');
}

/** 发送站内信 */
export function sendMessage({
  title,
  content,
  targetType = 4,
  userIds = [],
  departmentIds = [],
  positionIds = [],
}) {
  const payload = { title, content, targetType };

  if (targetType === 1) {
    payload.userIds = userIds;
  } else if (targetType === 2) {
    payload.departmentIds = departmentIds;
  } else if (targetType === 3) {
    payload.positionIds = positionIds;
  }

  return request('/api/notifications/send', 'POST', payload);
}

export function getCachedMessageDetail() {
  return wx.getStorageSync('notification_detail') || null;
}

export function cacheMessageDetail(message) {
  wx.setStorageSync('notification_detail', message);
}
