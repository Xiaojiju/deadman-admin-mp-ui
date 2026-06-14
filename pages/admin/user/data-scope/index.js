import { assignUserDataScope, getUserDataScope, getUserDetail } from '@admin/api/user-admin';
import { fetchDepartmentTree } from '~/api/department';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { flattenDepartmentTree } from '~/utils/admin';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    userId: '',
    userName: '',
    deptList: [],
    selectedDeptIds: [],
    submitting: false,
    loading: true,
  },

  async onLoad(options) {
    await this.initAuthority();

    const userId = options.userId || '';
    if (!userId || !this.can(PermissionCode.USER_UPDATE)) {
      this.onShowToast('#t-toast', '无权限');
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    this.setData({ userId });
    this._pickInit = null;

    const channel = this.getOpenerEventChannel();
    if (channel) {
      channel.on('initDataScope', (data) => {
        this._pickInit = data || {};
        if (this._deptsLoaded) this.applyPickInit();
      });
    }

    await this.loadDepartments(userId);
  },

  applyPickInit() {
    const selectedDeptIds = (this._pickInit?.customDeptIds || []).map(String);
    this.setData({ selectedDeptIds });
  },

  async loadDepartments(userId) {
    this.setData({ loading: true });
    try {
      const [userRes, treeRes, scopeRes] = await Promise.all([
        getUserDetail(userId),
        fetchDepartmentTree(),
        getUserDataScope(userId),
      ]);
      const user = userRes.data || {};
      const scope = scopeRes.data || {};
      const flat = flattenDepartmentTree(treeRes.data || []);
      const deptList = flat.map((item) => ({
        id: String(item.id),
        deptName: `${item.indent}${item.deptName}`,
        deptCode: item.deptCode || '',
      }));

      const initIds = (this._pickInit?.customDeptIds || scope.customDeptIds || []).map(String);
      const selectedIdSet = new Set(initIds);
      const selectedDeptIds = deptList.filter((item) => selectedIdSet.has(item.id)).map((item) => item.id);

      this._deptsLoaded = true;
      this.setData({
        userName: user.nickname || user.username || '',
        deptList,
        selectedDeptIds,
      });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  onDeptChange(e) {
    this.setData({ selectedDeptIds: (e.detail.value || []).map(String) });
  },

  async onSubmit() {
    if (this.data.submitting) return;

    const { userId, selectedDeptIds } = this.data;
    if (!selectedDeptIds.length) {
      this.onShowToast('#t-toast', '请至少选择一个部门');
      return;
    }

    this.setData({ submitting: true });
    try {
      await assignUserDataScope(userId, {
        scopeType: 'CUSTOM',
        customDeptIds: selectedDeptIds,
      });
      const channel = this.getOpenerEventChannel();
      channel?.emit?.('dataScopeSaved');
      this.onShowToast('#t-toast', '数据范围已更新');
      setTimeout(() => wx.navigateBack(), 600);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '保存失败');
      this.setData({ submitting: false });
    }
  },
});
