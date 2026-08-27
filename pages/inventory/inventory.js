const inventoryUtil = require('../../utils/inventory')

Page({
  data: {
    items: [],
    name: '',
    quantity: '',
    unit: '',
    expiryDate: '',
    today: ''
  },

  onLoad() {
    const today = new Date().toISOString().slice(0, 10)
    this.setData({ today })
  },

  async onShow() {
    try {
      await inventoryUtil.syncInventory()
    } catch (error) {
      wx.showToast({ title: '云端同步失败，显示本地缓存', icon: 'none' })
    }
    this.loadInventory()
  },

  loadInventory() {
    this.setData({ items: inventoryUtil.getDisplayInventory() })
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onQuantityInput(e) { this.setData({ quantity: e.detail.value }) },
  onUnitInput(e) { this.setData({ unit: e.detail.value }) },
  onExpiryChange(e) { this.setData({ expiryDate: e.detail.value }) },

  async onAddItem() {
    const { name, quantity, unit, expiryDate } = this.data
    if (!name.trim()) {
      wx.showToast({ title: '请填写食材名称', icon: 'none' })
      return
    }
    if (!quantity || Number(quantity) <= 0) {
      wx.showToast({ title: '请填写正确数量', icon: 'none' })
      return
    }
    try {
      await inventoryUtil.addInventory({ name, quantity, unit, expiryDate })
      this.setData({ name: '', quantity: '', unit: '', expiryDate: '' })
      this.loadInventory()
      wx.showToast({ title: '已加入库存', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: '保存失败，请检查网络', icon: 'none' })
    }
  },

  async onDecrease(e) {
    try {
      await inventoryUtil.updateQuantity(e.currentTarget.dataset.id, -1)
      this.loadInventory()
    } catch (error) { wx.showToast({ title: '更新失败，请重试', icon: 'none' }) }
  },

  async onIncrease(e) {
    try {
      await inventoryUtil.updateQuantity(e.currentTarget.dataset.id, 1)
      this.loadInventory()
    } catch (error) { wx.showToast({ title: '更新失败，请重试', icon: 'none' }) }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除食材',
      content: '确定从库存中删除这项食材吗？',
      confirmColor: '#e74c3c',
      success: async res => {
        if (!res.confirm) return
        try {
          await inventoryUtil.removeInventory(id)
          this.loadInventory()
        } catch (error) { wx.showToast({ title: '删除失败，请重试', icon: 'none' }) }
      }
    })
  }
})
