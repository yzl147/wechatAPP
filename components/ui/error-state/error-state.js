Component({
  properties: {
    title: { type: String, value: '加载失败' },
    description: { type: String, value: '请检查网络后重试' },
    actionText: { type: String, value: '重新加载' },
    compact: { type: Boolean, value: false }
  },
  methods: {
    onRetry() { this.triggerEvent('retry') }
  }
})
