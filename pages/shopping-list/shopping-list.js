const cartUtil = require('../../utils/cart')
const shoppingUtil = require('../../utils/shopping')

Page({
  data: {
    items: [],
    shoppingCount: 0,
    inStockCount: 0
  },

  onShow() {
    this.loadShoppingList()
  },

  async loadShoppingList() {
    try {
      const { list } = await cartUtil.getCartInfo()
      const items = shoppingUtil.createShoppingItems(list)
      this.updateItems(items)
    } catch (e) {
      console.error('加载采购清单失败', e)
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    }
  },

  updateItems(items) {
    const inStockCount = items.filter(item => item.isInStock).length
    this.setData({
      items,
      inStockCount,
      shoppingCount: items.length - inStockCount
    })
  },

  onToggleItem(e) {
    const key = e.currentTarget.dataset.key
    const currentItem = this.data.items.find(item => item.key === key)
    if (currentItem && currentItem.stockState === 'enough') {
      wx.showToast({ title: '库存充足，无需采购', icon: 'none' })
      return
    }
    const items = this.data.items.map(item => {
      if (item.key !== key) return item
      const isInStock = !item.isInStock
      shoppingUtil.setItemChecked(key, isInStock)
      return { ...item, isInStock }
    })
    this.updateItems(items)
  },

  goToInventory() {
    wx.navigateTo({ url: '/pages/inventory/inventory' })
  },

  goToMenu() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
