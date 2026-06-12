import request from '~/api/request';

export function fetchDepartmentList() {
  return request('/api/departments', 'GET');
}

export function fetchDepartmentTree() {
  return request('/api/departments/tree', 'GET');
}

export function getDepartment(departmentId) {
  return request(`/api/departments/${departmentId}`, 'GET');
}

export function createDepartment(data) {
  return request('/api/departments', 'POST', data);
}

export function updateDepartment(departmentId, data) {
  return request(`/api/departments/${departmentId}`, 'PUT', data);
}

export function deleteDepartment(departmentId) {
  return request(`/api/departments/${departmentId}`, 'DELETE');
}
