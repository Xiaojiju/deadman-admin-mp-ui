import { fetchDepartmentTree } from '~/api/department';
import { createPosition, getPosition, updatePosition } from '~/api/position';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useStatusPickerBehavior from '~/behaviors/useStatusPicker';
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
    positionCode: '',
    positionName: '',
    departmentPickerOptions: [],
    departmentPickerValue: [''],
    departmentText: '全局职位（不限部门）',
    selectedDepartmentId: null,
    departmentVisible: false,
    fieldErrors: createFieldErrors(['positionCode', 'positionName']),
    submitting: false,
  },

  async onLoad(options) {
    const authority = await this.initAuthority();
    this.setPermFlags(
      {
        create: PermissionCode.POSITION_CREATE,
        update: PermissionCode.POSITION_UPDATE,
      },
      authority,
    );

    const id = options.id || '';
    const isEdit = !!id;
    this.setData({ id, isEdit });
    wx.setNavigationBarTitle({ title: isEdit ? '编辑职位' : '新建职位' });

    await this.loadDepartmentOptions();
    if (isEdit) {
      await this.loadDetail(id);
    }
  },

  async loadDepartmentOptions() {
    const res = await fetchDepartmentTree();
    const flat = flattenDepartmentTree(res.data || []);
    this.setData({
      departmentPickerOptions: buildFlatDepartmentPickerOptions(flat, {
        emptyLabel: '全局职位（不限部门）',
      }),
    });
  },

  applyDepartmentSelection(departmentId) {
    const normalizedId = normalizePickerId(departmentId);
    const option = this.data.departmentPickerOptions.find(
      (item) => normalizePickerId(item.value) === normalizedId,
    );
    this.setData({
      departmentPickerValue: [normalizedId],
      departmentText: option?.label || '全局职位（不限部门）',
      selectedDepartmentId: normalizedId || null,
    });
  },

  async loadDetail(id) {
    try {
      const res = await getPosition(id);
      const data = res.data || {};
      this.applyDepartmentSelection(data.departmentId ?? '');
      this.setData({
        positionCode: data.positionCode || '',
        positionName: data.positionName || '',
        status: data.status ?? 1,
        statusText: getStatusText(data.status),
        statusPickerValue: [data.status ?? 1],
      });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    }
  },

  validateForm() {
    const { isEdit, positionCode, positionName, perms } = this.data;
    if (
      !assertFormPerm(isEdit, perms, (msg) => {
        this.onShowToast('#t-toast', msg);
      })
    ) {
      return false;
    }

    const checks = [
      { field: 'positionName', message: '请输入职位名称', ok: positionName.trim() !== '' },
    ];
    if (!isEdit) {
      checks.unshift({
        field: 'positionCode',
        message: '请输入职位编码',
        ok: positionCode.trim() !== '',
      });
    }

    const { valid, errors } = mergeValidation(this.data.fieldErrors, checks);
    this.setData({ fieldErrors: errors });
    return valid;
  },

  onPositionCodeInput(e) {
    this.setData(inputPatch(this.data, 'positionCode', e.detail.value));
  },

  onPositionNameInput(e) {
    this.setData(inputPatch(this.data, 'positionName', e.detail.value));
  },

  onOpenDepartmentPicker() {
    this.setData({ departmentVisible: true });
  },

  onDepartmentCancel() {
    this.setData({ departmentVisible: false });
  },

  onDepartmentConfirm(e) {
    const { value = [], label = [] } = e.detail;
    const departmentId = normalizePickerId(value[0]);
    this.setData({
      departmentVisible: false,
      departmentPickerValue: [departmentId],
      departmentText: label[0] || '全局职位（不限部门）',
      selectedDepartmentId: departmentId || null,
    });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    if (!this.validateForm()) return;

    const { isEdit, id, positionCode, positionName, status, selectedDepartmentId } = this.data;
    const payload = {
      positionName: positionName.trim(),
      sortOrder: 0,
      departmentId: selectedDepartmentId,
    };

    this.setData({ submitting: true });
    try {
      if (isEdit) {
        payload.status = status;
        await updatePosition(id, payload);
      } else {
        payload.positionCode = positionCode.trim();
        await createPosition(payload);
      }
      this.onShowToast('#t-toast', '保存成功');
      setTimeout(() => wx.navigateBack(), 600);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '保存失败');
      this.setData({ submitting: false });
    }
  },
});
