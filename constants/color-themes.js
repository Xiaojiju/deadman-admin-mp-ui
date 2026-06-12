/** 与 deadman-admin-ui 保持一致的配色方案 */
export const COLOR_THEME_STORAGE_KEY = 'deadman_color_theme';

export const DEFAULT_COLOR_THEME = 'neutral';

export const COLOR_THEMES = [
  { id: 'neutral', label: '中性', swatch: '#171717', primaryLight: '#171717', primaryDark: '#e5e5e5' },
  { id: 'blue', label: '蓝色', swatch: '#1447e6', primaryLight: '#1447e6', primaryDark: '#1447e6' },
  { id: 'green', label: '绿色', swatch: '#5ea500', primaryLight: '#5ea500', primaryDark: '#5ea500' },
  { id: 'violet', label: '紫色', swatch: '#7f22fe', primaryLight: '#7f22fe', primaryDark: '#8e51ff' },
  { id: 'rose', label: '玫瑰', swatch: '#ec003f', primaryLight: '#ec003f', primaryDark: '#ff2056' },
  { id: 'orange', label: '橙色', swatch: '#f54900', primaryLight: '#f54900', primaryDark: '#ff6900' },
  { id: 'yellow', label: '黄色', swatch: '#fdc700', primaryLight: '#fdc700', primaryDark: '#f0b100' },
  { id: 'red', label: '红色', swatch: '#e7000b', primaryLight: '#e7000b', primaryDark: '#fb2c36' },
];

export function isColorThemeId(value) {
  return COLOR_THEMES.some((theme) => theme.id === value);
}

export function getColorThemeById(id) {
  return COLOR_THEMES.find((theme) => theme.id === id) || COLOR_THEMES[0];
}
