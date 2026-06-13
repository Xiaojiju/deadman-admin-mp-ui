import { deleteUser, fetchUserList } from '~/api/user-admin';
import useAdminSwipeBehavior from '~/behaviors/useAdminSwipe';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { getStatusText, isDatasetTruthy, isSystemAdminUser } from '~/utils/admin';

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior, useAdminSwipeBehavior],

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

  onLoad() {
    this._listGen = 0;
  },

  async onShow() {
    await this.initAuthority();
    this.setPermFlags({
      create: PermissionCode.USER_CREATE,
      update: PermissionCode.USER_UPDATE,
      remove: PermissionCode.USER_DELETE,
    });
    this.setupAdminSwipe({
      formPath: '/pages/admin/user/form/index',
      deleteTitle: '删除用户',
      deleteFn: deleteUser,
      reloadFn() {
        this.reloadList();
      },
      beforeDelete({ superAdmin }) {
        if (isDatasetTruthy(superAdmin)) {
          this.onShowToast('#t-toast', '系统管理员不可删除');
          return true;
        }
        return false;
      },
    });
    this.reloadList();
  },

  onUnload() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  },

  mapUserItem(item) {
    const positions = (item.positions || []).map((p) => p.name).join('、');
    const superAdmin = isSystemAdminUser(item);
    return {
      ...item,
      superAdmin,
      displayName: item.nickname || item.username || '未命名',
      departmentName: item.department?.name || '未分配',
      positionsText: positions || '未分配',
      statusText: getStatusText(item.status),
      rolesText: (item.roleCodes || []).join('、') || '无',
    };
  },

  async reloadList() {
    this._listGen += 1;
    const gen = this._listGen;
    this.setData({ list: [], current: 1, hasMore: true, loading: true, loadingMore: false });
    await this.loadMore(gen);
    if (gen === this._listGen) {
      this.setData({ loading: false });
    }
  },

  async loadMore(expectedGen) {
    const gen = expectedGen ?? this._listGen;
    if (gen !== this._listGen) return;
    if (!this.data.hasMore || this.data.loadingMore) return;

    const keyword = this.data.keyword;
    const current = this.data.current;
    this.setData({ loadingMore: true });

    try {
      const res = await fetchUserList({ current, size: this.data.size, keyword });
      if (gen !== this._listGen) return;

      const page = res.data || {};
      const records = (page.records || []).map((item) => this.mapUserItem(item));
      const list = current === 1 ? records : [...this.data.list, ...records];
      const total = page.total ?? list.length;
      this.setData({
        list,
        current: current + 1,
        hasMore: list.length < total,
      });
    } catch (err) {
      if (gen === this._listGen) {
        this.onShowToast('#t-toast', err?.msg || '加载失败');
      }
    } finally {
      if (gen === this._listGen) {
        this.setData({ loadingMore: false });
      }
    }
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.reloadList(), 400);
  },

  onScrollToLower() {
    this.loadMore(this._listGen);
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/admin/user/form/index' });
  },
});
