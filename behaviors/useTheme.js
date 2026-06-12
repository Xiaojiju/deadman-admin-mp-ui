import {
  applyNavigationTheme,
  getThemePageData,
  offThemeChange,
  onThemeChange,
} from '~/utils/theme';

const INITIAL_THEME_DATA = getThemePageData();

const useThemeBehavior = Behavior({
  data: {
    themeName: INITIAL_THEME_DATA.themeName,
    themeClass: INITIAL_THEME_DATA.themeClass,
    themeColors: INITIAL_THEME_DATA.themeColors,
    pageStyle: INITIAL_THEME_DATA.pageStyle,
  },

  lifetimes: {
    attached() {
      this._bindTheme();
    },
    detached() {
      this._unbindTheme();
    },
  },

  pageLifetimes: {
    show() {
      this._applyTheme();
    },
  },

  methods: {
    _bindTheme() {
      this._applyTheme();
      this._themeHandler = (name) => this._applyTheme(name);
      onThemeChange(this._themeHandler);
    },

    _unbindTheme() {
      if (this._themeHandler) {
        offThemeChange(this._themeHandler);
      }
    },

    _applyTheme(payload) {
      let themeName;
      let colorThemeId;
      if (payload && typeof payload === 'object') {
        themeName = payload.theme;
        colorThemeId = payload.colorTheme;
      } else {
        themeName = payload;
      }
      const pageData = getThemePageData(themeName, colorThemeId);
      this.setData(pageData);
      applyNavigationTheme(pageData.themeName);
    },
  },
});

export default useThemeBehavior;
