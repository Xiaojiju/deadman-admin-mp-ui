import { changePassword } from '~/api/auth';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { ensureLoggedIn } from '~/utils/auth';

Page({
  behaviors: [useThemeBehavior, useToastBehavior],

  data: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    showOldPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    canSubmit: false,
    submitting: false,
  },

  onLoad() {
    if (!ensureLoggedIn()) return;
  },

  updateSubmitState() {
    const { oldPassword, newPassword, confirmPassword } = this.data;
    const canSubmit =
      oldPassword.trim() !== '' &&
      newPassword.trim().length >= 8 &&
      confirmPassword.trim() !== '' &&
      newPassword === confirmPassword;
    this.setData({ canSubmit });
  },

  onOldPasswordInput(e) {
    this.setData({ oldPassword: e.detail.value });
    this.updateSubmitState();
  },

  onNewPasswordInput(e) {
    this.setData({ newPassword: e.detail.value });
    this.updateSubmitState();
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
    this.updateSubmitState();
  },

  onToggleOldPassword() {
    this.setData({ showOldPassword: !this.data.showOldPassword });
  },

  onToggleNewPassword() {
    this.setData({ showNewPassword: !this.data.showNewPassword });
  },

  onToggleConfirmPassword() {
    this.setData({ showConfirmPassword: !this.data.showConfirmPassword });
  },

  async onSubmit() {
    if (!this.data.canSubmit || this.data.submitting) return;

    const { oldPassword, newPassword, confirmPassword } = this.data;
    if (newPassword !== confirmPassword) {
      this.onShowToast('#t-toast', '两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 8) {
      this.onShowToast('#t-toast', '新密码至少 8 位');
      return;
    }
    if (oldPassword === newPassword) {
      this.onShowToast('#t-toast', '新密码不能与当前密码相同');
      return;
    }

    this.setData({ submitting: true });
    try {
      await changePassword(oldPassword, newPassword);
      this.onShowToast('#t-toast', '密码修改成功');
      setTimeout(() => wx.navigateBack(), 1200);
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '密码修改失败');
      this.setData({ submitting: false });
    }
  },
});
