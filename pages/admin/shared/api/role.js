import request from '~/api/request';

export function fetchRoleList() {
  return request('/api/roles', 'GET');
}

export function getRoleDetail(roleId) {
  return request(`/api/roles/${roleId}`, 'GET');
}

export function createRole(data) {
  return request('/api/roles', 'POST', data);
}

export function updateRole(roleId, data) {
  return request(`/api/roles/${roleId}`, 'PUT', data);
}

export function deleteRole(roleId) {
  return request(`/api/roles/${roleId}`, 'DELETE');
}

export function assignRolePermissions(roleId, permissionCodes) {
  return request(`/api/roles/${roleId}/permissions`, 'PUT', { permissionCodes });
}
