import request from '~/api/request';

export function fetchPermissionCatalog() {
  return request('/api/permissions/catalog', 'GET');
}

export function fetchPermissionList() {
  return request('/api/permissions', 'GET');
}
