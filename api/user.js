import request from '~/api/request';

/** 当前用户端用户资料 */
export function getCurrentUser() {
  return request('/api/users/me', 'GET');
}

/** 更新当前用户资料（仅昵称、头像） */
export function updateCurrentUser({ nickname, avatar }) {
  const payload = {};
  if (nickname !== undefined) payload.nickname = nickname;
  if (avatar !== undefined) payload.avatar = avatar;
  return request('/api/users/me', 'PUT', payload);
}

/** 用户分页列表（发送站内信选人） */
export function fetchUserList({ current = 1, size = 50, keyword = '', status = 1 } = {}) {
  const params = { current, size, status };
  if (keyword.trim()) params.keyword = keyword.trim();
  return request('/api/users', 'GET', params);
}
