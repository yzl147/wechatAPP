const cartUtil = require('../../utils/cart')
const shoppingUtil = require('../../utils/shopping')
const inventoryUtil = require('../../utils/inventory')
const cloudUtil = require('../../utils/cloud')

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
      const [, cartInfo] = await Promise.all([
        Promise.all([
          inventoryUtil.syncInventory().catch(error => {
            console.warn('同步库存失败，采购清单继续使用本地缓存', error && error.code)
          }),
          shoppingUtil.syncShopping().catch(error => {
            console.warn('同步采购勾选失败，采购清单继续使用本地缓存', error && error.code)
          })
        ]),
        cartUtil.getCartInfo()
      ])
      const { list } = cartInfo
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

  async onToggleItem(e) {
    const key = e.currentTarget.dataset.key
    const currentItem = this.data.items.find(item => item.key === key)
    if (currentItem && currentItem.stockState === 'enough') {
      wx.showToast({ title: '库存充足，无需采购', icon: 'none' })
      return
    }
    if (!currentItem || this._updatingShoppingKey) return
    const isInStock = !currentItem.isInStock
    this._updatingShoppingKey = key
    try {
      await shoppingUtil.setItemChecked(key, isInStock)
      const items = shoppingUtil.createShoppingItems((await cartUtil.getCartInfo()).list)
      this.updateItems(items)
    } catch (error) {
      wx.showToast({ title: cloudUtil.getErrorMessage(error, '操作失败，请重试'), icon: 'none' })
    } finally {
      this._updatingShoppingKey = ''
    }
  },

  goToInventory() {
    wx.navigateTo({ url: '/pages/inventory/inventory' })
  },

  goToMenu() {
    wx.navigateTo({ url: '/pages/index/index' })
  }
})
