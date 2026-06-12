import {
  createDepartment,
  fetchDepartmentTree,
  getDepartment,
  updateDepartment,
} from '~/api/department';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { flattenDepartmentTree, getStatusText, normalizePickerId } from '~/utils/admin';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    id: '',
    isEdit: false,
    deptCode: '',
    deptName: '',
    status: 1,
    statusText: '正常',
    parentPickerOptions: [],
    parentPickerValue: [''],
    parentText: '无（根部门）',
    selectedParentId: null,
    parentVisible: false,
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
      create: PermissionCode.DEPT_CREATE,
      update: PermissionCode.DEPT_UPDATE,
    });

    const id = options.id || '';
    const isEdit = !!id;
    this.setData({ id, isEdit });
    wx.setNavigationBarTitle({ title: isEdit ? '编辑部门' : '新建部门' });

    await this.loadParentOptions(id);
    if (isEdit) {
      await this.loadDetail(id);
    } else {
      this.updateSubmitState();
    }
  },

  async loadParentOptions(excludeId) {
    const res = await fetchDepartmentTree();
    const flat = flattenDepartmentTree(res.data || []).filter(
      (item) => !excludeId || String(item.id) !== String(excludeId),
    );
    const parentPickerOptions = [
      { label: '无（根部门）', value: '' },
      ...flat.map((item) => ({
        label: `${item.indent}${item.deptName}`,
        value: item.id,
      })),
    ];
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
      this.updateSubmitState();
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    }
  },

  updateSubmitState() {
    const { isEdit, deptCode, deptName, perms } = this.data;
    const canSubmit = isEdit
      ? perms.update && deptName.trim() !== ''
      : perms.create && deptCode.trim() !== '' && deptName.trim() !== '';
    this.setData({ canSubmit });
  },

  onDeptCodeInput(e) {
    this.setData({ deptCode: e.detail.value });
    this.updateSubmitState();
  },

  onDeptNameInput(e) {
    this.setData({ deptName: e.detail.value });
    this.updateSubmitState();
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
