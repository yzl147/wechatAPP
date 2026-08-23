const cartUtil = require('../../utils/cart')
const lifeListUtil = require('../../utils/life-list')

Page({
  data: { mealCount: 0, lifeListCount: 0, unfinishedCount: 0 },

  onShow() { this.loadOverview() },

  async loadOverview() {
    try {
      const cartInfo = await cartUtil.getCartTotal()
      const lists = lifeListUtil.getDisplayLists()
      this.setData({
        mealCount: cartInfo.count || 0,
        lifeListCount: lists.length,
        unfinishedCount: lists.reduce((total, list) => total + list.totalCount - list.doneCount, 0)
      })
    } catch (e) {
      console.error('加载首页概览失败', e)
    }
  },

  goToMealList() { wx.switchTab({ url: '/pages/cart/cart' }) },
  goToLifeLists() { wx.navigateTo({ url: '/pages/life-lists/life-lists' }) },
  goToRecords() { wx.switchTab({ url: '/pages/orders/orders' }) }
})
