import { assignUserRoles, getUserDetail } from '~/api/user-admin';
import { fetchRoleList } from '~/api/role';
import useAuthorityBehavior, { PermissionCode } from '~/behaviors/useAuthority';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { getStatusText } from '~/utils/admin';

function mapRoleListItems(items, selectedIdSet) {
  return (items || []).map((item) => ({
    id: String(item.id),
    roleCode: item.roleCode,
    roleName: item.roleName,
    description: item.description || '暂无描述',
    status: item.status,
    statusText: getStatusText(item.status),
    selected: selectedIdSet ? selectedIdSet.has(String(item.id)) : false,
  }));
}

Page({
  behaviors: [useThemeBehavior, useToastBehavior, useAuthorityBehavior],

  data: {
    isPickMode: false,
    userId: '',
    userName: '',
    roleList: [],
    selectedRoleIds: [],
    submitting: false,
    loading: true,
  },

  async onLoad(options) {
    await this.initAuthority();
    this.setPermFlags({ assign: PermissionCode.ROLE_USER_ASSIGN });

    const isPickMode = options.mode === 'pick';
    this.setData({ isPickMode });

    if (isPickMode) {
      if (!this.can(PermissionCode.ROLE_USER_ASSIGN)) {
        this.onShowToast('#t-toast', '无权限');
        setTimeout(() => wx.navigateBack(), 800);
        return;
      }

      wx.setNavigationBarTitle({ title: '选择角色' });
      this._pickInit = null;
      const channel = this.getOpenerEventChannel();
      if (channel) {
        channel.on('initRoleSelect', (data) => {
          this._pickInit = data || {};
          if (this._rolesLoaded) this.applyPickInit();
        });
      }
      await this.loadPickRoles();
      return;
    }

    const userId = options.userId || '';
    if (!userId || !this.can(PermissionCode.ROLE_USER_ASSIGN)) {
      this.onShowToast('#t-toast', '无权限');
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    this.setData({ userId });
    await this.loadAssignRoles(userId);
  },

  applyPickInit() {
    const selectedRoleIds = (this._pickInit?.selectedRoleIds || []).map(String);
    const selectedIdSet = new Set(selectedRoleIds);
    const roleList = (this.data.roleList || []).map((item) => ({
      ...item,
      selected: selectedIdSet.has(String(item.id)),
    }));
    this.setData({ roleList, selectedRoleIds });
  },

  async loadPickRoles() {
    this.setData({ loading: true });
    try {
      const res = await fetchRoleList();
      const selectedIdSet = new Set((this._pickInit?.selectedRoleIds || []).map(String));
      const roleList = mapRoleListItems(res.data, selectedIdSet);
      const selectedRoleIds = roleList.filter((item) => item.selected).map((item) => item.id);
      this._rolesLoaded = true;
      this.setData({ roleList, selectedRoleIds });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadAssignRoles(userId) {
    this.setData({ loading: true });
    try {
      const [userRes, roleRes] = await Promise.all([getUserDetail(userId), fetchRoleList()]);
      const user = userRes.data || {};
      const roleCodes = user.roleCodes || [];
      const selectedIdSet = new Set(
        (roleRes.data || [])
          .filter((item) => roleCodes.includes(item.roleCode))
          .map((item) => String(item.id)),
      );
      const roleList = mapRoleListItems(roleRes.data, selectedIdSet);
      const selectedRoleIds = roleList.filter((item) => item.selected).map((item) => item.id);
      this.setData({
        userName: user.nickname || user.username || '',
        roleList,
        selectedRoleIds,
      });
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  onRoleChange(e) {
    const selectedRoleIds = (e.detail.value || []).map(String);
    const selectedIdSet = new Set(selectedRoleIds);
    const roleList = this.data.roleList.map((item) => ({
      ...item,
      selected: selectedIdSet.has(String(item.id)),
    }));
    this.setData({ selectedRoleIds, roleList });
  },

  onSubmit() {
    if (this.data.submitting) return;

    if (this.data.isPickMode) {
      const { selectedRoleIds, roleList } = this.data;
      const channel = this.getOpenerEventChannel();
      channel?.emit?.('roleSelect', { selectedRoleIds, roleList });
      wx.navigateBack();
      return;
    }

    this.submitAssignRoles();
  },

  async submitAssignRoles() {
    const { userId, selectedRoleIds } = this.data;
    this.setData({ submitting: true });
    try {
      await assignUserRoles(userId, selectedRoleIds);
      this.onShowToast('#t-toast', '角色已更新');
      setTimeout(() => wx.navigateBack(), 600);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '保存失败');
      this.setData({ submitting: false });
    }
  },
});
