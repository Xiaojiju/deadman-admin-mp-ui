import config from '~/config';

/** 将后端返回的相对资源路径拼接为完整 URL */
export function resolveAssetUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;

  const base = (config.baseUrl || '').replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}
