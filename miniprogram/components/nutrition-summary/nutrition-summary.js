Component({
  properties: {
    summary: {
      type: Object,
      value: {}
    },
    label: {
      type: String,
      value: ''
    }
  },

  computed: {
    isEmpty() {
      const s = this.data.summary;
      return !s || (!s.totalCalories && !s.totalCarbs && !s.totalProtein && !s.totalFat);
    }
  }
});
