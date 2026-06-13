import { STATUS_PICKER_OPTIONS, getStatusText } from '~/utils/admin';

/** 状态 picker：open / cancel / confirm */
const useStatusPickerBehavior = Behavior({
  data: {
    statusVisible: false,
    statusPickerValue: [1],
    statusPickerOptions: STATUS_PICKER_OPTIONS,
    status: 1,
    statusText: '正常',
  },

  methods: {
    onOpenStatusPicker() {
      this.setData({ statusVisible: true });
    },

    onStatusCancel() {
      this.setData({ statusVisible: false });
    },

    onStatusConfirm(e) {
      const status = Number(e.detail.value[0]);
      const statusText = e.detail.label?.[0] || getStatusText(status);
      this.setData({
        statusVisible: false,
        status: status === 1 ? 1 : 0,
        statusText,
        statusPickerValue: [status],
      });
    },
  },
});

export default useStatusPickerBehavior;
