import { uploadFile } from '~/api/file';
import { getCurrentUser, updateCurrentUser } from '~/api/user';
import useThemeBehavior from '~/behaviors/useTheme';
import useToastBehavior from '~/behaviors/useToast';
import { ensureLoggedIn } from '~/utils/auth';
import { formatProfileTime } from '~/utils/format';
import { resolveAssetUrl } from '~/utils/url';
import { createFieldErrors, inputPatch, mergeValidation } from '~/utils/form-field';

function getStatusText(status) {
  if (status === 1) return '正常';
  if (status === 0) return '禁用';
  return '-';
}

function mapAccountType(type) {
  const map = {
    USERNAME: '用户名',
    PHONE: '手机号',
    EMAIL: '邮箱',
  };
  return map[type] || type || '用户名';
}

function buildAccounts(profile) {
  if (Array.isArray(profile.accounts) && profile.accounts.length) {
    return profile.accounts.map((item) => ({
      accountTypeText: mapAccountType(item.accountType),
      accountIdentifier: item.accountIdentifier || '-',
      platformText: item.oauthProvider || '后台系统',
      status: item.status ?? profile.status,
      statusText: getStatusText(item.status ?? profile.status),
    }));
  }

  if (profile.username) {
    return [
      {
        accountTypeText: '用户名',
        accountIdentifier: profile.username,
        platformText: '后台系统',
        status: profile.status,
        statusText: getStatusText(profile.status),
      },
    ];
  }

  return [];
}

function syncUserSession(profile) {
  const app = getApp();
  if (app) {
    app.globalData.userInfo = profile;
  }
  if (profile.nickname) {
    wx.setStorageSync('nickname', profile.nickname);
  }
  if (profile.avatar) {
    wx.setStorageSync('avatar', profile.avatar);
  }
}

Page({
  behaviors: [useThemeBehavior, useToastBehavior],

  data: {
    profile: {},
    statusText: '-',
    createTimeText: '',
    accounts: [],
    roles: [],
    nickname: '',
    avatarPath: '',
    avatarDisplay: '',
    originNickname: '',
    fieldErrors: createFieldErrors(['nickname']),
    savingNickname: false,
    showAvatarPreview: false,
    avatarPreviewLocal: '',
    uploading: false,
  },

  onLoad() {
    if (!ensureLoggedIn()) return;
    this.loadProfile();
  },

  applyProfileData(profile) {
    const nickname = profile.nickname || '';
    const avatarPath = profile.avatar || '';

    this.setData({
      profile,
      statusText: getStatusText(profile.status),
      createTimeText: profile.createTime ? formatProfileTime(profile.createTime) : '',
      accounts: buildAccounts(profile),
      roles: Array.isArray(profile.roleCodes) ? profile.roleCodes : [],
      nickname,
      avatarPath,
      avatarDisplay: resolveAssetUrl(avatarPath),
      originNickname: nickname,
      fieldErrors: createFieldErrors(['nickname']),
    });
  },

  async loadProfile() {
    try {
      const res = await getCurrentUser();
      this.applyProfileData(res.data || {});
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '加载资料失败');
    }
  },

  validateNickname() {
    const { nickname, originNickname } = this.data;
    const trimmed = nickname.trim();

    if (trimmed === originNickname.trim()) {
      this.onShowToast('#t-toast', '昵称未修改');
      return false;
    }

    const { valid, errors } = mergeValidation(this.data.fieldErrors, [
      { field: 'nickname', message: '请输入昵称', ok: trimmed !== '' },
    ]);
    this.setData({ fieldErrors: errors });
    return valid;
  },

  onNicknameInput(e) {
    this.setData(inputPatch(this.data, 'nickname', e.detail.value));
  },

  async onSaveNickname() {
    if (this.data.savingNickname) return;
    if (!this.validateNickname()) return;

    const nickname = this.data.nickname.trim();
    this.setData({ savingNickname: true });
    try {
      const res = await updateCurrentUser({ nickname });
      const updatedProfile = res.data || { ...this.data.profile, nickname };
      syncUserSession(updatedProfile);
      this.applyProfileData(updatedProfile);
      this.onShowToast('#t-toast', '昵称已保存');
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '保存失败');
    } finally {
      this.setData({ savingNickname: false });
    }
  },

  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles?.[0];
        if (!file?.tempFilePath) return;
        if (file.size > 10 * 1024 * 1024) {
          this.onShowToast('#t-toast', '图片不能超过 10MB');
          return;
        }
        this.setData({
          showAvatarPreview: true,
          avatarPreviewLocal: file.tempFilePath,
        });
      },
    });
  },

  onCancelAvatarPreview() {
    this.setData({
      showAvatarPreview: false,
      avatarPreviewLocal: '',
    });
  },

  async onConfirmAvatarUpload() {
    if (this.data.uploading) return;
    const { avatarPreviewLocal } = this.data;
    if (!avatarPreviewLocal) return;

    this.setData({ uploading: true });
    try {
      const uploadRes = await uploadFile(avatarPreviewLocal, 'avatar');
      const accessUrl = uploadRes.data?.accessUrl || '';
      if (!accessUrl) {
        this.onShowToast('#t-toast', '上传失败，未返回文件地址');
        return;
      }

      const res = await updateCurrentUser({ avatar: accessUrl });
      const updatedProfile = res.data || { ...this.data.profile, avatar: accessUrl };
      syncUserSession(updatedProfile);
      this.setData({
        showAvatarPreview: false,
        avatarPreviewLocal: '',
      });
      this.applyProfileData(updatedProfile);
      this.onShowToast('#t-toast', '头像已保存');
    } catch (err) {
      this.onShowToast('#t-toast', err?.msg || '头像保存失败');
    } finally {
      this.setData({ uploading: false });
    }
  },
});
