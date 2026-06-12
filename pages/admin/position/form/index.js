import { fetchDepartmentTree } from '~/api/department';
import { createPosition, getPosition, updatePosition } from '~/api/position';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { flattenDepartmentTree, getStatusText, normalizePickerId } from '~/utils/admin';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    id: '',
    isEdit: false,
    positionCode: '',
    positionName: '',
    status: 1,
    statusText: '正常',
    departmentPickerOptions: [],
    departmentPickerValue: [''],
    departmentText: '全局职位（不限部门）',
    selectedDepartmentId: null,
    departmentVisible: false,
    statusVisible: false,
    statusPickerValue: [1],
    statusPickerOptions: [
      { label: '正常', value: 1 },
      { label: '禁用', value: 0 },
    ],
    canSubmit: false,
    submitting: false,
  },

  async onLoad(options) {
    await this.initAuthority();
    this.setPermFlags({
      create: PermissionCode.POSITION_CREATE,
      update: PermissionCode.POSITION_UPDATE,
    });

    const id = options.id || '';
    const isEdit = !!id;
    this.setData({ id, isEdit });
    wx.setNavigationBarTitle({ title: isEdit ? '编辑职位' : '新建职位' });

    await this.loadDepartmentOptions();
    if (isEdit) {
      await this.loadDetail(id);
    } else {
      this.updateSubmitState();
    }
  },

  async loadDepartmentOptions() {
    const res = await fetchDepartmentTree();
    const flat = flattenDepartmentTree(res.data || []);
    const departmentPickerOptions = [
      { label: '全局职位（不限部门）', value: '' },
      ...flat.map((item) => ({
        label: `${item.indent}${item.deptName}`,
        value: item.id,
      })),
    ];
    this.setData({ departmentPickerOptions });
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
      this.updateSubmitState();
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    }
  },

  updateSubmitState() {
    const { isEdit, positionCode, positionName, perms } = this.data;
    const canSubmit = isEdit
      ? perms.update && positionName.trim() !== ''
      : perms.create && positionCode.trim() !== '' && positionName.trim() !== '';
    this.setData({ canSubmit });
  },

  onPositionCodeInput(e) {
    this.setData({ positionCode: e.detail.value });
    this.updateSubmitState();
  },

  onPositionNameInput(e) {
    this.setData({ positionName: e.detail.value });
    this.updateSubmitState();
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

  onOpenStatusPicker() {
    this.setData({ statusVisible: true });
  },

  onStatusCancel() {
    this.setData({ statusVisible: false });
  },

  onStatusConfirm(e) {
    const status = Number(e.detail.value[0]);
    const statusText = e.detail.label?.[0] || getStatusText(status);
    this.setData({
      statusVisible: false,
      status: status === 1 ? 1 : 0,
      statusText,
      statusPickerValue: [status],
    });
  },

  async onSubmit() {
    if (!this.data.canSubmit || this.data.submitting) return;

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
