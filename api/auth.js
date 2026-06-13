import request from '~/api/request';

export { saveAuthSession, clearAuthSession } from '~/utils/auth';

/** 用户端用户名密码登录 */
export function loginByPassword(username, password) {
  return request('/api/auth/login', 'POST', { username, password }, { skipErrorRedirect: true });
}

/** 修改当前用户密码 */
export function changePassword(oldPassword, newPassword) {
  return request('/api/auth/password', 'PUT', { oldPassword, newPassword });
}

/** 当前用户角色与权限 */
export function getCurrentUserPermissions() {
  return request('/api/auth/permissions', 'GET');
}

/** 管理端微信小程序登录（已绑定 openid 时直接返回 JWT） */
export function loginByWechatMiniprogram(code) {
  return request('/api/auth/wechat-miniprogram', 'POST', { code }, { skipErrorRedirect: true });
}

/** 管理端微信 OAuth 绑定（openid 未绑定时，用户名密码二次认证） */
export function bindWechatMiniprogram(bindToken, username, password) {
  return request(
    '/api/auth/wechat-miniprogram/bind',
    'POST',
    { bindToken, username, password },
    { skipErrorRedirect: true },
  );
}
