import { sendMessage } from '~/api/notification';
import { fetchDepartmentTree, fetchPositions } from '~/api/org';
import { fetchUserList } from '~/api/user';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { ensureLoggedIn } from '~/utils/auth';
import { flattenDepartments } from '~/utils/org-tree';
import { resolveAssetUrl } from '~/utils/url';

const SCOPE_OPTIONS = [
  { value: 1, label: '指定用户', targetLabel: '接收用户' },
  { value: 2, label: '按部门', targetLabel: '接收部门' },
  { value: 3, label: '按职位', targetLabel: '接收职位' },
  { value: 4, label: '全体用户', targetLabel: '' },
];

function mapUserItem(item) {
  const nickname = item.nickname || item.username || '未命名';
  const departmentName = item.department?.name || '';
  return {
    id: item.id,
    username: item.username || '',
    nickname,
    avatar: resolveAssetUrl(item.avatar),
    departmentName,
    displayLine: departmentName ? `${nickname} · ${departmentName}` : nickname,
    selected: false,
  };
}

function mapPositionItem(item) {
  return {
    id: item.id,
    name: item.positionName || '',
    code: item.positionCode || '',
    selected: false,
  };
}

Page({
  behaviors: [useThemeBehavior, useToastBehavior],

  data: {
    title: '',
    content: '',
    targetType: 1,
    scopeLabel: '指定用户',
    targetLabel: '接收用户',
    scopeOpen: false,
    scopeOptions: SCOPE_OPTIONS,
    searchKeyword: '',
    selectedUsers: [],
    selectedDepartmentIds: [],
    selectedPositionIds: [],
    userList: [],
    departmentList: [],
    positionList: [],
    listLoading: false,
    canSubmit: false,
    submitting: false,
    showTargetPanel: true,
  },

  searchTimer: null,

  onLoad() {
    if (!ensureLoggedIn()) return;
    this.loadTargetList();
  },

  onUnload() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  },

  updateSubmitState() {
    const {
      title,
      content,
      targetType,
      selectedUsers,
      selectedDepartmentIds,
      selectedPositionIds,
    } = this.data;
    const hasBase = title.trim() !== '' && content.trim() !== '';

    let hasTarget = true;
    if (targetType === 1) {
      hasTarget = selectedUsers.length > 0;
    } else if (targetType === 2) {
      hasTarget = selectedDepartmentIds.length > 0;
    } else if (targetType === 3) {
      hasTarget = selectedPositionIds.length > 0;
    }

    this.setData({ canSubmit: hasBase && hasTarget });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
    this.updateSubmitState();
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
    this.updateSubmitState();
  },

  onToggleScope() {
    this.setData({ scopeOpen: !this.data.scopeOpen });
  },

  onCloseScope() {
    this.setData({ scopeOpen: false });
  },

  onScopeSelect(e) {
    const { value } = e.currentTarget.dataset;
    const option = SCOPE_OPTIONS.find((item) => item.value === value);
    if (!option || value === this.data.targetType) {
      this.setData({ scopeOpen: false });
      return;
    }

    this.setData({
      targetType: value,
      scopeLabel: option.label,
      targetLabel: option.targetLabel,
      scopeOpen: false,
      showTargetPanel: value !== 4,
      searchKeyword: '',
      selectedUsers: [],
      selectedDepartmentIds: [],
      selectedPositionIds: [],
    });
    this.loadTargetList();
    this.updateSubmitState();
  },

  async loadTargetList() {
    const { targetType } = this.data;
    if (targetType === 4) return;

    this.setData({ listLoading: true });
    try {
      if (targetType === 1) {
        await this.loadUsers();
      } else if (targetType === 2) {
        await this.loadDepartments();
      } else if (targetType === 3) {
        await this.loadPositions();
      }
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载列表失败');
    } finally {
      this.setData({ listLoading: false });
    }
  },

  async loadUsers() {
    const res = await fetchUserList({ keyword: this.data.searchKeyword, size: 50 });
    const selectedIds = new Set(this.data.selectedUsers.map((item) => item.id));
    const userList = (res.data?.records || []).map((item) => {
      const mapped = mapUserItem(item);
      mapped.selected = selectedIds.has(mapped.id);
      return mapped;
    });
    this.setData({ userList });
  },

  async loadDepartments() {
    const res = await fetchDepartmentTree();
    const keyword = this.data.searchKeyword.trim().toLowerCase();
    const selectedIds = new Set(this.data.selectedDepartmentIds);
    const departmentList = flattenDepartments(res.data || [])
      .filter((item) => !keyword || item.name.toLowerCase().includes(keyword))
      .map((item) => ({
        ...item,
        selected: selectedIds.has(item.id),
        indent: item.level > 0 ? `${'　'.repeat(item.level)}` : '',
      }));
    this.setData({ departmentList });
  },

  async loadPositions() {
    const res = await fetchPositions();
    const keyword = this.data.searchKeyword.trim().toLowerCase();
    const selectedIds = new Set(this.data.selectedPositionIds);
    const positionList = (res.data || [])
      .map(mapPositionItem)
      .filter(
        (item) =>
          !keyword ||
          item.name.toLowerCase().includes(keyword) ||
          item.code.toLowerCase().includes(keyword),
      )
      .map((item) => ({
        ...item,
        selected: selectedIds.has(item.id),
      }));
    this.setData({ positionList });
  },

  onSearchInput(e) {
    const searchKeyword = e.detail.value;
    this.setData({ searchKeyword });

    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.loadTargetList();
    }, 300);
  },

  onToggleUser(e) {
    const { id } = e.currentTarget.dataset;
    const user = this.data.userList.find((item) => item.id === id);
    if (!user) return;

    let { selectedUsers } = this.data;
    const exists = selectedUsers.some((item) => item.id === id);
    if (exists) {
      selectedUsers = selectedUsers.filter((item) => item.id !== id);
    } else {
      selectedUsers = [...selectedUsers, user];
    }

    const userList = this.data.userList.map((item) => ({
      ...item,
      selected: selectedUsers.some((selected) => selected.id === item.id),
    }));

    this.setData({ selectedUsers, userList });
    this.updateSubmitState();
  },

  onRemoveUser(e) {
    const { id } = e.currentTarget.dataset;
    const selectedUsers = this.data.selectedUsers.filter((item) => item.id !== id);
    const userList = this.data.userList.map((item) => ({
      ...item,
      selected: selectedUsers.some((selected) => selected.id === item.id),
    }));
    this.setData({ selectedUsers, userList });
    this.updateSubmitState();
  },

  onToggleDepartment(e) {
    const { id } = e.currentTarget.dataset;
    let { selectedDepartmentIds } = this.data;
    if (selectedDepartmentIds.includes(id)) {
      selectedDepartmentIds = selectedDepartmentIds.filter((item) => item !== id);
    } else {
      selectedDepartmentIds = [...selectedDepartmentIds, id];
    }
    const departmentList = this.data.departmentList.map((item) => ({
      ...item,
      selected: selectedDepartmentIds.includes(item.id),
    }));
    this.setData({ selectedDepartmentIds, departmentList });
    this.updateSubmitState();
  },

  onTogglePosition(e) {
    const { id } = e.currentTarget.dataset;
    let { selectedPositionIds } = this.data;
    if (selectedPositionIds.includes(id)) {
      selectedPositionIds = selectedPositionIds.filter((item) => item !== id);
    } else {
      selectedPositionIds = [...selectedPositionIds, id];
    }
    const positionList = this.data.positionList.map((item) => ({
      ...item,
      selected: selectedPositionIds.includes(item.id),
    }));
    this.setData({ selectedPositionIds, positionList });
    this.updateSubmitState();
  },

  onCancel() {
    wx.navigateBack();
  },

  async onSubmit() {
    if (!this.data.canSubmit || this.data.submitting) return;

    const {
      title,
      content,
      targetType,
      selectedUsers,
      selectedDepartmentIds,
      selectedPositionIds,
    } = this.data;
    const payload = {
      title: title.trim(),
      content: content.trim(),
      targetType,
    };

    if (targetType === 1) {
      payload.userIds = selectedUsers.map((item) => item.id);
    } else if (targetType === 2) {
      payload.departmentIds = selectedDepartmentIds;
    } else if (targetType === 3) {
      payload.positionIds = selectedPositionIds;
    }

    this.setData({ submitting: true });
    try {
      await sendMessage(payload);
      this.onShowToast('#t-toast', '发送成功');
      setTimeout(() => {
        wx.navigateBack();
      }, 800);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '发送失败');
      this.setData({ submitting: false });
    }
  },
});
