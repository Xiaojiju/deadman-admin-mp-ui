import {
  buildPaletteThemeColors,
  getColorTheme,
  getPaletteClass,
  initColorTheme,
} from '~/utils/color-theme';
import { getPageStyle } from '~/utils/theme-vars';

const THEME_STORAGE_KEY = 'app_theme';
const THEME_EVENT = 'themeChange';

export const THEME_LIGHT = 'light';
export const THEME_DARK = 'dark';

const BASE_THEME_TOKENS = {
  [THEME_LIGHT]: {
    textPrimary: 'rgba(0,0,0,0.9)',
    textSecondary: 'rgba(0,0,0,0.55)',
    textTertiary: 'rgba(0,0,0,0.45)',
    textMuted: 'rgba(0,0,0,0.35)',
    textPlaceholder: 'rgba(0,0,0,0.3)',
    textInverse: '#ffffff',
    navBg: '#ffffff',
    navFront: '#000000',
    tabBarBg: '#ffffff',
  },
  [THEME_DARK]: {
    textPrimary: 'rgba(255,255,255,0.9)',
    textSecondary: 'rgba(255,255,255,0.65)',
    textTertiary: 'rgba(255,255,255,0.45)',
    textMuted: 'rgba(255,255,255,0.35)',
    textPlaceholder: 'rgba(255,255,255,0.3)',
    textInverse: '#ffffff',
    navBg: '#1a1a1a',
    navFront: '#ffffff',
    tabBarBg: '#1e1e1e',
  },
};

export function getTheme() {
  const stored = wx.getStorageSync(THEME_STORAGE_KEY);
  return stored === THEME_DARK ? THEME_DARK : THEME_LIGHT;
}

export function getThemeClass(themeName) {
  const name = themeName || getTheme();
  return name === THEME_DARK ? 'theme-dark' : 'theme-light';
}

export function getThemeTokens(themeName, colorThemeId) {
  const mode = themeName || getTheme();
  const palette = colorThemeId || getColorTheme();
  const base = BASE_THEME_TOKENS[mode] || BASE_THEME_TOKENS[THEME_LIGHT];
  const paletteTokens = buildPaletteThemeColors(mode, palette);
  return {
    ...base,
    ...paletteTokens,
  };
}
export function applyNavigationTheme(themeName) {
  const tokens = getThemeTokens(themeName);
  wx.setNavigationBarColor({
    frontColor: tokens.navFront,
    backgroundColor: tokens.navBg,
    animation: { duration: 200, timingFunc: 'easeIn' },
  });
}

function emitThemeChange() {
  const app = getApp();
  if (app?.eventBus) {
    app.eventBus.emit(THEME_EVENT, {
      theme: getTheme(),
      colorTheme: getColorTheme(),
    });
  }
}

export function setTheme(themeName) {
  const name = themeName === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  wx.setStorageSync(THEME_STORAGE_KEY, name);

  const app = getApp();
  if (app) {
    app.globalData.theme = name;
    applyNavigationTheme(name);
    emitThemeChange();
  }
  return name;
}

export { getColorTheme, setColorTheme } from '~/utils/color-theme';

export function initTheme() {
  const name = getTheme();
  const colorTheme = initColorTheme();
  const app = getApp();
  if (app) {
    app.globalData.theme = name;
    app.globalData.colorTheme = colorTheme;
  }
  applyNavigationTheme(name);
  return { theme: name, colorTheme };
}

export function onThemeChange(handler) {
  const app = getApp();
  if (app?.eventBus) {
    app.eventBus.on(THEME_EVENT, handler);
  }
}

export function offThemeChange(handler) {
  const app = getApp();
  if (app?.eventBus) {
    app.eventBus.off(THEME_EVENT, handler);
  }
}

function normalizeThemePayload(themeName, colorThemeId) {
  let mode = themeName;
  let palette = colorThemeId;
  if (mode && typeof mode === 'object') {
    palette = mode.colorTheme || palette;
    mode = mode.theme;
  }
  return {
    mode: mode || getTheme(),
    palette: palette || getColorTheme(),
  };
}

export function getThemePageData(themeName, colorThemeId) {
  const { mode, palette } = normalizeThemePayload(themeName, colorThemeId);
  return {
    themeName: mode,
    colorTheme: palette,
    themeClass: `${getThemeClass(mode)} ${getPaletteClass(palette)}`,
    themeColors: getThemeTokens(mode, palette),
    pageStyle: getPageStyle(mode, palette),
  };
}

export { getPageStyle };

