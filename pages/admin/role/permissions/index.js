import { fetchPermissionCatalog } from '~/api/permission';
import { assignRolePermissions, getRoleDetail } from '~/api/role';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';

function buildGroups(catalog, selectedCodes) {
  const selected = new Set(selectedCodes || []);
  return (catalog || []).map((group) => ({
    code: group.code,
    label: group.label,
    permissions: (group.permissions || []).map((item) => ({
      ...item,
      selected: selected.has(item.code),
    })),
  }));
}

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    roleId: '',
    roleName: '',
    groups: [],
    selectedCodes: [],
    submitting: false,
    loading: true,
  },

  async onLoad(options) {
    await this.initAuthority();
    this.setPermFlags({ assign: PermissionCode.ROLE_PERMISSION_ASSIGN });

    const roleId = options.id || '';
    if (!roleId || !this.can(PermissionCode.ROLE_PERMISSION_ASSIGN)) {
      this.onShowToast('#t-toast', '无权限');
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    this.setData({ roleId });
    await this.loadData(roleId);
  },

  async loadData(roleId) {
    this.setData({ loading: true });
    try {
      const [roleRes, catalogRes] = await Promise.all([
        getRoleDetail(roleId),
        fetchPermissionCatalog(),
      ]);
      const role = roleRes.data || {};
      const selectedCodes = role.permissionCodes || [];
      const groups = buildGroups(catalogRes.data, selectedCodes);
      this.setData({
        roleName: role.roleName || role.roleCode || '',
        groups,
        selectedCodes,
      });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  onPermToggle(e) {
    const { code } = e.currentTarget.dataset;
    const selected = new Set(this.data.selectedCodes);
    if (selected.has(code)) selected.delete(code);
    else selected.add(code);
    const selectedCodes = [...selected];
    const groups = this.data.groups.map((group) => ({
      ...group,
      permissions: group.permissions.map((item) => ({
        ...item,
        selected: selected.has(item.code),
      })),
    }));
    this.setData({ selectedCodes, groups });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    const { roleId, selectedCodes } = this.data;
    this.setData({ submitting: true });
    try {
      await assignRolePermissions(roleId, selectedCodes);
      this.onShowToast('#t-toast', '权限已更新');
      setTimeout(() => wx.navigateBack(), 600);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '保存失败');
      this.setData({ submitting: false });
    }
  },
});
