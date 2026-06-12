import config from '~/config';

/** 上传文件，返回 FileMetadataVO（含 accessUrl） */
export function uploadFile(filePath, bizType = 'avatar') {
  const token = wx.getStorageSync('access_token');

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${config.baseUrl}/api/files/upload`,
      filePath,
      name: 'file',
      formData: { bizType },
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        let body = {};
        try {
          body = JSON.parse(res.data || '{}');
        } catch (e) {
          reject({ msg: '上传响应解析失败' });
          return;
        }
        if (res.statusCode === 200 && body.code === 0) {
          resolve(body);
        } else {
          reject(body);
        }
      },
      fail(err) {
        reject(err);
      },
    });
  });
}
