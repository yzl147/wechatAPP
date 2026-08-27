Component({
  properties: {
    symbol: { type: String, value: '○' },
    title: { type: String, value: '暂无内容' },
    description: { type: String, value: '' },
    actionText: { type: String, value: '' },
    secondaryText: { type: String, value: '' }
  },
  methods: {
    onAction() { this.triggerEvent('action') },
    onSecondary() { this.triggerEvent('secondary') }
  }
})
