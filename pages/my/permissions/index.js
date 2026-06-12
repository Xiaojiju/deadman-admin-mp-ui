import { getCurrentUserPermissions } from '~/api/auth';
import { PERMISSION_CATALOG } from '~/constants/permissions';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { ensureLoggedIn } from '~/utils/auth';
import { normalizeRoleCodes } from '~/utils/user-profile';

const LABEL_MAP = Object.fromEntries(PERMISSION_CATALOG.map((item) => [item.code, item.label]));

function mapPermissions(codes) {
  return (codes || []).map((code) => ({
    code,
    label: LABEL_MAP[code] || code,
  }));
}

Page({
  behaviors: [useThemeBehavior, useToastBehavior],

  data: {
    loading: true,
    superAdmin: false,
    roles: [],
    permissions: [],
  },

  onLoad() {
    if (!ensureLoggedIn()) return;
    this.loadPermissions();
  },

  async loadPermissions() {
    this.setData({ loading: true });
    try {
      const res = await getCurrentUserPermissions();
      const data = res.data || {};
      const roles = data.superAdmin
        ? ['超级管理员', ...normalizeRoleCodes(data.roleCodes)]
        : normalizeRoleCodes(data.roleCodes);
      this.setData({
        superAdmin: !!data.superAdmin,
        roles,
        permissions: mapPermissions(data.permissionCodes),
      });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },
});
