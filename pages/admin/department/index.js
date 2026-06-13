import { deleteDepartment, fetchDepartmentTree } from '~/api/department';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import {
  buildDepartmentSearchList,
  buildDepartmentVisibleList,
  confirmAdminDelete,
  normalizePickerId,
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
    const id = normalizePickerId(e.currentTarget.dataset.id);
    const expandedIds = this.data.expandedIds.map((item) => normalizePickerId(item));
    const index = expandedIds.indexOf(id);
    if (index >= 0) expandedIds.splice(index, 1);
    else expandedIds.push(id);
    this.setData({ expandedIds });
    this.rebuildList(this.data.tree, this.data.keyword, expandedIds);
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/admin/department/form/index' });
  },

  onSwipeEdit(e) {
    if (!this.data.perms.update) {
      this.onShowToast('#t-toast', '无编辑权限');
      return;
    }
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/department/form/index?id=${id}` });
  },

  onSwipeDelete(e) {
    if (!this.data.perms.remove) {
      this.onShowToast('#t-toast', '无删除权限');
      return;
    }
    const { id, name } = e.currentTarget.dataset;
    confirmAdminDelete({
      title: '删除部门',
      name,
      onConfirm: async () => {
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
