const cartUtil = require('../../utils/cart')

Page({
  data: {
    food: null
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
      }
    } catch (e) {
      console.error('加载菜品详情失败', e)
    }
  },

  // 加入购物车
  async onAddToCart() {
    const { food } = this.data
    if (!food) return

    try {
      await cartUtil.addToCart(food)
      wx.showToast({
        title: `${food.name} 已加入购物车`,
        icon: 'none'
      })
      if (wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' })
      }
    } catch (e) {
      console.error('加入购物车失败', e)
    }
  }
})
