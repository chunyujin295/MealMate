const { MEAL_TYPES } = require('../../utils/constants');

Component({
  properties: {
    value: {
      type: String,
      value: 'breakfast'
    }
  },

  data: {
    mealTypes: MEAL_TYPES
  },

  methods: {
    onSelect(e) {
      const key = e.currentTarget.dataset.key;
      this.setData({ value: key });
      this.triggerEvent('change', { value: key });
    }
  }
});
