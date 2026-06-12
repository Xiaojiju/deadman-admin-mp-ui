import { getColorThemeList } from '~/utils/color-theme';
import {
  getColorTheme,
  offThemeChange,
  onThemeChange,
  setColorTheme,
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
      value: '配色',
    },
  },

  data: {
    value: 'neutral',
    themes: getColorThemeList(),
  },

  lifetimes: {
    attached() {
      this._syncValue();
      this._themeHandler = () => this._syncValue();
      onThemeChange(this._themeHandler);
    },
    detached() {
      if (this._themeHandler) {
        offThemeChange(this._themeHandler);
      }
    },
  },

  methods: {
    _syncValue() {
      this.setData({ value: getColorTheme() });
    },

    onSelect(e) {
      const { id } = e.currentTarget.dataset;
      if (!id || id === this.data.value) return;
      setColorTheme(id);
      this.setData({ value: id });
      this.triggerEvent('change', { colorTheme: id });
    },
  },
});
