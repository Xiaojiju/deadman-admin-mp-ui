import { fetchDepartmentTree } from '~/api/department';
import { fetchPositions } from '~/api/position';
import { fetchRoleList } from '~/api/role';
import {
  assignUserRoles,
  createUser,
  getUserDetail,
  resetUserPassword,
  updateUser,
} from '~/api/user-admin';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { flattenDepartmentTree, getStatusText, normalizePickerId } from '~/utils/admin';
import { debounce } from '~/utils/debounce';

const EMPTY_POSITION_OPTION = { label: '无职位', value: '' };

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    id: '',
    isEdit: false,
    username: '',
    password: '',
    nickname: '',
    phone: '',
    status: 1,
    statusText: '正常',
    departmentPickerOptions: [],
    positionPickerOptions: [EMPTY_POSITION_OPTION],
    deptPositionVisible: false,
    deptPositionValue: ['', ''],
    deptPositionText: '请选择部门与职位',
    selectedDepartmentId: null,
    selectedPositionId: null,
    statusVisible: false,
    statusPickerValue: [1],
    statusPickerOptions: [
      { label: '正常', value: 1 },
      { label: '禁用', value: 0 },
    ],
    roleList: [],
    selectedRoleIds: [],
    rolesText: '无',
    newPassword: '',
    showResetPanel: false,
    canSubmit: false,
    submitting: false,
    resetting: false,
    positionPickerLoading: false,
  },

  async onLoad(options) {
    this._positionOptionsCache = {};
    this._pendingPickerDepartmentId = null;
    this.debouncedLoadPositionForPicker = debounce((departmentId) => {
      this.fetchPositionOptionsForPicker(departmentId);
    }, 300);

    await this.initAuthority();
    this.setPermFlags({
      create: PermissionCode.USER_CREATE,
      update: PermissionCode.USER_UPDATE,
      resetPassword: PermissionCode.USER_PASSWORD_RESET,
      assignRoles: PermissionCode.ROLE_USER_ASSIGN,
    });

    const id = options.id || '';
    const isEdit = !!id;
    this.setData({ id, isEdit });
    wx.setNavigationBarTitle({ title: isEdit ? '编辑用户' : '新建用户' });

    await this.loadDepartmentOptions();
    if (isEdit) {
      await Promise.all([this.loadDetail(id), this.loadRoles(id)]);
    } else {
      this.updateSubmitState();
    }
  },

  async loadDepartmentOptions() {
    const res = await fetchDepartmentTree();
    const flat = flattenDepartmentTree(res.data || []);
    const departmentPickerOptions = [
      { label: '未分配部门', value: '' },
      ...flat.map((item) => ({
        label: `${item.indent}${item.deptName}`,
        value: item.id,
      })),
    ];
    this.setData({ departmentPickerOptions });
  },

  getPositionCacheKey(departmentId) {
    return String(normalizePickerId(departmentId) ?? '');
  },

  buildPositionPickerOptions(items) {
    const options = (items || []).map((item) => ({
      label: item.positionName,
      value: item.id,
    }));
    return options.length ? options : [{ label: '暂无职位', value: '' }];
  },

  async loadPositionPickerOptions(departmentId, { useCache = true, showLoading = false } = {}) {
    const normalizedDeptId = normalizePickerId(departmentId);

    if (!normalizedDeptId) {
      this.setData({
        positionPickerOptions: [EMPTY_POSITION_OPTION],
        positionPickerLoading: false,
      });
      return;
    }

    const cacheKey = this.getPositionCacheKey(normalizedDeptId);
    if (useCache && this._positionOptionsCache[cacheKey]) {
      this.setData({
        positionPickerOptions: this._positionOptionsCache[cacheKey],
        positionPickerLoading: false,
      });
      return;
    }

    if (showLoading) {
      this.setData({ positionPickerLoading: true });
    }

    try {
      const res = await fetchPositions(normalizedDeptId);
      const options = this.buildPositionPickerOptions(res.data);
      this._positionOptionsCache[cacheKey] = options;
      this.setData({
        positionPickerOptions: options,
        positionPickerLoading: false,
      });
    } catch {
      this.setData({
        positionPickerOptions: [{ label: '加载失败', value: '' }],
        positionPickerLoading: false,
      });
    }
  },

  async fetchPositionOptionsForPicker(departmentId) {
    const normalizedDeptId = normalizePickerId(departmentId);
    if (normalizePickerId(this._pendingPickerDepartmentId) !== normalizedDeptId) return;

    const cacheKey = this.getPositionCacheKey(normalizedDeptId);
    if (this._positionOptionsCache[cacheKey]) {
      if (normalizePickerId(this._pendingPickerDepartmentId) !== normalizedDeptId) return;
      this.setData({
        positionPickerOptions: this._positionOptionsCache[cacheKey],
        positionPickerLoading: false,
      });
      return;
    }

    try {
      const res = await fetchPositions(normalizedDeptId);
      const options = this.buildPositionPickerOptions(res.data);
      this._positionOptionsCache[cacheKey] = options;
      if (normalizePickerId(this._pendingPickerDepartmentId) !== normalizedDeptId) return;
      this.setData({
        positionPickerOptions: options,
        positionPickerLoading: false,
      });
    } catch {
      if (normalizePickerId(this._pendingPickerDepartmentId) !== normalizedDeptId) return;
      this.setData({
        positionPickerOptions: [{ label: '加载失败', value: '' }],
        positionPickerLoading: false,
      });
    }
  },

  buildDeptPositionText(labels, departmentId, positionId) {
    const [deptLabel, posLabel] = labels || [];
    if (!departmentId) return '未分配部门';
    if (!positionId) return deptLabel || '请选择部门与职位';
    return `${deptLabel} / ${posLabel}`;
  },

  findPickerOption(options, value) {
    const normalized = normalizePickerId(value);
    return options.find((item) => normalizePickerId(item.value) === normalized);
  },

  async applyDeptPositionSelection(departmentId, positionId) {
    const normalizedDeptId = normalizePickerId(departmentId);
    await this.loadPositionPickerOptions(normalizedDeptId || null);
    const { departmentPickerOptions, positionPickerOptions } = this.data;
    const deptOption = this.findPickerOption(departmentPickerOptions, normalizedDeptId);
    const posOption = this.findPickerOption(positionPickerOptions, positionId);
    const validPositionId = posOption ? normalizePickerId(posOption.value) : '';
    const deptPositionValue = [normalizedDeptId, validPositionId];
    const labels = [deptOption?.label, posOption?.label].filter(Boolean);
    this.setData({
      deptPositionValue,
      deptPositionText: this.buildDeptPositionText(
        labels,
        normalizedDeptId,
        validPositionId,
      ),
      selectedDepartmentId: normalizedDeptId || null,
      selectedPositionId: validPositionId || null,
    });
  },

  buildRolesText(selectedRoleIds, roleList) {
    if (!selectedRoleIds?.length) return '无';
    const idSet = new Set(selectedRoleIds.map(String));
    const names = (roleList || [])
      .filter((item) => idSet.has(String(item.id)))
      .map((item) => item.roleName);
    if (names.length) return names.join('、');
    return `已选 ${selectedRoleIds.length} 个角色`;
  },

  mapRoleListItems(items, selectedIdSet) {
    return (items || []).map((item) => ({
      id: String(item.id),
      roleCode: item.roleCode,
      roleName: item.roleName,
      description: item.description || '暂无描述',
      status: item.status,
      statusText: getStatusText(item.status),
      selected: selectedIdSet ? selectedIdSet.has(String(item.id)) : false,
    }));
  },

  async loadRoles(userId) {
    if (!this.can(PermissionCode.ROLE_USER_ASSIGN)) return;
    try {
      const [userRes, roleRes] = await Promise.all([getUserDetail(userId), fetchRoleList()]);
      const roleCodes = userRes.data?.roleCodes || [];
      const selectedIdSet = new Set(
        (roleRes.data || [])
          .filter((item) => roleCodes.includes(item.roleCode))
          .map((item) => String(item.id)),
      );
      const roleList = this.mapRoleListItems(roleRes.data, selectedIdSet);
      const selectedRoleIds = roleList.filter((item) => item.selected).map((item) => item.id);
      this.setData({
        roleList,
        selectedRoleIds,
        rolesText: this.buildRolesText(selectedRoleIds, roleList),
      });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载角色失败');
    }
  },

  async loadDetail(id) {
    try {
      const res = await getUserDetail(id);
      const data = res.data || {};
      const departmentId = data.department?.id ?? '';
      const positionId = data.positions?.[0]?.id ?? '';
      await this.applyDeptPositionSelection(departmentId, positionId);
      this.setData({
        username: data.username || '',
        nickname: data.nickname || '',
        phone: data.phone || '',
        status: data.status ?? 1,
        statusText: getStatusText(data.status),
        statusPickerValue: [data.status ?? 1],
      });
      this.updateSubmitState();
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    }
  },

  updateSubmitState(overrides = {}) {
    const username = overrides.username ?? this.data.username ?? '';
    const password = overrides.password ?? this.data.password ?? '';
    const { isEdit } = this.data;
    const canSubmit = isEdit
      ? this.can(PermissionCode.USER_UPDATE)
      : this.can(PermissionCode.USER_CREATE)
        && String(username).trim() !== ''
        && String(password).trim().length >= 8;
    this.setData({ ...overrides, canSubmit });
  },

  onUsernameInput(e) {
    this.updateSubmitState({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.updateSubmitState({ password: e.detail.value });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onNewPasswordInput(e) {
    this.setData({ newPassword: e.detail.value });
  },

  async onOpenDeptPositionPicker() {
    const departmentId = this.data.selectedDepartmentId ?? this.data.deptPositionValue[0] ?? '';
    this._pendingPickerDepartmentId = normalizePickerId(departmentId);
    await this.loadPositionPickerOptions(departmentId || null, { useCache: true });
    this.setData({ deptPositionVisible: true, positionPickerLoading: false });
  },

  onDeptPositionCancel() {
    this.debouncedLoadPositionForPicker?.cancel?.();
    this._pendingPickerDepartmentId = null;
    this.setData({ deptPositionVisible: false, positionPickerLoading: false });
  },

  onDeptPositionPick(e) {
    const { column, value } = e.detail;
    if (column !== 0) return;

    const departmentId = normalizePickerId(value[0]);
    this._pendingPickerDepartmentId = departmentId;

    if (!departmentId) {
      this.debouncedLoadPositionForPicker?.cancel?.();
      this.setData({
        positionPickerOptions: [EMPTY_POSITION_OPTION],
        positionPickerLoading: false,
      });
      return;
    }

    const cacheKey = this.getPositionCacheKey(departmentId);
    if (this._positionOptionsCache[cacheKey]) {
      this.debouncedLoadPositionForPicker?.cancel?.();
      this.setData({
        positionPickerOptions: this._positionOptionsCache[cacheKey],
        positionPickerLoading: false,
      });
      return;
    }

    this.setData({ positionPickerLoading: true });
    this.debouncedLoadPositionForPicker(departmentId);
  },

  onDeptPositionConfirm(e) {
    this.debouncedLoadPositionForPicker?.cancel?.();
    this._pendingPickerDepartmentId = null;
    const { value = [], label = [] } = e.detail;
    const departmentId = normalizePickerId(value[0]);
    const positionId = normalizePickerId(value[1]);
    this.setData({
      deptPositionVisible: false,
      positionPickerLoading: false,
      deptPositionValue: [departmentId, positionId],
      deptPositionText: this.buildDeptPositionText(label, departmentId, positionId),
      selectedDepartmentId: departmentId || null,
      selectedPositionId: positionId || null,
    });
  },

  onUnload() {
    this.debouncedLoadPositionForPicker?.cancel?.();
  },

  onOpenRolePicker() {
    wx.navigateTo({
      url: '/pages/admin/user/roles/index?mode=pick',
      events: {
        roleSelect: ({ selectedRoleIds, roleList }) => {
          this.setData({
            selectedRoleIds,
            roleList,
            rolesText: this.buildRolesText(selectedRoleIds, roleList),
          });
        },
      },
      success: (res) => {
        res.eventChannel.emit('initRoleSelect', {
          selectedRoleIds: this.data.selectedRoleIds,
          roleList: this.data.roleList,
        });
      },
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

  onToggleResetPanel() {
    this.setData({ showResetPanel: !this.data.showResetPanel, newPassword: '' });
  },

  async onResetPassword() {
    const { id, newPassword, resetting, perms } = this.data;
    if (!perms.resetPassword || resetting) return;
    if (newPassword.trim().length < 8) {
      this.onShowToast('#t-toast', '新密码至少 8 位');
      return;
    }
    this.setData({ resetting: true });
    try {
      await resetUserPassword(id, newPassword.trim());
      this.onShowToast('#t-toast', '密码已重置');
      this.setData({ showResetPanel: false, newPassword: '' });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '重置失败');
    } finally {
      this.setData({ resetting: false });
    }
  },

  async onSubmit() {
    if (!this.data.canSubmit || this.data.submitting) return;

    const {
      isEdit,
      id,
      username,
      password,
      nickname,
      phone,
      status,
      selectedDepartmentId,
      selectedPositionId,
      selectedRoleIds,
      perms,
    } = this.data;
    const positionIds = selectedPositionId ? [selectedPositionId] : [];

    this.setData({ submitting: true });
    try {
      if (isEdit) {
        await updateUser(id, {
          nickname: nickname.trim() || null,
          phone: phone.trim() || null,
          status,
          departmentId: selectedDepartmentId,
          positionIds,
        });
        if (perms.assignRoles) {
          await assignUserRoles(id, selectedRoleIds);
        }
      } else {
        const res = await createUser({
          username: username.trim(),
          password: password.trim(),
          nickname: nickname.trim() || undefined,
          phone: phone.trim() || undefined,
          departmentId: selectedDepartmentId || undefined,
          positionIds: positionIds.length ? positionIds : undefined,
        });
        const newUserId = res?.data?.id ?? '';
        if (perms.assignRoles && selectedRoleIds.length && newUserId) {
          await assignUserRoles(newUserId, selectedRoleIds);
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
