import request from '~/api/request';

export function fetchUserList({ current = 1, size = 20, keyword = '', status } = {}) {
  const params = { current, size };
  if (keyword.trim()) params.keyword = keyword.trim();
  if (status !== undefined && status !== '') params.status = status;
  return request('/api/users', 'GET', params);
}

export function getUserDetail(userId) {
  return request(`/api/users/${userId}`, 'GET');
}

export function createUser(data) {
  return request('/api/users', 'POST', data);
}

export function updateUser(userId, data) {
  return request(`/api/users/${userId}`, 'PUT', data);
}

export function deleteUser(userId) {
  return request(`/api/users/${userId}`, 'DELETE');
}

export function resetUserPassword(userId, newPassword) {
  return request(`/api/users/${userId}/password`, 'PUT', { newPassword });
}

export function assignUserRoles(userId, roleIds) {
  return request(`/api/users/${userId}/roles`, 'PUT', { roleIds });
}

export function getUserDataScope(userId) {
  return request(`/api/users/${userId}/data-scope`, 'GET');
}

export function assignUserDataScope(userId, { scopeType, customDeptIds } = {}) {
  const body = { scopeType };
  if (customDeptIds !== undefined) {
    body.customDeptIds = customDeptIds;
  }
  return request(`/api/users/${userId}/data-scope`, 'PUT', body);
}
