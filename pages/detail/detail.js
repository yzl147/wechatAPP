const foods = require('../../data/foods')

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
  }
})
