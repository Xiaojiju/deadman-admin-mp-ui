import {
  createDepartment,
  fetchDepartmentTree,
  getDepartment,
  updateDepartment,
} from '~/api/department';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useStatusPickerBehavior from '@admin/behaviors/useStatusPicker';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import {
  buildFlatDepartmentPickerOptions,
  flattenDepartmentTree,
  getStatusText,
  normalizePickerId,
} from '~/utils/admin';
import { assertFormPerm, createFieldErrors, inputPatch, mergeValidation } from '~/utils/form-field';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior, useStatusPickerBehavior],

  data: {
    id: '',
    isEdit: false,
    deptCode: '',
    deptName: '',
    parentPickerOptions: [],
    parentPickerValue: [''],
    parentText: '无（根部门）',
    selectedParentId: null,
    parentVisible: false,
    fieldErrors: createFieldErrors(['deptCode', 'deptName']),
    submitting: false,
  },

  async onLoad(options) {
    const authority = await this.initAuthority();
    this.setPermFlags(
      {
        create: PermissionCode.DEPT_CREATE,
        update: PermissionCode.DEPT_UPDATE,
      },
      authority,
    );

    const id = options.id || '';
    const isEdit = !!id;
    this.setData({ id, isEdit });
    wx.setNavigationBarTitle({ title: isEdit ? '编辑部门' : '新建部门' });

    await this.loadParentOptions(id);
    if (isEdit) {
      await this.loadDetail(id);
    }
  },

  async loadParentOptions(excludeId) {
    const res = await fetchDepartmentTree();
    const flat = flattenDepartmentTree(res.data || []).filter(
      (item) => !excludeId || String(item.id) !== String(excludeId),
    );
    const parentPickerOptions = buildFlatDepartmentPickerOptions(flat, { emptyLabel: '无（根部门）' });
    this.setData({ parentPickerOptions });
  },

  applyParentSelection(parentId) {
    const normalizedId = normalizePickerId(parentId);
    const option = this.data.parentPickerOptions.find(
      (item) => normalizePickerId(item.value) === normalizedId,
    );
    this.setData({
      parentPickerValue: [normalizedId],
      parentText: option?.label || '无（根部门）',
      selectedParentId: normalizedId || null,
    });
  },

  async loadDetail(id) {
    try {
      const res = await getDepartment(id);
      const data = res.data || {};
      this.applyParentSelection(data.parentId ?? '');
      this.setData({
        deptCode: data.deptCode || '',
        deptName: data.deptName || '',
        status: data.status ?? 1,
        statusText: getStatusText(data.status),
        statusPickerValue: [data.status ?? 1],
      });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    }
  },

  validateForm() {
    const { isEdit, deptCode, deptName, perms } = this.data;
    if (
      !assertFormPerm(isEdit, perms, (msg) => {
        this.onShowToast('#t-toast', msg);
      })
    ) {
      return false;
    }

    const checks = [{ field: 'deptName', message: '请输入部门名称', ok: deptName.trim() !== '' }];
    if (!isEdit) {
      checks.unshift({
        field: 'deptCode',
        message: '请输入部门编码',
        ok: deptCode.trim() !== '',
      });
    }

    const { valid, errors } = mergeValidation(this.data.fieldErrors, checks);
    this.setData({ fieldErrors: errors });
    return valid;
  },

  onDeptCodeInput(e) {
    this.setData(inputPatch(this.data, 'deptCode', e.detail.value));
  },

  onDeptNameInput(e) {
    this.setData(inputPatch(this.data, 'deptName', e.detail.value));
  },

  onOpenParentPicker() {
    this.setData({ parentVisible: true });
  },

  onParentCancel() {
    this.setData({ parentVisible: false });
  },

  onParentConfirm(e) {
    const { value = [], label = [] } = e.detail;
    const parentId = normalizePickerId(value[0]);
    this.setData({
      parentVisible: false,
      parentPickerValue: [parentId],
      parentText: label[0] || '无（根部门）',
      selectedParentId: parentId || null,
    });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    if (!this.validateForm()) return;

    const { isEdit, id, deptCode, deptName, status, selectedParentId } = this.data;
    const payload = {
      deptName: deptName.trim(),
      sortOrder: 0,
      parentId: selectedParentId,
    };

    this.setData({ submitting: true });
    try {
      if (isEdit) {
        payload.status = status;
        await updateDepartment(id, payload);
      } else {
        payload.deptCode = deptCode.trim();
        await createDepartment(payload);
      }
      this.onShowToast('#t-toast', '保存成功');
      setTimeout(() => wx.navigateBack(), 600);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '保存失败');
      this.setData({ submitting: false });
    }
  },
});
