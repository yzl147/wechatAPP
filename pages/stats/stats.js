const orderUtil = require('../../utils/order')
const inventoryUtil = require('../../utils/inventory')
const lifeListUtil = require('../../utils/life-list')

Page({
  data: {
    monthLabel: '',
    mealDays: 0,
    dishCount: 0,
    topDishes: [],
    expiringCount: 0,
    lifeCompletionRecords: []
  },

  onShow() { this.loadStats() },

  async loadStats() {
    try {
      const orders = await orderUtil.getOrders()
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const monthOrders = orders.filter(order => formatMonth(order.orderTime) === monthKey)
      const dishMap = {}
      monthOrders.forEach(order => (order.items || []).forEach(item => {
        dishMap[item.name] = (dishMap[item.name] || 0) + (item.quantity || 1)
      }))
      const topDishes = Object.keys(dishMap)
        .map(name => ({ name, count: dishMap[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
      const inventory = inventoryUtil.getDisplayInventory()
      const expiringCount = inventory.filter(item => item.expiry.type === 'expired' || item.expiry.type === 'expiring').length
      const lifeCompletionRecords = lifeListUtil.getCompletionHistory()
        .filter(record => formatMonth(record.completedAt) === monthKey)
        .map(record => ({
          ...record,
          completedDateText: formatDate(record.completedAt)
        }))
      this.setData({
        monthLabel: `${now.getFullYear()}年${now.getMonth() + 1}月`,
        mealDays: monthOrders.length,
        dishCount: Object.keys(dishMap).length,
        topDishes,
        expiringCount,
        lifeCompletionRecords
      })
    } catch (e) {
      console.error('加载统计数据失败', e)
      wx.showToast({ title: '加载统计失败', icon: 'none' })
    }
  },

  onLifeRecordTap(e) {
    wx.navigateTo({ url: `/pages/life-completion-detail/life-completion-detail?id=${e.currentTarget.dataset.id}` })
  }
})

function formatMonth(timestamp) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
