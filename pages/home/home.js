const cartUtil = require('../../utils/cart')
const lifeListUtil = require('../../utils/life-list')

Page({
  data: {
    mealCount: 0,
    lifeListCount: 0,
    unfinishedCount: 0,
    mealLoadStatus: 'loading',
    lifeLoadStatus: 'loading',
    mealStatusText: '',
    lifeStatusText: ''
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
        mealStatusText: cartInfo.count ? `今日已选 ${cartInfo.count} 份` : '去挑选今天想做的菜',
        mealLoadStatus: 'success'
      })
    } catch (e) {
      console.error('加载饮食清单概览失败', e && e.code)
      this.setData({ mealLoadStatus: 'error' })
    }
  },

  async loadLifeOverview() {
    this.setData({ lifeLoadStatus: 'loading' })
    try {
      await lifeListUtil.syncLifeData()
      const lists = lifeListUtil.getDisplayLists()
      const unfinishedCount = lists.reduce((total, list) => total + list.totalCount - list.doneCount, 0)
      this.setData({
        lifeListCount: lists.length,
        unfinishedCount,
        lifeStatusText: lists.length ? `还有 ${unfinishedCount} 项等待完成` : '创建第一张生活清单',
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
