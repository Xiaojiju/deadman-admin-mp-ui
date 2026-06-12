import request from '~/api/request';

export function fetchPositions(departmentId) {
  const params = {};
  if (departmentId) params.departmentId = departmentId;
  return request('/api/positions', 'GET', params);
}

export function getPosition(positionId) {
  return request(`/api/positions/${positionId}`, 'GET');
}

export function createPosition(data) {
  return request('/api/positions', 'POST', data);
}

export function updatePosition(positionId, data) {
  return request(`/api/positions/${positionId}`, 'PUT', data);
}

export function deletePosition(positionId) {
  return request(`/api/positions/${positionId}`, 'DELETE');
}
