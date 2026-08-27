const orderUtil = require('../../utils/order')
const inventoryUtil = require('../../utils/inventory')
const lifeListUtil = require('../../utils/life-list')
const cloudUtil = require('../../utils/cloud')

Page({
  data: {
    monthLabel: '',
    cookCount: 0,
    dineOutCount: 0,
    takeoutCount: 0,
    topDishes: [],
    expiringCount: 0,
    lifeCompletionRecords: []
  },

  onShow() { this.loadStats() },

  async loadStats() {
    try {
      const now = new Date()
      const startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
      const endTime = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
      const [orders] = await Promise.all([
        orderUtil.getOrdersInRange(startTime, endTime),
        inventoryUtil.syncInventory().catch(error => {
          console.warn('同步库存失败，统计页继续使用本地缓存', error && error.code)
        }),
        lifeListUtil.syncLifeData().catch(error => {
          console.warn('同步生活清单失败，统计页继续使用本地缓存', error && error.code)
        })
      ])
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const monthOrders = orders
      const cookOrders = monthOrders.filter(order => !order.mealType || order.mealType === 'cook')
      const dishMap = {}
      cookOrders.forEach(order => (order.items || []).forEach(item => {
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
        cookCount: cookOrders.length,
        dineOutCount: monthOrders.filter(order => order.mealType === 'dine_out').length,
        takeoutCount: monthOrders.filter(order => order.mealType === 'takeout').length,
        topDishes,
        expiringCount,
        lifeCompletionRecords
      })
    } catch (e) {
      console.error('加载统计数据失败', e && e.code, e && e.requestId)
      wx.showToast({ title: cloudUtil.getErrorMessage(e, '加载统计失败'), icon: 'none' })
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
