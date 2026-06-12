import { deleteDepartment, fetchDepartmentTree } from '~/api/department';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import {
  buildDepartmentSearchList,
  buildDepartmentVisibleList,
} from '~/utils/admin';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    keyword: '',
    tree: [],
    expandedIds: [],
    list: [],
    loading: true,
  },

  async onShow() {
    await this.initAuthority();
    this.setPermFlags({
      create: PermissionCode.DEPT_CREATE,
      update: PermissionCode.DEPT_UPDATE,
      remove: PermissionCode.DEPT_DELETE,
    });
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await fetchDepartmentTree();
      const tree = res.data || [];
      this.setData({ tree, expandedIds: [] });
      this.rebuildList(tree, '', []);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  rebuildList(tree, keyword, expandedIds) {
    const kw = (keyword || '').trim();
    const list = kw
      ? buildDepartmentSearchList(tree, kw)
      : buildDepartmentVisibleList(tree, expandedIds);
    this.setData({ list });
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    this.rebuildList(this.data.tree, keyword, this.data.expandedIds);
  },

  onToggleExpand(e) {
    if (this.data.keyword.trim()) return;
    const id = Number(e.currentTarget.dataset.id);
    const expandedIds = [...this.data.expandedIds];
    const index = expandedIds.indexOf(id);
    if (index >= 0) expandedIds.splice(index, 1);
    else expandedIds.push(id);
    this.setData({ expandedIds });
    this.rebuildList(this.data.tree, this.data.keyword, expandedIds);
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/admin/department/form/index' });
  },

  onItemTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/department/form/index?id=${id}` });
  },

  onItemLongPress(e) {
    if (!this.data.perms.remove) return;
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除部门',
      content: `确定删除「${name}」吗？`,
      confirmColor: '#e34d59',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await deleteDepartment(id);
          this.onShowToast('#t-toast', '已删除');
          this.loadList();
        } catch (err) {
          this.onShowToast('#t-toast', err?.msg || '删除失败');
        }
      },
    });
  },
});
