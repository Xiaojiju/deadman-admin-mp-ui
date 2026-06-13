import { deleteRole, fetchRoleList } from '@admin/api/role';
import useAdminSwipeBehavior from '@admin/behaviors/useAdminSwipe';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { filterByKeyword, getStatusText, isDatasetTruthy } from '~/utils/admin';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior, useAdminSwipeBehavior],

  data: {
    keyword: '',
    allList: [],
    list: [],
    loading: true,
  },

  async onShow() {
    await this.initAuthority();
    this.setPermFlags({
      create: PermissionCode.ROLE_CREATE,
      update: PermissionCode.ROLE_UPDATE,
      remove: PermissionCode.ROLE_DELETE,
      assignPerm: PermissionCode.ROLE_PERMISSION_ASSIGN,
    });
    this.setupAdminSwipe({
      formPath: '/pages/admin/role/form/index',
      deleteTitle: '删除角色',
      deleteFn: deleteRole,
      reloadFn() {
        this.loadList();
      },
      beforeDelete({ builtin }) {
        if (isDatasetTruthy(builtin)) {
          this.onShowToast('#t-toast', '系统内置角色不可删除');
          return true;
        }
        return false;
      },
    });
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await fetchRoleList();
      const allList = (res.data || []).map((item) => ({
        ...item,
        statusText: getStatusText(item.status),
        builtinText: item.systemBuiltin ? '系统内置' : '',
      }));
      this.applyFilter(this.data.keyword, allList);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  applyFilter(keyword, allList) {
    const list = filterByKeyword(allList || this.data.allList, keyword, [
      'roleName',
      'roleCode',
      'description',
    ]);
    this.setData({
      keyword: keyword ?? this.data.keyword,
      allList: allList || this.data.allList,
      list,
    });
  },

  onSearchInput(e) {
    this.applyFilter(e.detail.value);
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/admin/role/form/index' });
  },

  onAssignPermissions(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/role/permissions/index?id=${id}` });
  },
});
