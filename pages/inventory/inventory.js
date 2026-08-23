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

  onShow() {
    this.loadInventory()
  },

  loadInventory() {
    this.setData({ items: inventoryUtil.getDisplayInventory() })
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onQuantityInput(e) { this.setData({ quantity: e.detail.value }) },
  onUnitInput(e) { this.setData({ unit: e.detail.value }) },
  onExpiryChange(e) { this.setData({ expiryDate: e.detail.value }) },

  onAddItem() {
    const { name, quantity, unit, expiryDate } = this.data
    if (!name.trim()) {
      wx.showToast({ title: '请填写食材名称', icon: 'none' })
      return
    }
    if (!quantity || Number(quantity) <= 0) {
      wx.showToast({ title: '请填写正确数量', icon: 'none' })
      return
    }
    inventoryUtil.addInventory({ name, quantity, unit, expiryDate })
    this.setData({ name: '', quantity: '', unit: '', expiryDate: '' })
    this.loadInventory()
    wx.showToast({ title: '已加入库存', icon: 'success' })
  },

  onDecrease(e) {
    inventoryUtil.updateQuantity(e.currentTarget.dataset.id, -1)
    this.loadInventory()
  },

  onIncrease(e) {
    inventoryUtil.updateQuantity(e.currentTarget.dataset.id, 1)
    this.loadInventory()
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除食材',
      content: '确定从库存中删除这项食材吗？',
      confirmColor: '#e74c3c',
      success: res => {
        if (!res.confirm) return
        inventoryUtil.removeInventory(id)
        this.loadInventory()
      }
    })
  }
})
