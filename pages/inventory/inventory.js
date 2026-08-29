const inventoryUtil = require('../../utils/inventory')

Page({
  data: {
    items: [],
    name: '',
    quantity: '',
    unit: '',
    expiryDate: '',
    today: '',
    loadStatus: 'loading',
    showAddForm: false,
    addPending: false,
    mutationPendingId: '',
    deletePendingId: '',
    attentionCount: 0,
    expiredCount: 0,
    syncWarning: ''
  },

  onLoad() {
    const today = formatLocalDate(new Date())
    this.setData({ today })
  },

  async onShow() {
    if (this.data.items.length === 0) this.setData({ loadStatus: 'loading' })
    let syncWarning = ''
    try {
      await inventoryUtil.syncInventory()
    } catch (error) {
      syncWarning = '云端同步失败，当前显示本地库存缓存。'
    }
    this.loadInventory(syncWarning)
  },

  loadInventory(syncWarning = this.data.syncWarning) {
    try {
      const items = inventoryUtil.getDisplayInventory()
      this.setData({
        items,
        attentionCount: items.filter(item => ['expired', 'expiring'].includes(item.expiry.type)).length,
        expiredCount: items.filter(item => item.expiry.type === 'expired').length,
        syncWarning,
        loadStatus: 'success'
      })
    } catch (error) {
      console.error('加载食材库存失败', error)
      this.setData({ loadStatus: 'error' })
    }
  },

  onRetryLoad() { this.onShow() },
  onOpenAddForm() { this.setData({ showAddForm: true }) },
  onCancelAddForm() {
    if (this.data.addPending) return
    this.setData({ showAddForm: false, name: '', quantity: '', unit: '', expiryDate: '' })
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onQuantityInput(e) { this.setData({ quantity: e.detail.value }) },
  onUnitInput(e) { this.setData({ unit: e.detail.value }) },
  onExpiryChange(e) { this.setData({ expiryDate: e.detail.value }) },
  onClearExpiry() { this.setData({ expiryDate: '' }) },

  async onAddItem() {
    const { name, quantity, unit, expiryDate, addPending, mutationPendingId, deletePendingId } = this.data
    if (addPending || mutationPendingId || deletePendingId) return
    if (!name.trim()) {
      wx.showToast({ title: '请填写食材名称', icon: 'none' })
      return
    }
    if (!quantity || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
      wx.showToast({ title: '请填写正确数量', icon: 'none' })
      return
    }
    this.setData({ addPending: true })
    try {
      await inventoryUtil.addInventory({ name, quantity, unit, expiryDate })
      this.setData({ name: '', quantity: '', unit: '', expiryDate: '', showAddForm: false })
      this.loadInventory()
      wx.showToast({ title: '已加入库存', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: '保存失败，请检查网络', icon: 'none' })
    } finally {
      this.setData({ addPending: false })
    }
  },

  async onDecrease(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.items.find(entry => entry.id === id)
    if (!item || item.quantity <= 0 || this.data.mutationPendingId || this.data.addPending || this.data.deletePendingId) return
    this.setData({ mutationPendingId: id })
    try {
      await inventoryUtil.updateQuantity(id, -1)
      this.loadInventory()
    } catch (error) {
      wx.showToast({ title: '更新失败，请重试', icon: 'none' })
    } finally {
      this.setData({ mutationPendingId: '' })
    }
  },

  async onIncrease(e) {
    const id = e.currentTarget.dataset.id
    if (!id || this.data.mutationPendingId || this.data.addPending || this.data.deletePendingId) return
    this.setData({ mutationPendingId: id })
    try {
      await inventoryUtil.updateQuantity(id, 1)
      this.loadInventory()
    } catch (error) {
      wx.showToast({ title: '更新失败，请重试', icon: 'none' })
    } finally {
      this.setData({ mutationPendingId: '' })
    }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    if (!id || this.data.deletePendingId || this.data.mutationPendingId || this.data.addPending) return
    const item = this.data.items.find(entry => entry.id === id)
    wx.showModal({
      title: '删除食材',
      content: `确定从库存中删除“${item ? item.name : '这项食材'}”吗？`,
      confirmColor: '#c43d38',
      success: async res => {
        if (!res.confirm) return
        this.setData({ deletePendingId: id })
        try {
          await inventoryUtil.removeInventory(id)
          this.loadInventory()
        } catch (error) {
          wx.showToast({ title: '删除失败，请重试', icon: 'none' })
        } finally {
          this.setData({ deletePendingId: '' })
        }
      }
    })
  }
})

function formatLocalDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
