import {
  getTheme,
  getThemePageData,
  offThemeChange,
  onThemeChange,
  setTheme,
  THEME_DARK,
  THEME_LIGHT,
} from '~/utils/theme';

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    showLabel: {
      type: Boolean,
      value: true,
    },
    label: {
      type: String,
      value: '主题模式',
    },
  },

  data: (() => {
    const initial = getThemePageData();
    return {
      value: initial.themeName,
      themeColors: initial.themeColors,
    };
  })(),

  lifetimes: {
    attached() {
      this._syncTheme();
      this._themeHandler = () => this._syncTheme();
      onThemeChange(this._themeHandler);
    },
    detached() {
      if (this._themeHandler) {
        offThemeChange(this._themeHandler);
      }
    },
  },

  methods: {
    _syncTheme(payload) {
      const pageData = getThemePageData(payload);
      this.setData({
        value: pageData.themeName,
        themeColors: pageData.themeColors,
      });
    },

    onSelect(e) {
      const { theme } = e.currentTarget.dataset;
      if (theme !== THEME_LIGHT && theme !== THEME_DARK) return;
      if (theme === this.data.value) return;

      const nextTheme = setTheme(theme);
      this.setData({ value: nextTheme, themeColors: getThemePageData(nextTheme).themeColors });
      this.triggerEvent('change', { theme });
    },
  },
});
