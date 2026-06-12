import config from '~/config';
import { clearAuthSession, redirectToLogin } from '~/utils/auth';
import {
  navigateToErrorPage,
  resolveErrorNavigation,
  shouldHandleUnauthorized,
} from '~/utils/error-nav';

const { baseUrl } = config;

function request(url, method = 'GET', data = {}, options = {}) {
  const { skipErrorRedirect = false } = options;
  const header = {
    'content-type': 'application/json',
  };
  const tokenString = wx.getStorageSync('access_token');
  if (tokenString) {
    header.Authorization = `Bearer ${tokenString}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method,
      data,
      dataType: 'json',
      header,
      success(res) {
        const body = res.data || {};

        if (shouldHandleUnauthorized(body, res.statusCode, !!tokenString)) {
          if (tokenString) {
            clearAuthSession();
            redirectToLogin();
          }
          reject({ ...body, statusCode: res.statusCode });
          return;
        }

        if (res.statusCode === 200 && body.code === 0) {
          resolve(body);
          return;
        }

        if (!skipErrorRedirect) {
          const navigation = resolveErrorNavigation(body, res.statusCode);
          if (navigation) {
            navigateToErrorPage(navigation);
          }
        }

        reject({ ...body, statusCode: res.statusCode });
      },
      fail(err) {
        if (!skipErrorRedirect) {
          navigateToErrorPage({ type: 'network' });
        }
        reject(err);
      },
    });
  });
}

export default request;
