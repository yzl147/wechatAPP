const cartUtil = require('../../utils/cart')
const favoriteUtil = require('../../utils/favorite')
const cloudUtil = require('../../utils/cloud')

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

  // 从云端加载菜品详情
  async loadDishDetail(id) {
    this.setData({ loadStatus: 'loading' })
    try {
      const result = await cloudUtil.callFunction('manageDishes', { action: 'detail', id })
      const food = result.data
      if (food) {
        wx.setNavigationBarTitle({ title: food.name })
        this.setData({ food, loadStatus: 'success' })
        this.loadFavoriteStatus(food.id)
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
    try {
      const favoriteIds = await favoriteUtil.getFavoriteIds()
      this.setData({ isFavorite: favoriteIds.includes(foodId) })
    } catch (e) {
      console.error('加载收藏状态失败', e)
    }
  },

  async onToggleFavorite() {
    const { food, isFavorite } = this.data
    if (!food) return
    try {
      const nextStatus = !isFavorite
      await favoriteUtil.setFavorite(food.id, nextStatus)
      this.setData({ isFavorite: nextStatus })
      wx.showToast({ title: nextStatus ? '已收藏菜谱' : '已取消收藏', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: cloudUtil.getErrorMessage(e, '操作失败，请重试'), icon: 'none' })
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
