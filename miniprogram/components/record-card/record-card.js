const { MEAL_TYPE_MAP } = require('../../utils/constants');

Component({
  properties: {
    record: {
      type: Object,
      value: {},
      observer: 'updateRecord'
    }
  },

  data: {
    mealIcon: '🍽️',
    mealLabel: ''
  },

  methods: {
    updateRecord(record) {
      if (record && record.mealType) {
        const mealInfo = MEAL_TYPE_MAP[record.mealType];
        if (mealInfo) {
          this.setData({
            mealIcon: mealInfo.icon,
            mealLabel: mealInfo.label
          });
        }
      }
    },

    onTap() {
      this.triggerEvent('tap', { id: this.data.record._id });
    }
  }
});
