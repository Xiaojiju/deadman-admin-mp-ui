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

/** 微信小程序登录（需后端启用 wechat-miniprogram 插件） */
export function loginByWechatMiniprogram(code) {
  return request('/api/auth/login/wechat-miniprogram', 'POST', { code }, { skipErrorRedirect: true });
}
