import { deletePosition, fetchPositions } from '~/api/position';
import { fetchDepartmentTree } from '~/api/department';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { confirmAdminDelete, filterByKeyword, flattenDepartmentTree, getStatusText } from '~/utils/admin';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

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
      this.setData({ allList });
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
    this.setData({ list });
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    this.applyFilter(keyword);
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/admin/position/form/index' });
  },

  onSwipeEdit(e) {
    if (!this.data.perms.update) {
      this.onShowToast('#t-toast', '无编辑权限');
      return;
    }
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/position/form/index?id=${id}` });
  },

  onSwipeDelete(e) {
    if (!this.data.perms.remove) {
      this.onShowToast('#t-toast', '无删除权限');
      return;
    }
    const { id, name } = e.currentTarget.dataset;
    confirmAdminDelete({
      title: '删除职位',
      name,
      onConfirm: async () => {
        try {
          await deletePosition(id);
          this.onShowToast('#t-toast', '已删除');
          this.loadList();
        } catch (err) {
          this.onShowToast('#t-toast', err?.msg || '删除失败');
        }
      },
    });
  },
});
