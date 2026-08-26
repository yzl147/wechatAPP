const cartUtil = require('../../utils/cart')
const lifeListUtil = require('../../utils/life-list')

Page({
  data: {
    mealCount: 0,
    lifeListCount: 0,
    unfinishedCount: 0,
    mealLoadStatus: 'loading',
    lifeLoadStatus: 'loading'
  },

  onShow() { this.loadOverview() },

  loadOverview() {
    this.loadMealOverview()
    this.loadLifeOverview()
  },

  async loadMealOverview() {
    this.setData({ mealLoadStatus: 'loading' })
    try {
      const cartInfo = await cartUtil.getCartTotal()
      this.setData({
        mealCount: cartInfo.count || 0,
        mealLoadStatus: 'success'
      })
    } catch (e) {
      console.error('加载饮食清单概览失败', e && e.code)
      this.setData({ mealLoadStatus: 'error' })
    }
  },

  loadLifeOverview() {
    this.setData({ lifeLoadStatus: 'loading' })
    try {
      const lists = lifeListUtil.getDisplayLists()
      this.setData({
        lifeListCount: lists.length,
        unfinishedCount: lists.reduce((total, list) => total + list.totalCount - list.doneCount, 0),
        lifeLoadStatus: 'success'
      })
    } catch (e) {
      console.error('加载生活清单概览失败')
      this.setData({ lifeLoadStatus: 'error' })
    }
  },

  retryMealOverview() { this.loadMealOverview() },
  retryLifeOverview() { this.loadLifeOverview() },

  goToMealList() { wx.switchTab({ url: '/pages/cart/cart' }) },
  goToLifeLists() { wx.navigateTo({ url: '/pages/life-lists/life-lists' }) },
  goToRecords() { wx.switchTab({ url: '/pages/orders/orders' }) },
  goToStats() { wx.navigateTo({ url: '/pages/stats/stats' }) }
})
