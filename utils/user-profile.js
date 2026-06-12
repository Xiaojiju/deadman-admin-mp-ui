/** 格式化部门/职位引用 */
export function formatOrgLabel(org) {
  if (!org) return '';
  return org.name || org.code || '';
}

/** 职位列表转展示文案 */
export function formatPositionsLabel(positions) {
  if (!Array.isArray(positions) || !positions.length) return '';
  return positions
    .map((item) => formatOrgLabel(item))
    .filter(Boolean)
    .join('、');
}

/** 角色编码列表 */
export function normalizeRoleCodes(roleCodes) {
  if (!Array.isArray(roleCodes)) return [];
  return roleCodes.filter(Boolean);
}
