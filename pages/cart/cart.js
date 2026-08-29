const mealListService = require('../../services/meal-list-service')
const orderUtil = require('../../utils/order')
const shoppingUtil = require('../../utils/shopping')
const inventoryUtil = require('../../utils/inventory')
const cloudUtil = require('../../utils/cloud')

Page({
  data: {
    mealList: [],
    totalCount: 0,
    loadStatus: 'loading',
    shoppingLoadStatus: 'idle',
    shoppingSummaryText: '',
    shoppingWarning: '',
    mutationPendingId: 0,
    clearPending: false,
    savePending: false
  },

  onShow() {
    this.loadMealList()
  },

  async loadMealList({ syncShopping = true } = {}) {
    const hasData = this.data.mealList.length > 0
    if (!hasData) this.setData({ loadStatus: 'loading' })
    try {
      const result = await mealListService.loadMealList()
      const list = result.items.map(item => ({
        ...item,
        itemId: item.dishId
      }))
      this.setData({
        mealList: list,
        totalCount: result.count,
        loadStatus: 'success'
      })
      if (list.length > 0) this.loadShoppingSummary(list, syncShopping)
      else this.resetShoppingSummary()
    } catch (e) {
      console.error('加载今日清单失败', e && e.code, e && e.requestId)
      if (!hasData) this.setData({ loadStatus: 'error' })
      else this.showError(e, '刷新失败，请重试')
    }
  },

  onRetryLoad() { this.loadMealList() },

  showError(error, fallback) {
    wx.showToast({ title: cloudUtil.getErrorMessage(error, fallback), icon: 'none' })
  },

  async loadShoppingSummary(mealList, shouldSync) {
    const loadToken = (this._shoppingLoadToken || 0) + 1
    this._shoppingLoadToken = loadToken
    this.setData({ shoppingLoadStatus: 'loading', shoppingWarning: '' })
    let syncFailed = false
    if (shouldSync) {
      const results = await Promise.allSettled([
        inventoryUtil.syncInventory(),
        shoppingUtil.syncShopping()
      ])
      syncFailed = results.some(result => result.status === 'rejected')
    }
    if (loadToken !== this._shoppingLoadToken) return
    try {
      const items = shoppingUtil.createShoppingItems(mealList)
      const inStockCount = items.filter(item => item.isInStock).length
      const shoppingCount = items.length - inStockCount
      let shoppingSummaryText = `待采购 ${shoppingCount} 项，家里已有 ${inStockCount} 项`
      if (items.length === 0) shoppingSummaryText = '这些菜暂时没有可整理的食材'
      else if (shoppingCount === 0) shoppingSummaryText = `共 ${items.length} 项食材，家中库存已满足`
      this.setData({
        shoppingLoadStatus: 'success',
        shoppingSummaryText,
        shoppingWarning: syncFailed ? '库存或采购状态同步失败，当前按本地缓存估算' : ''
      })
    } catch (error) {
      console.error('计算食材缺口失败', error)
      this.setData({ shoppingLoadStatus: 'error', shoppingWarning: '进入采购清单后可重新加载' })
    }
  },

  resetShoppingSummary() {
    this._shoppingLoadToken = (this._shoppingLoadToken || 0) + 1
    this.setData({ shoppingLoadStatus: 'idle', shoppingSummaryText: '', shoppingWarning: '' })
  },

  // 增加数量
  async onIncrease(e) {
    const id = Number(e.detail.id)
    if (this.data.mutationPendingId || this.data.clearPending || this.data.savePending) return
    this.setData({ mutationPendingId: id })
    try {
      await mealListService.increaseDishQuantity(id)
      await this.loadMealList({ syncShopping: false })
    } catch (e) {
      this.showError(e, '增加数量失败，请重试')
    } finally {
      this.setData({ mutationPendingId: 0 })
    }
  },

  // 减少数量
  async onDecrease(e) {
    const id = Number(e.detail.id)
    if (this.data.mutationPendingId || this.data.clearPending || this.data.savePending) return
    this.setData({ mutationPendingId: id })
    try {
      await mealListService.decreaseDishQuantity(id)
      await this.loadMealList({ syncShopping: false })
    } catch (e) {
      this.showError(e, '减少数量失败，请重试')
    } finally {
      this.setData({ mutationPendingId: 0 })
    }
  },

  // 从今日饮食清单删除菜品
  onDeleteItem(e) {
    const id = Number(e.currentTarget.dataset.id)
    if (this.data.mutationPendingId || this.data.clearPending || this.data.savePending) return
    wx.showModal({
      title: '删除菜品',
      content: '确定从今日饮食清单中删除这道菜吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ mutationPendingId: id })
          try {
            await mealListService.removeDish(id)
            await this.loadMealList({ syncShopping: false })
          } catch (e) {
            this.showError(e, '删除失败，请重试')
          } finally {
            this.setData({ mutationPendingId: 0 })
          }
        }
      }
    })
  },

  // 清空今日清单
  onClearMealList() {
    if (this.data.mealList.length === 0 || this.data.clearPending || this.data.mutationPendingId || this.data.savePending) return
    wx.showModal({
      title: '清空今日饮食清单',
      content: '确定清空今日清单吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ clearPending: true })
          try {
            await mealListService.clearMealList()
            this.setData({ mealList: [], totalCount: 0, loadStatus: 'success' })
            this.resetShoppingSummary()
            wx.showToast({ title: '今日清单已清空', icon: 'none' })
          } catch (e) {
            this.showError(e, '清空失败，请重试')
          } finally {
            this.setData({ clearPending: false })
          }
        }
      }
    })
  },

  // 保存今日饮食记录
  onSaveRecord() {
    if (this.data.savePending || this.data.clearPending || this.data.mutationPendingId) {
      wx.showToast({ title: '请等待当前操作完成', icon: 'none' })
      return
    }
    if (this.data.mealList.length === 0) {
      wx.showToast({ title: '清单还是空的', icon: 'none' })
      return
    }
    this.saveMealRecord()
  },

  goToShoppingList() {
    if (this.data.mealList.length === 0) {
      wx.showToast({ title: '先添加想做的菜吧', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/shopping-list/shopping-list' })
  },

  async saveMealRecord() {
    const { mealList } = this.data
    this.setData({ savePending: true })
    wx.showLoading({ title: '保存中...' })
    let record = null
    try {
      record = await orderUtil.createOrder(mealList)
      await mealListService.clearMealList()
    } catch (e) {
      record = null
      this.showError(e, '保存失败，请重试')
    } finally {
      wx.hideLoading()
      this.setData({ savePending: false })
    }
    if (record) wx.navigateTo({ url: `/pages/order-detail/order-detail?orderId=${record.orderId}` })
  },

  // 去选菜
  goToIndex() {
    wx.navigateTo({
      url: '/pages/index/index'
    })
  },

  // 预览菜品图片
  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    const allUrls = this.data.mealList
      .map(item => item.image)
      .filter(Boolean)
    wx.previewImage({
      current: url,
      urls: allUrls
    })
  }
})
