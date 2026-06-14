import { fetchDepartmentTree } from '~/api/department';
import { getUserDataScope, getUserDetail } from '@admin/api/user-admin';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { flattenDepartmentTree, getDataScopeText, getStatusText, isSystemAdminUser } from '~/utils/admin';
import { formatDetailTime } from '~/utils/format';
import { resolveAssetUrl } from '~/utils/url';

function buildCustomDeptText(customDeptIds, deptNameMap) {
  if (!customDeptIds?.length) return '';
  const names = customDeptIds
    .map((id) => deptNameMap.get(String(id)))
    .filter(Boolean);
  if (!names.length) return `已选 ${customDeptIds.length} 个部门`;
  return `可见部门：${names.join('、')}`;
}

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    id: '',
    loading: true,
    displayName: '',
    username: '',
    userCode: '',
    nickname: '',
    phone: '',
    status: 1,
    statusText: '-',
    superAdmin: false,
    avatarDisplay: '',
    departmentName: '未分配',
    positionsText: '未分配',
    rolesText: '无',
    dataScopeText: '-',
    customDeptText: '',
    createTimeText: '',
    updateTimeText: '',
  },

  async onLoad(options) {
    await this.initAuthority();
    this.setPermFlags({
      read: PermissionCode.USER_LIST_READ,
      update: PermissionCode.USER_UPDATE,
    });

    const id = options.id || '';
    if (!id || !this.can(PermissionCode.USER_LIST_READ)) {
      this.onShowToast('#t-toast', '无权限');
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    this.setData({ id });
    await this.loadDetail(id);
    this._detailLoaded = true;
  },

  async onShow() {
    if (!this.data.id || !this._detailLoaded) return;
    await this.loadDetail(this.data.id, { silent: true });
  },

  async loadDetail(id, { silent = false } = {}) {
    if (!silent) this.setData({ loading: true });

    try {
      const [userRes, scopeRes, treeRes] = await Promise.all([
        getUserDetail(id),
        getUserDataScope(id).catch(() => ({ data: null })),
        fetchDepartmentTree().catch(() => ({ data: [] })),
      ]);

      const user = userRes.data || {};
      const scope = scopeRes.data || {};
      const flat = flattenDepartmentTree(treeRes.data || []);
      const deptNameMap = new Map(flat.map((item) => [String(item.id), item.deptName]));

      const positions = (user.positions || []).map((p) => p.name).join('、');
      const scopeType = scope.scopeType || 'DEPT';

      this.setData({
        displayName: user.nickname || user.username || '未命名',
        username: user.username || '-',
        userCode: user.userCode || '',
        nickname: user.nickname || '',
        phone: user.phone || '',
        status: user.status ?? 1,
        statusText: getStatusText(user.status),
        superAdmin: isSystemAdminUser(user),
        avatarDisplay: resolveAssetUrl(user.avatar),
        departmentName: user.department?.name || '未分配',
        positionsText: positions || '未分配',
        rolesText: (user.roleCodes || []).join('、') || '无',
        dataScopeText: getDataScopeText(scopeType),
        customDeptText: scopeType === 'CUSTOM' ? buildCustomDeptText(scope.customDeptIds, deptNameMap) : '',
        createTimeText: user.createTime ? formatDetailTime(user.createTime) : '',
        updateTimeText: user.updateTime ? formatDetailTime(user.updateTime) : '',
      });
    } catch (err) {
      if (!silent) {
        this.onShowToast('#t-toast', err?.msg || '加载失败');
        setTimeout(() => wx.navigateBack(), 800);
      }
    } finally {
      if (!silent) this.setData({ loading: false });
    }
  },

  onEdit() {
    const { id } = this.data;
    if (!id) return;
    wx.navigateTo({ url: `/pages/admin/user/form/index?id=${id}` });
  },
});
