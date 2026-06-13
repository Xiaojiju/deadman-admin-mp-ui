import { changePassword } from '~/api/auth';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { ensureLoggedIn } from '~/utils/auth';
import { createFieldErrors, inputPatch, mergeValidation } from '~/utils/form-field';

Page({
  behaviors: [useThemeBehavior, useToastBehavior],

  data: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    showOldPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    fieldErrors: createFieldErrors(['oldPassword', 'newPassword', 'confirmPassword']),
    submitting: false,
  },

  onLoad() {
    if (!ensureLoggedIn()) return;
  },

  validateForm() {
    const { oldPassword, newPassword, confirmPassword } = this.data;
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    const { valid, errors } = mergeValidation(this.data.fieldErrors, [
      { field: 'oldPassword', message: '请输入当前密码', ok: oldPassword.trim() !== '' },
      { field: 'newPassword', message: '新密码至少 8 位', ok: trimmedNew.length >= 8 },
      { field: 'confirmPassword', message: '请再次输入新密码', ok: trimmedConfirm !== '' },
    ]);

    if (valid && trimmedNew !== trimmedConfirm) {
      errors.confirmPassword = '两次输入的新密码不一致';
      this.setData({ fieldErrors: errors });
      return false;
    }
    if (valid && oldPassword.trim() === trimmedNew) {
      errors.newPassword = '新密码不能与当前密码相同';
      this.setData({ fieldErrors: errors });
      return false;
    }

    this.setData({ fieldErrors: errors });
    return valid;
  },

  onOldPasswordInput(e) {
    this.setData(inputPatch(this.data, 'oldPassword', e.detail.value));
  },

  onNewPasswordInput(e) {
    this.setData(inputPatch(this.data, 'newPassword', e.detail.value));
  },

  onConfirmPasswordInput(e) {
    this.setData(inputPatch(this.data, 'confirmPassword', e.detail.value));
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
    if (this.data.submitting) return;
    if (!this.validateForm()) return;

    const { oldPassword, newPassword } = this.data;

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
