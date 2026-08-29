const mealListService = require('../../services/meal-list-service')
const cloudUtil = require('../../utils/cloud')
const dishService = require('../../services/dish-service')

Page({
  data: {
    dish: null,
    isFavorite: false,
    dishId: null,
    loadStatus: 'loading',
    favoritePending: false,
    addPending: false
  },

  onLoad(options) {
    const id = Number(options.id)
    if (!Number.isInteger(id) || id <= 0) {
      this.setData({ loadStatus: 'empty' })
      return
    }
    this.setData({ dishId: id })
    this.loadDishDetail(id)
  },

  onShow() {
    if (this.data.dishId && this.data.loadStatus === 'success') this.loadFavoriteStatus(this.data.dishId)
  },

  // 从云端加载菜品详情
  async loadDishDetail(id) {
    this.setData({ loadStatus: 'loading' })
    try {
      const result = await dishService.loadDetail(id)
      const dish = result.dish
      if (dish) {
        wx.setNavigationBarTitle({ title: dish.name })
        this.setData({ dish, isFavorite: dish.isFavorite, loadStatus: 'success' })
        if (result.syncError) console.warn('同步收藏状态失败，详情页继续使用本地缓存', result.syncError.code)
      } else {
        this.setData({ dish: null, loadStatus: 'empty' })
      }
    } catch (e) {
      console.error('加载菜品详情失败', e && e.code, e && e.requestId)
      this.setData({ loadStatus: 'error' })
    }
  },

  onRetryLoad() { this.loadDishDetail(this.data.dishId) },

  async loadFavoriteStatus(dishId) {
    const loadToken = (this._favoriteLoadToken || 0) + 1
    this._favoriteLoadToken = loadToken
    try {
      const result = await dishService.loadFavoriteIds()
      if (loadToken === this._favoriteLoadToken) this.setData({ isFavorite: result.favoriteIds.includes(Number(dishId)) })
      if (result.syncError) console.warn('同步收藏状态失败，详情页继续使用本地缓存', result.syncError.code)
    } catch (error) {
      console.error('读取收藏状态缓存失败', error)
    }
  },

  async onToggleFavorite() {
    const { dish, isFavorite, favoritePending } = this.data
    if (!dish || favoritePending) return
    this.setData({ favoritePending: true })
    this._favoriteLoadToken = (this._favoriteLoadToken || 0) + 1
    try {
      const nextStatus = !isFavorite
      const result = await dishService.setFavorite(dish.id, nextStatus)
      this.setData({ isFavorite: result.isFavorite })
      wx.showToast({ title: result.isFavorite ? '已收藏菜谱' : '已取消收藏', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: cloudUtil.getErrorMessage(e, '操作失败，请重试'), icon: 'none' })
    } finally {
      this.setData({ favoritePending: false })
    }
  },

  // 加入今日饮食清单
  async onAddToMealList() {
    const { dish, addPending } = this.data
    if (!dish || addPending) return

    this.setData({ addPending: true })
    try {
      await mealListService.addDish(dish)
      wx.showToast({
        title: `${dish.name} 已加入今日清单`,
        icon: 'none'
      })
      if (wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' })
      }
    } catch (e) {
      wx.showToast({ title: cloudUtil.getErrorMessage(e, '加入失败，请重试'), icon: 'none' })
    } finally {
      this.setData({ addPending: false })
    }
  },

  onBackToCatalog() {
    wx.navigateBack({
      fail: () => wx.redirectTo({ url: '/pages/index/index' })
    })
  },

  // 预览菜品图片
  onPreviewImage() {
    const { dish } = this.data
    if (!dish || !dish.image) return
    wx.previewImage({
      current: dish.image,
      urls: [dish.image]
    })
  }
})
