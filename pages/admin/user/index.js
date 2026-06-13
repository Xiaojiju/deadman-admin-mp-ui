import { deleteUser, fetchUserList } from '~/api/user-admin';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { confirmAdminDelete, getStatusText } from '~/utils/admin';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    keyword: '',
    list: [],
    current: 1,
    size: 20,
    hasMore: true,
    loading: true,
    loadingMore: false,
  },

  searchTimer: null,

  async onShow() {
    await this.initAuthority();
    this.setPermFlags({
      create: PermissionCode.USER_CREATE,
      update: PermissionCode.USER_UPDATE,
      remove: PermissionCode.USER_DELETE,
    });
    this.reloadList();
  },

  onUnload() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  },

  mapUserItem(item) {
    const positions = (item.positions || []).map((p) => p.name).join('、');
    return {
      ...item,
      displayName: item.nickname || item.username || '未命名',
      departmentName: item.department?.name || '未分配',
      positionsText: positions || '未分配',
      statusText: getStatusText(item.status),
      rolesText: (item.roleCodes || []).join('、') || '无',
    };
  },

  async reloadList() {
    this.setData({ list: [], current: 1, hasMore: true, loading: true });
    await this.loadMore();
    this.setData({ loading: false });
  },

  async loadMore() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    this.setData({ loadingMore: true });
    try {
      const res = await fetchUserList({
        current: this.data.current,
        size: this.data.size,
        keyword: this.data.keyword,
      });
      const page = res.data || {};
      const records = (page.records || []).map((item) => this.mapUserItem(item));
      const list = this.data.current === 1 ? records : [...this.data.list, ...records];
      const total = page.total ?? list.length;
      this.setData({
        list,
        current: this.data.current + 1,
        hasMore: list.length < total,
      });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    } finally {
      this.setData({ loadingMore: false });
    }
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.reloadList(), 400);
  },

  onScrollToLower() {
    this.loadMore();
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/admin/user/form/index' });
  },

  onSwipeEdit(e) {
    if (!this.data.perms.update) {
      this.onShowToast('#t-toast', '无编辑权限');
      return;
    }
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/user/form/index?id=${id}` });
  },

  onSwipeDelete(e) {
    if (!this.data.perms.remove) {
      this.onShowToast('#t-toast', '无删除权限');
      return;
    }
    const { id, name } = e.currentTarget.dataset;
    confirmAdminDelete({
      title: '删除用户',
      name,
      onConfirm: async () => {
        try {
          await deleteUser(id);
          this.onShowToast('#t-toast', '已删除');
          this.reloadList();
        } catch (err) {
          this.onShowToast('#t-toast', err?.msg || '删除失败');
        }
      },
    });
  },
});
