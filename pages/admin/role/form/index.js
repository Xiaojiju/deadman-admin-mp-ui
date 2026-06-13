import { createRole, getRoleDetail, updateRole } from '~/api/role';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { getStatusText } from '~/utils/admin';
import { createFieldErrors, inputPatch, mergeValidation } from '~/utils/form-field';

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
    fieldErrors: createFieldErrors(['roleCode', 'roleName']),
    submitting: false,
  },

  async onLoad(options) {
    const authority = await this.initAuthority();
    this.setPermFlags(
      {
        create: PermissionCode.ROLE_CREATE,
        update: PermissionCode.ROLE_UPDATE,
        assignPerm: PermissionCode.ROLE_PERMISSION_ASSIGN,
      },
      authority,
    );

    const id = options.id || '';
    const isEdit = !!id;
    this.setData({ id, isEdit });
    wx.setNavigationBarTitle({ title: isEdit ? '编辑角色' : '新建角色' });

    if (isEdit) {
      await this.loadDetail(id);
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
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    }
  },

  validateForm() {
    const { isEdit, roleCode, roleName, perms } = this.data;

    if (isEdit && !perms.update) {
      this.onShowToast('#t-toast', '无编辑权限');
      return false;
    }
    if (!isEdit && !perms.create) {
      this.onShowToast('#t-toast', '无创建权限');
      return false;
    }

    const checks = [{ field: 'roleName', message: '请输入角色名称', ok: roleName.trim() !== '' }];
    if (!isEdit) {
      checks.unshift({
        field: 'roleCode',
        message: '请输入角色编码',
        ok: roleCode.trim() !== '',
      });
    }

    const { valid, errors } = mergeValidation(this.data.fieldErrors, checks);
    this.setData({ fieldErrors: errors });
    return valid;
  },

  onRoleCodeInput(e) {
    this.setData(inputPatch(this.data, 'roleCode', e.detail.value));
  },

  onRoleNameInput(e) {
    this.setData(inputPatch(this.data, 'roleName', e.detail.value));
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
    if (this.data.submitting) return;
    if (!this.validateForm()) return;

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
