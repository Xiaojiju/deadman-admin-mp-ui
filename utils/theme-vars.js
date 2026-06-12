import { getPaletteCssVars } from '~/utils/color-theme';

const STRUCTURAL_VARS = {
  light: {
    '--color-bg-page': '#f7f8fa',
    '--color-bg-page-alt': '#f5f6f8',
    '--color-bg-global': '#f3f3f3',
    '--color-bg-card': '#ffffff',
    '--color-bg-muted': '#f5f6f8',
    '--color-bg-subtle': '#fafafa',
    '--color-bg-input': '#ffffff',
    '--color-border': '#eeeeee',
    '--color-border-light': '#f0f0f0',
    '--color-border-input': '#e5e5e5',
    '--color-divider': '#f3f3f3',
    '--color-text-primary': 'rgba(0, 0, 0, 0.9)',
    '--color-text-secondary': 'rgba(0, 0, 0, 0.55)',
    '--color-text-tertiary': 'rgba(0, 0, 0, 0.45)',
    '--color-text-muted': 'rgba(0, 0, 0, 0.35)',
    '--color-text-placeholder': 'rgba(0, 0, 0, 0.3)',
    '--color-text-inverse': '#ffffff',
    '--color-btn-disabled': '#999999',
    '--color-status-inactive': '#999999',
    '--color-nav-bg': '#ffffff',
    '--color-tab-bar-bg': '#ffffff',
  },
  dark: {
    '--color-bg-page': '#121212',
    '--color-bg-page-alt': '#161616',
    '--color-bg-global': '#0f0f0f',
    '--color-bg-card': '#1e1e1e',
    '--color-bg-muted': '#2a2a2a',
    '--color-bg-subtle': '#252525',
    '--color-bg-input': '#2a2a2a',
    '--color-border': '#333333',
    '--color-border-light': '#2a2a2a',
    '--color-border-input': '#404040',
    '--color-divider': '#2a2a2a',
    '--color-text-primary': 'rgba(255, 255, 255, 0.9)',
    '--color-text-secondary': 'rgba(255, 255, 255, 0.65)',
    '--color-text-tertiary': 'rgba(255, 255, 255, 0.45)',
    '--color-text-muted': 'rgba(255, 255, 255, 0.35)',
    '--color-text-placeholder': 'rgba(255, 255, 255, 0.3)',
    '--color-text-inverse': '#ffffff',
    '--color-btn-disabled': '#555555',
    '--color-status-inactive': '#666666',
    '--color-nav-bg': '#1a1a1a',
    '--color-tab-bar-bg': '#1e1e1e',
  },
};

function varsToPageStyle(vars) {
  const pairs = Object.entries(vars).map(([key, value]) => `${key}:${value}`);
  pairs.push(`color:${vars['--color-text-primary']}`);
  pairs.push(`background-color:${vars['--color-bg-global']}`);
  return pairs.join(';');
}

export function getPageStyle(themeName, colorThemeId) {
  const mode = themeName === 'dark' ? 'dark' : 'light';
  const vars = {
    ...STRUCTURAL_VARS[mode],
    ...getPaletteCssVars(mode, colorThemeId),
  };
  return varsToPageStyle(vars);
}
