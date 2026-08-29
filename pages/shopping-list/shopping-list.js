const mealListService = require('../../services/meal-list-service')
const shoppingUtil = require('../../utils/shopping')
const inventoryUtil = require('../../utils/inventory')
const cloudUtil = require('../../utils/cloud')

Page({
  data: {
    items: [],
    pendingItems: [],
    readyItems: [],
    sections: [],
    shoppingCount: 0,
    inStockCount: 0,
    loadStatus: 'loading',
    updatingKey: '',
    syncWarning: ''
  },

  onShow() {
    this.loadShoppingList()
  },

  async loadShoppingList() {
    if (this.data.items.length === 0) this.setData({ loadStatus: 'loading' })
    let syncWarning = ''
    try {
      const [, mealList] = await Promise.all([
        Promise.all([
          inventoryUtil.syncInventory().catch(error => {
            console.warn('同步库存失败，采购清单继续使用本地缓存', error && error.code)
            syncWarning = '库存或采购状态同步失败，当前显示本地缓存。'
          }),
          shoppingUtil.syncShopping().catch(error => {
            console.warn('同步采购勾选失败，采购清单继续使用本地缓存', error && error.code)
            syncWarning = '库存或采购状态同步失败，当前显示本地缓存。'
          })
        ]),
        mealListService.loadMealList()
      ])
      const items = shoppingUtil.createShoppingItems(mealList.items)
      this.updateItems(items, syncWarning)
    } catch (e) {
      console.error('加载采购清单失败', e)
      this.setData({ loadStatus: 'error' })
    }
  },

  onRetryLoad() { this.loadShoppingList() },

  updateItems(items, syncWarning = this.data.syncWarning) {
    const displayItems = items.map(item => ({
      ...item,
      statusText: item.stockState === 'enough'
        ? '库存充足'
        : (item.isInStock ? '已手动确认' : '待采购')
    }))
    const readyItems = displayItems.filter(item => item.isInStock)
    const pendingItems = displayItems.filter(item => !item.isInStock)
    this.setData({
      items: displayItems,
      pendingItems,
      readyItems,
      sections: [
        {
          key: 'pending',
          title: '待采购',
          description: `${pendingItems.length} 项仍有缺口`,
          items: pendingItems
        },
        {
          key: 'ready',
          title: '无需采购或已确认',
          description: `${readyItems.length} 项已有库存或已手动确认`,
          items: readyItems
        }
      ].filter(section => section.items.length > 0),
      inStockCount: readyItems.length,
      shoppingCount: pendingItems.length,
      syncWarning,
      loadStatus: 'success'
    })
  },

  async onToggleItem(e) {
    const key = e.currentTarget.dataset.key
    const currentItem = this.data.items.find(item => item.key === key)
    if (currentItem && currentItem.stockState === 'enough') {
      wx.showToast({ title: '库存充足，无需采购', icon: 'none' })
      return
    }
    if (!currentItem || this.data.updatingKey) return
    const isInStock = !currentItem.isInStock
    this.setData({ updatingKey: key })
    try {
      await shoppingUtil.setItemChecked(key, isInStock)
      const items = shoppingUtil.createShoppingItems((await mealListService.loadMealList()).items)
      this.updateItems(items)
    } catch (error) {
      wx.showToast({ title: cloudUtil.getErrorMessage(error, '操作失败，请重试'), icon: 'none' })
    } finally {
      this.setData({ updatingKey: '' })
    }
  },

  goToInventory() {
    wx.navigateTo({ url: '/pages/inventory/inventory' })
  },

  goToMenu() {
    wx.navigateTo({ url: '/pages/index/index' })
  }
})
