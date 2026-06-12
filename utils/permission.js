import { getCurrentUserPermissions } from '~/api/auth';

/** 判断当前用户是否拥有指定权限 */
export function hasPermission(authority, code) {
  if (!code) return true;
  if (authority?.superAdmin) return true;
  const codes = authority?.permissionCodes;
  return Array.isArray(codes) && codes.includes(code);
}

/** 按权限过滤工作台分区 */
export function filterSectionsByPermission(sections, authority) {
  return sections
    .map((section) => ({
      ...section,
      items: (section.items || []).filter((item) => hasPermission(authority, item.permission)),
    }))
    .filter((section) => section.items.length > 0);
}

/** 拉取并缓存当前用户权限 */
export async function fetchUserAuthority() {
  const res = await getCurrentUserPermissions();
  const authority = res.data || {};
  const app = getApp();
  if (app) {
    app.globalData.userAuthority = authority;
  }
  return authority;
}

/** 读取缓存的用户权限 */
export function getCachedUserAuthority() {
  const app = getApp();
  return app?.globalData?.userAuthority || null;
}
