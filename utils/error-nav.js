import { ERROR_CODE_PAGE_MAP, HTTP_STATUS_PAGE_MAP, ResultCode } from '~/constants/result-code';

const ERROR_PAGE_PATH = '/pages/error/index';
const REDIRECT_DEBOUNCE_MS = 800;

let redirecting = false;
let redirectTimer = null;

export const ERROR_PRESETS = {
  forbidden: {
    title: '无访问权限',
    description: '当前账号没有权限执行此操作',
    icon: 'secured',
    showCode: true,
    primaryText: '返回上一页',
    primaryAction: 'back',
    secondaryText: '回工作台',
    secondaryAction: 'workspace',
  },
  'not-found': {
    title: '资源不存在',
    description: '请求的内容不存在或已被删除',
    icon: 'info-circle',
    showCode: true,
    primaryText: '返回上一页',
    primaryAction: 'back',
    secondaryText: '回工作台',
    secondaryAction: 'workspace',
  },
  disabled: {
    title: '账号已禁用',
    description: '当前账号已被停用，请联系管理员',
    icon: 'user-clear',
    showCode: true,
    primaryText: '退出登录',
    primaryAction: 'logout',
    secondaryText: '回工作台',
    secondaryAction: 'workspace',
  },
  server: {
    title: '服务异常',
    description: '服务器暂时无法处理请求，请稍后重试',
    icon: 'error-circle',
    showCode: true,
    primaryText: '返回重试',
    primaryAction: 'back',
    secondaryText: '回工作台',
    secondaryAction: 'workspace',
  },
  network: {
    title: '网络异常',
    description: '请检查网络连接后重试',
    icon: 'wifi-off',
    showCode: false,
    primaryText: '返回重试',
    primaryAction: 'back',
    secondaryText: '回工作台',
    secondaryAction: 'workspace',
  },
  generic: {
    title: '请求失败',
    description: '操作未能完成，请稍后重试',
    icon: 'error-circle',
    showCode: true,
    primaryText: '返回上一页',
    primaryAction: 'back',
    secondaryText: '回工作台',
    secondaryAction: 'workspace',
  },
};

function lockRedirect() {
  redirecting = true;
  if (redirectTimer) {
    clearTimeout(redirectTimer);
  }
  redirectTimer = setTimeout(() => {
    redirecting = false;
    redirectTimer = null;
  }, REDIRECT_DEBOUNCE_MS);
}

function buildErrorUrl({ type, code, msg }) {
  const query = [`type=${encodeURIComponent(type)}`];
  if (code !== undefined && code !== null && code !== '') {
    query.push(`code=${encodeURIComponent(String(code))}`);
  }
  if (msg) {
    query.push(`msg=${encodeURIComponent(msg)}`);
  }
  return `${ERROR_PAGE_PATH}?${query.join('&')}`;
}

export function navigateToErrorPage({ type = 'generic', code, msg, replace = true } = {}) {
  if (redirecting) return;

  const pages = getCurrentPages();
  const currentRoute = pages[pages.length - 1]?.route || '';
  if (currentRoute === 'pages/error/index') return;

  lockRedirect();
  const url = buildErrorUrl({ type, code, msg });
  if (replace) {
    wx.redirectTo({ url });
  } else {
    wx.navigateTo({ url });
  }
}

export function resolveErrorNavigation(body = {}, statusCode) {
  const bizCode = body.code;

  if (bizCode && ERROR_CODE_PAGE_MAP[bizCode]) {
    return {
      type: ERROR_CODE_PAGE_MAP[bizCode],
      code: bizCode,
      msg: body.msg,
    };
  }

  if (statusCode && HTTP_STATUS_PAGE_MAP[statusCode]) {
    return {
      type: HTTP_STATUS_PAGE_MAP[statusCode],
      code: bizCode || statusCode,
      msg: body.msg,
    };
  }

  return null;
}

export function shouldHandleUnauthorized(body = {}, statusCode, hasToken) {
  return statusCode === 401 || body.code === ResultCode.UNAUTHORIZED || (statusCode === 401 && hasToken);
}

export function getErrorPreset(type) {
  return ERROR_PRESETS[type] || ERROR_PRESETS.generic;
}
