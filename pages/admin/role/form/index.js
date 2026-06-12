import { createRole, getRoleDetail, updateRole } from '~/api/role';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { getStatusText } from '~/utils/admin';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    id: '',
    isEdit: false,
    roleCode: '',
    roleName: '',
    description: '',
    status: 1,
    statusText: '正常',
    systemBuiltin: false,
    canSubmit: false,
    submitting: false,
  },

  async onLoad(options) {
    await this.initAuthority();
    this.setPermFlags({
      create: PermissionCode.ROLE_CREATE,
      update: PermissionCode.ROLE_UPDATE,
      assignPerm: PermissionCode.ROLE_PERMISSION_ASSIGN,
    });

    const id = options.id || '';
    const isEdit = !!id;
    this.setData({ id, isEdit });
    wx.setNavigationBarTitle({ title: isEdit ? '编辑角色' : '新建角色' });

    if (isEdit) {
      await this.loadDetail(id);
    } else {
      this.updateSubmitState();
    }
  },

  async loadDetail(id) {
    try {
      const res = await getRoleDetail(id);
      const data = res.data || {};
      this.setData({
        roleCode: data.roleCode || '',
        roleName: data.roleName || '',
        description: data.description || '',
        status: data.status ?? 1,
        statusText: getStatusText(data.status),
        systemBuiltin: !!data.systemBuiltin,
      });
      this.updateSubmitState();
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    }
  },

  updateSubmitState() {
    const { isEdit, roleCode, roleName, perms } = this.data;
    const canSubmit = isEdit
      ? perms.update && roleName.trim() !== ''
      : perms.create && roleCode.trim() !== '' && roleName.trim() !== '';
    this.setData({ canSubmit });
  },

  onRoleCodeInput(e) {
    this.setData({ roleCode: e.detail.value });
    this.updateSubmitState();
  },

  onRoleNameInput(e) {
    this.setData({ roleName: e.detail.value });
    this.updateSubmitState();
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  onStatusChange(e) {
    const status = Number(e.detail.value) === 1 ? 0 : 1;
    this.setData({ status, statusText: getStatusText(status) });
  },

  onAssignPermissions() {
    wx.navigateTo({ url: `/pages/admin/role/permissions/index?id=${this.data.id}` });
  },

  async onSubmit() {
    if (!this.data.canSubmit || this.data.submitting) return;

    const { isEdit, id, roleCode, roleName, description, status } = this.data;
    this.setData({ submitting: true });
    try {
      if (isEdit) {
        await updateRole(id, {
          roleName: roleName.trim(),
          description: description.trim() || null,
          status,
        });
      } else {
        const res = await createRole({
          roleCode: roleCode.trim(),
          roleName: roleName.trim(),
          description: description.trim() || undefined,
        });
        const newId = res.data?.id;
        this.onShowToast('#t-toast', '创建成功');
        if (newId && this.data.perms.assignPerm) {
          setTimeout(() => {
            wx.redirectTo({ url: `/pages/admin/role/permissions/index?id=${newId}` });
          }, 600);
          return;
        }
      }
      this.onShowToast('#t-toast', '保存成功');
      setTimeout(() => wx.navigateBack(), 600);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '保存失败');
      this.setData({ submitting: false });
    }
  },
});
