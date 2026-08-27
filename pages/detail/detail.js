const cartUtil = require('../../utils/cart')
const cloudUtil = require('../../utils/cloud')
const dishService = require('../../services/dish-service')

Page({
  data: {
    food: null,
    isFavorite: false,
    dishId: null,
    loadStatus: 'loading'
  },

  onLoad(options) {
    const id = parseInt(options.id)
    this.setData({ dishId: id })
    this.loadDishDetail(id)
  },

  onShow() {
    if (this.data.dishId) this.loadFavoriteStatus(this.data.dishId)
  },

  // 从云端加载菜品详情
  async loadDishDetail(id) {
    this.setData({ loadStatus: 'loading' })
    try {
      const result = await dishService.loadDetail(id)
      const food = result.dish
      if (food) {
        wx.setNavigationBarTitle({ title: food.name })
        this.setData({ food, isFavorite: food.isFavorite, loadStatus: 'success' })
        if (result.syncError) console.warn('同步收藏状态失败，详情页继续使用本地缓存', result.syncError.code)
      } else {
        this.setData({ food: null, loadStatus: 'empty' })
      }
    } catch (e) {
      console.error('加载菜品详情失败', e && e.code, e && e.requestId)
      this.setData({ loadStatus: 'error' })
    }
  },

  onRetryLoad() { this.loadDishDetail(this.data.dishId) },

  async loadFavoriteStatus(foodId) {
    const loadToken = (this._favoriteLoadToken || 0) + 1
    this._favoriteLoadToken = loadToken
    try {
      const result = await dishService.loadFavoriteIds()
      if (loadToken === this._favoriteLoadToken) this.setData({ isFavorite: result.favoriteIds.includes(Number(foodId)) })
      if (result.syncError) console.warn('同步收藏状态失败，详情页继续使用本地缓存', result.syncError.code)
    } catch (error) {
      console.error('读取收藏状态缓存失败', error)
    }
  },

  async onToggleFavorite() {
    const { food, isFavorite } = this.data
    if (!food || this._favoriteMutationPending) return
    this._favoriteMutationPending = true
    this._favoriteLoadToken = (this._favoriteLoadToken || 0) + 1
    try {
      const nextStatus = !isFavorite
      const result = await dishService.setFavorite(food.id, nextStatus)
      this.setData({ isFavorite: result.isFavorite })
      wx.showToast({ title: result.isFavorite ? '已收藏菜谱' : '已取消收藏', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: cloudUtil.getErrorMessage(e, '操作失败，请重试'), icon: 'none' })
    } finally {
      this._favoriteMutationPending = false
    }
  },

  // 加入购物车
  async onAddToCart() {
    const { food } = this.data
    if (!food) return

    try {
      await cartUtil.addToCart(food)
      wx.showToast({
        title: `${food.name} 已加入今日清单`,
        icon: 'none'
      })
      if (wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' })
      }
    } catch (e) {
      wx.showToast({ title: cloudUtil.getErrorMessage(e, '加入失败，请重试'), icon: 'none' })
    }
  },

  // 预览菜品图片
  onPreviewImage() {
    const { food } = this.data
    if (!food || !food.image) return
    wx.previewImage({
      current: food.image,
      urls: [food.image]
    })
  }
})
