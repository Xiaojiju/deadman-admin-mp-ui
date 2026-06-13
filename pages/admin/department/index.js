import { deleteDepartment, fetchDepartmentTree } from '~/api/department';
import useAdminSwipeBehavior from '@admin/behaviors/useAdminSwipe';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import {
  buildDepartmentSearchList,
  buildDepartmentVisibleList,
  normalizePickerId,
} from '~/utils/admin';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior, useAdminSwipeBehavior],

  data: {
    keyword: '',
    tree: [],
    expandedIds: [],
    list: [],
    loading: true,
  },

  searchTimer: null,

  async onShow() {
    await this.initAuthority();
    this.setPermFlags({
      create: PermissionCode.DEPT_CREATE,
      update: PermissionCode.DEPT_UPDATE,
      remove: PermissionCode.DEPT_DELETE,
    });
    this.setupAdminSwipe({
      formPath: '/pages/admin/department/form/index',
      deleteTitle: '删除部门',
      deleteFn: deleteDepartment,
      reloadFn() {
        this.loadList();
      },
    });
    this.loadList();
  },

  onUnload() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await fetchDepartmentTree();
      const tree = res.data || [];
      const expandedIds = this.data.expandedIds || [];
      this.setData({ tree });
      this.rebuildList(tree, this.data.keyword, expandedIds);
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
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.setData({ keyword });
      this.rebuildList(this.data.tree, keyword, this.data.expandedIds);
    }, 300);
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
});
