import { confirmAdminDelete } from '~/utils/admin';

/** Admin 列表左滑编辑/删除（页面 onShow 中调用 setupAdminSwipe 配置） */
const useAdminSwipeBehavior = Behavior({
  methods: {
    setupAdminSwipe(config) {
      this._adminSwipeConfig = config;
    },

    onSwipeEdit(e) {
      if (!this.data.perms?.update) {
        this.onShowToast?.('#t-toast', '无编辑权限');
        return;
      }
      const { id } = e.currentTarget.dataset;
      const { formPath } = this._adminSwipeConfig || {};
      if (formPath) {
        wx.navigateTo({ url: `${formPath}?id=${id}` });
      }
    },

    onSwipeDelete(e) {
      const cfg = this._adminSwipeConfig || {};
      const { id, name, builtin, superAdmin } = e.currentTarget.dataset;

      if (cfg.beforeDelete?.call(this, { id, name, builtin, superAdmin })) return;

      if (!this.data.perms?.remove) {
        this.onShowToast?.('#t-toast', '无删除权限');
        return;
      }

      confirmAdminDelete({
        title: cfg.deleteTitle,
        name,
        onConfirm: async () => {
          try {
            await cfg.deleteFn(id);
            this.onShowToast?.('#t-toast', '已删除');
            cfg.reloadFn?.call(this);
          } catch (err) {
            this.onShowToast?.('#t-toast', err?.msg || '删除失败');
          }
        },
      });
    },
  },
});

export default useAdminSwipeBehavior;
