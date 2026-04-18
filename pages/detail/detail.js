const foods = require('../../data/foods')
const cartUtil = require('../../utils/cart')

Page({
  data: {
    food: null
  },

  onLoad(options) {
    const id = parseInt(options.id)
    const food = foods.find(f => f.id === id)
    if (food) {
      wx.setNavigationBarTitle({ title: food.name })
      this.setData({ food })
    }
  },

  // 加入购物车
  onAddToCart() {
    const { food } = this.data
    if (!food) return

    cartUtil.addToCart(food)
    wx.showToast({
      title: `${food.name} 已加入购物车`,
      icon: 'none'
    })

    // 振动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' })
    }
  }
})
