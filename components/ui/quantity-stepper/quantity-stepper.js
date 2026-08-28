Component({
  properties: {
    itemId: { type: Number, value: 0 },
    value: { type: Number, value: 1 },
    disabled: { type: Boolean, value: false },
    decreaseLabel: { type: String, value: '减少一份' },
    increaseLabel: { type: String, value: '增加一份' }
  },

  methods: {
    onDecrease() {
      if (this.properties.disabled) return
      this.triggerEvent('decrease', { id: this.properties.itemId, value: this.properties.value })
    },
    onIncrease() {
      if (this.properties.disabled) return
      this.triggerEvent('increase', { id: this.properties.itemId, value: this.properties.value })
    }
  }
})
