import config from '~/config';
import { parseInboxWebSocketMessage } from '~/utils/inbox-message';

function isLoggedIn() {
  return !!wx.getStorageSync('access_token');
}

const HEARTBEAT_MS = 5000;
const MAX_RECONNECT_DELAY = 30000;

let socketTask = null;
let heartbeatTimer = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let manualClose = false;
let notificationHandler = null;

function buildInboxWsUrl(token) {
  const { baseUrl } = config;
  const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
  const host = baseUrl.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${host}/ws/inbox?token=${encodeURIComponent(token)}`;
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function closeCurrentSocket() {
  stopHeartbeat();
  const task = socketTask;
  socketTask = null;
  const app = getApp();
  if (app) {
    app.globalData.socket = null;
  }
  if (task) {
    task.close({});
  }
}

function scheduleReconnect() {
  if (manualClose || !isLoggedIn()) return;

  clearReconnectTimer();
  const delay = Math.min(1000 * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY);
  reconnectAttempts += 1;
  reconnectTimer = setTimeout(() => {
    connectInboxWebSocket();
  }, delay);
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (socketTask) {
      socketTask.send({ data: 'ping' });
    }
  }, HEARTBEAT_MS);
}

function handleSocketMessage(raw) {
  if (typeof raw === 'string' && raw.trim().toLowerCase() === 'pong') {
    return;
  }

  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
  }

  const payload = parseInboxWebSocketMessage(data);
  if (payload && typeof notificationHandler === 'function') {
    notificationHandler(payload);
  }
}

export function connectInboxWebSocket({ onNotification } = {}) {
  if (onNotification) {
    notificationHandler = onNotification;
  }
  if (!isLoggedIn()) return;

  closeCurrentSocket();
  manualClose = false;
  clearReconnectTimer();

  const token = wx.getStorageSync('access_token');
  const url = buildInboxWsUrl(token);
  const app = getApp();

  socketTask = wx.connectSocket({ url });
  if (app) {
    app.globalData.socket = socketTask;
  }

  socketTask.onOpen(() => {
    reconnectAttempts = 0;
    startHeartbeat();
  });

  socketTask.onMessage((res) => {
    handleSocketMessage(res.data);
  });

  socketTask.onClose(() => {
    stopHeartbeat();
    socketTask = null;
    if (app) {
      app.globalData.socket = null;
    }
    if (!manualClose) {
      scheduleReconnect();
    }
  });

  socketTask.onError(() => {
    // onClose 会触发重连
  });
}

export function disconnectInboxWebSocket() {
  manualClose = true;
  clearReconnectTimer();
  notificationHandler = null;
  closeCurrentSocket();
}
