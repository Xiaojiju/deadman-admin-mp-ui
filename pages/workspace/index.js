import { WORKSPACE_SECTIONS } from '~/constants/workspace';
import useThemeBehavior from '~/behaviors/useTheme';
import { ensureLoggedIn } from '~/utils/auth';
import { fetchUserAuthority, filterSectionsByPermission } from '~/utils/permission';

const MODULE_ROUTES = {
  department: '/pages/admin/department/index',
  position: '/pages/admin/position/index',
  user: '/pages/admin/user/index',
  role: '/pages/admin/role/index',
  permission: '/pages/my/permissions/index',
};

Page({
  behaviors: [useThemeBehavior],

  data: {
    keyword: '',
    allSections: [],
    sections: [],
    loading: true,
    hasModules: false,
  },

  onShow() {
    if (!ensureLoggedIn()) return;
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'workspace' });
    }
    this.loadWorkspace();
  },

  filterSectionsByKeyword(sections, keyword) {
    const kw = (keyword || '').trim().toLowerCase();
    if (!kw) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: (section.items || []).filter(
          (item) =>
            item.label.toLowerCase().includes(kw) || section.title.toLowerCase().includes(kw),
        ),
      }))
      .filter((section) => section.items.length > 0);
  },

  applyDisplaySections(allSections, keyword) {
    const sections = this.filterSectionsByKeyword(allSections, keyword);
    this.setData({
      sections,
      hasModules: allSections.length > 0,
    });
  },

  async loadWorkspace() {
    this.setData({ loading: true });
    try {
      const authority = await fetchUserAuthority();
      const allSections = filterSectionsByPermission(WORKSPACE_SECTIONS, authority);
      this.setData({ allSections, keyword: '' });
      this.applyDisplaySections(allSections, '');
    } catch {
      this.setData({ allSections: [], keyword: '' });
      this.applyDisplaySections([], '');
    } finally {
      this.setData({ loading: false });
    }
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    this.applyDisplaySections(this.data.allSections, keyword);
  },

  onSearchConfirm() {
    this.applyDisplaySections(this.data.allSections, this.data.keyword);
  },

  onModuleTap(e) {
    const { type } = e.currentTarget.dataset;
    const url = MODULE_ROUTES[type];
    if (url) {
      wx.navigateTo({ url });
      return;
    }
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },
});
