import createBus from './utils/eventBus';
import { isLoggedIn } from './utils/auth';
import { initInboxRealtime } from './utils/inbox-realtime';
import { initTheme } from './utils/theme';

App({
  onLaunch() {
    initTheme();
    if (isLoggedIn()) {
      const nickname = wx.getStorageSync('nickname');
      const userCode = wx.getStorageSync('user_code');
      const avatar = wx.getStorageSync('avatar');
      if (nickname || userCode || avatar) {
        this.globalData.userInfo = { nickname, userCode, avatar };
      }
      initInboxRealtime();
    }

    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate((res) => {
      // console.log(res.hasUpdate)
    });

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        },
      });
    });
  },
  globalData: {
    theme: 'light',
    colorTheme: 'neutral',
    userInfo: null,
    unreadNum: 0, // 未读消息数量
    socket: null, // SocketTask 对象
  },

  /** 全局事件总线 */
  eventBus: createBus()
});
