import { deletePosition, fetchPositions } from '~/api/position';
import { fetchDepartmentTree } from '~/api/department';
import useAdminSwipeBehavior from '@admin/behaviors/useAdminSwipe';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { filterByKeyword, flattenDepartmentTree, getStatusText } from '~/utils/admin';

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
      create: PermissionCode.POSITION_CREATE,
      update: PermissionCode.POSITION_UPDATE,
      remove: PermissionCode.POSITION_DELETE,
    });
    this.setupAdminSwipe({
      formPath: '/pages/admin/position/form/index',
      deleteTitle: '删除职位',
      deleteFn: deletePosition,
      reloadFn() {
        this.loadList();
      },
    });
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const [posRes, deptRes] = await Promise.all([fetchPositions(), fetchDepartmentTree()]);
      const deptMap = {};
      flattenDepartmentTree(deptRes.data || []).forEach((item) => {
        deptMap[item.id] = item.deptName;
      });
      const allList = (posRes.data || []).map((item) => ({
        ...item,
        statusText: getStatusText(item.status),
        departmentName: item.departmentId
          ? deptMap[item.departmentId] || `部门#${item.departmentId}`
          : '全局职位',
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
      'positionName',
      'positionCode',
      'departmentName',
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
    wx.navigateTo({ url: '/pages/admin/position/form/index' });
  },
});
