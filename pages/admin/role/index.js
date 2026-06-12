import { deleteRole, fetchRoleList } from '~/api/role';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { getStatusText } from '~/utils/admin';

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
      create: PermissionCode.ROLE_CREATE,
      update: PermissionCode.ROLE_UPDATE,
      remove: PermissionCode.ROLE_DELETE,
      assignPerm: PermissionCode.ROLE_PERMISSION_ASSIGN,
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
      this.setData({ allList });
      this.applyFilter(this.data.keyword, allList);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  applyFilter(keyword, allList) {
    const kw = (keyword || '').trim().toLowerCase();
    const source = allList || this.data.allList;
    const list = kw
      ? source.filter(
          (item) =>
            item.roleName.toLowerCase().includes(kw) ||
            item.roleCode.toLowerCase().includes(kw) ||
            (item.description || '').toLowerCase().includes(kw),
        )
      : source;
    this.setData({ list });
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    this.applyFilter(keyword);
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/admin/role/form/index' });
  },

  onItemTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/role/form/index?id=${id}` });
  },

  onAssignPermissions(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/role/permissions/index?id=${id}` });
  },

  onItemLongPress(e) {
    const { id, name, builtin } = e.currentTarget.dataset;
    if (builtin) {
      this.onShowToast('#t-toast', '系统内置角色不可删除');
      return;
    }
    if (!this.data.perms.remove) return;
    wx.showModal({
      title: '删除角色',
      content: `确定删除「${name}」吗？`,
      confirmColor: '#e34d59',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await deleteRole(id);
          this.onShowToast('#t-toast', '已删除');
          this.loadList();
        } catch (err) {
          this.onShowToast('#t-toast', err?.msg || '删除失败');
        }
      },
    });
  },
});
