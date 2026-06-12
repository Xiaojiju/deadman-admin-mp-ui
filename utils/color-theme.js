import {
  COLOR_THEME_STORAGE_KEY,
  COLOR_THEMES,
  DEFAULT_COLOR_THEME,
  getColorThemeById,
  isColorThemeId,
} from '~/constants/color-themes';
const THEME_DARK = 'dark';
const THEME_EVENT = 'themeChange';

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function lightenHex(hex, ratio = 0.18) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel) => Math.min(255, Math.round(channel + (255 - channel) * ratio));
  const toHex = (channel) => mix(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixWhiteHex(hex, ratio = 0.45) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel) => Math.round(channel + (255 - channel) * ratio);
  const toHex = (channel) => mix(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getPrimaryHex(palette, mode) {
  return mode === THEME_DARK ? palette.primaryDark : palette.primaryLight;
}

export function getColorTheme() {
  const stored = wx.getStorageSync(COLOR_THEME_STORAGE_KEY);
  return isColorThemeId(stored) ? stored : DEFAULT_COLOR_THEME;
}

export function getPaletteClass(colorThemeId) {
  return `palette-${colorThemeId || getColorTheme()}`;
}

export function getPaletteCssVars(mode, colorThemeId) {
  const palette = getColorThemeById(colorThemeId || getColorTheme());
  const primary = getPrimaryHex(palette, mode);
  const primaryLight = lightenHex(primary);
  const primaryDisabled = mixWhiteHex(primary);
  const { r, g, b } = hexToRgb(primary);
  const softAlpha = mode === THEME_DARK ? 0.15 : 0.1;
  const shadowAlpha = mode === THEME_DARK ? 0.2 : 0.08;
  const strongAlpha = mode === THEME_DARK ? 0.2 : 0.25;
  const vars = {
    '--color-primary': primary,
    '--color-primary-light': primaryLight,
    '--color-primary-disabled': primaryDisabled,
    '--color-primary-soft': `rgba(${r}, ${g}, ${b}, ${softAlpha})`,
    '--color-primary-shadow': `rgba(${r}, ${g}, ${b}, ${shadowAlpha})`,
    '--color-primary-shadow-strong': `rgba(${r}, ${g}, ${b}, ${strongAlpha})`,
    '--color-text-link': primary,
    '--color-btn-primary': primary,
    '--color-btn-primary-text': '#ffffff',
    '--gradient-primary': `linear-gradient(145deg, ${primaryLight} 0%, ${primary} 100%)`,
  };
  if (palette.id === 'yellow' || (palette.id === 'neutral' && mode === THEME_DARK)) {
    vars['--color-btn-primary-text'] = '#171717';
  }
  return vars;
}

export function buildPaletteThemeColors(mode, colorThemeId) {
  const palette = getColorThemeById(colorThemeId || getColorTheme());
  const primary = getPrimaryHex(palette, mode);
  const primaryLight = lightenHex(primary);
  const { r, g, b } = hexToRgb(primary);
  const softAlpha = mode === THEME_DARK ? 0.15 : 0.1;

  let btnPrimaryText = '#ffffff';
  if (palette.id === 'yellow' || (palette.id === 'neutral' && mode === THEME_DARK)) {
    btnPrimaryText = '#171717';
  }

  return {
    primary,
    primaryLight,
    swatch: palette.swatch,
    btnPrimaryText,
    primarySoft: `rgba(${r}, ${g}, ${b}, ${softAlpha})`,
  };
}

export function getColorThemeList() {
  return COLOR_THEMES.map((item) => ({
    id: item.id,
    label: item.label,
    swatch: item.swatch,
  }));
}

export function setColorTheme(colorThemeId) {
  const id = isColorThemeId(colorThemeId) ? colorThemeId : DEFAULT_COLOR_THEME;
  wx.setStorageSync(COLOR_THEME_STORAGE_KEY, id);

  const app = getApp();
  if (app) {
    app.globalData.colorTheme = id;
    if (app.eventBus) {
      const mode = wx.getStorageSync('app_theme') === THEME_DARK ? THEME_DARK : 'light';
      app.eventBus.emit(THEME_EVENT, { theme: mode, colorTheme: id });
    }
  }
  return id;
}

export function initColorTheme() {
  const id = getColorTheme();
  const app = getApp();
  if (app) {
    app.globalData.colorTheme = id;
  }
  return id;
}
