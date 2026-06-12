Component({
  properties: {
    visible: {
      type: Boolean,
      value: true,
    },
    icon: {
      type: String,
      value: 'add',
    },
  },

  methods: {
    onTap() {
      this.triggerEvent('tap');
    },
  },
});
