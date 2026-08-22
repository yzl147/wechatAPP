const cartUtil = require('../../utils/cart')
const favoriteUtil = require('../../utils/favorite')

Page({
  data: {
    food: null,
    isFavorite: false
  },

  onLoad(options) {
    const id = parseInt(options.id)
    this.loadDishDetail(id)
  },

  // 从云端加载菜品详情
  async loadDishDetail(id) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'manageDishes',
        data: { action: 'detail', id }
      })
      const food = res.result.data
      if (food) {
        wx.setNavigationBarTitle({ title: food.name })
        this.setData({ food })
        this.loadFavoriteStatus(food.id)
      }
    } catch (e) {
      console.error('加载菜品详情失败', e)
    }
  },

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
      console.error('更新收藏状态失败', e)
      wx.showToast({ title: '操作失败，请重试', icon: 'none' })
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
      console.error('加入今日清单失败', e)
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
