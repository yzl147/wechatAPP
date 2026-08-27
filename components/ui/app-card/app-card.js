Component({
  properties: {
    variant: { type: String, value: 'default' },
    interactive: { type: Boolean, value: false }
  },
  methods: {
    onTap() {
      if (this.properties.interactive) this.triggerEvent('tap')
    }
  }
})
