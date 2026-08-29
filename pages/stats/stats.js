const orderUtil = require('../../utils/order')
const inventoryUtil = require('../../utils/inventory')
const lifeListUtil = require('../../utils/life-list')
const cloudUtil = require('../../utils/cloud')
const { createMonthDescriptor, isCurrentMonth, summarizeMeals, selectLifeRecords, formatMonthDayTime } = require('../../domain/stats/month-review')

Page({
  data: {
    loadStatus: 'loading',
    loadErrorText: '',
    syncWarning: '',
    monthLabel: '',
    isCurrentMonth: true,
    totalMealCount: 0,
    cookCount: 0,
    dineOutCount: 0,
    takeoutCount: 0,
    topDishes: [],
    expiringCount: 0,
    lifeCompletionRecords: []
  },

  onLoad() {
    const now = new Date()
    this.statsYear = now.getFullYear()
    this.statsMonth = now.getMonth()
  },

  onShow() { this.loadStats(true) },

  async loadStats(syncLocal = true) {
    const descriptor = createMonthDescriptor(this.statsYear, this.statsMonth)
    const requestId = (this.loadRequestId || 0) + 1
    this.loadRequestId = requestId
    this.setData({
      loadStatus: 'loading',
      syncWarning: '',
      monthLabel: descriptor.label,
      isCurrentMonth: isCurrentMonth(descriptor.year, descriptor.month)
    })
    try {
      const warnings = []
      const syncTasks = syncLocal ? [
        inventoryUtil.syncInventory().catch(error => {
          console.warn('同步库存失败，统计页继续使用本地缓存', error && error.code)
          warnings.push('库存')
        }),
        lifeListUtil.syncLifeData().catch(error => {
          console.warn('同步生活清单失败，统计页继续使用本地缓存', error && error.code)
          warnings.push('生活清单')
        })
      ] : []
      const [orders] = await Promise.all([
        orderUtil.getOrdersInRange(descriptor.startTime, descriptor.endTime),
        ...syncTasks
      ])
      if (requestId !== this.loadRequestId) return

      const mealSummary = summarizeMeals(orders)
      let inventory = []
      let lifeHistory = []
      try {
        inventory = inventoryUtil.getDisplayInventory()
      } catch (error) {
        console.warn('读取库存缓存失败', error)
        warnings.push('库存')
      }
      try {
        lifeHistory = lifeListUtil.getCompletionHistory()
      } catch (error) {
        console.warn('读取生活清单记录失败', error)
        warnings.push('生活清单')
      }
      const expiringCount = inventory.filter(item => item.expiry.type === 'expired' || item.expiry.type === 'expiring').length
      const lifeCompletionRecords = selectLifeRecords(lifeHistory, descriptor.year, descriptor.month)
        .map(record => ({
          ...record,
          itemCount: Array.isArray(record.items) ? record.items.length : 0,
          completedDateText: formatMonthDayTime(record.completedAt)
        }))
      this.setData({
        loadStatus: 'success',
        syncWarning: warnings.length ? `${Array.from(new Set(warnings)).join('、')}同步失败，当前显示本机已有数据` : '',
        totalMealCount: mealSummary.totalCount,
        cookCount: mealSummary.cookCount,
        dineOutCount: mealSummary.dineOutCount,
        takeoutCount: mealSummary.takeoutCount,
        topDishes: mealSummary.topDishes,
        expiringCount,
        lifeCompletionRecords
      })
    } catch (e) {
      if (requestId !== this.loadRequestId) return
      console.error('加载统计数据失败', e && e.code, e && e.requestId)
      this.setData({
        loadStatus: 'error',
        loadErrorText: cloudUtil.getErrorMessage(e, '请检查网络后重试')
      })
    }
  },

  onPreviousMonth() { this.changeMonth(-1) },

  onNextMonth() {
    if (this.data.isCurrentMonth) return
    this.changeMonth(1)
  },

  onGoCurrentMonth() {
    const now = new Date()
    this.statsYear = now.getFullYear()
    this.statsMonth = now.getMonth()
    this.loadStats(false)
  },

  changeMonth(offset) {
    const target = new Date(this.statsYear, this.statsMonth + offset, 1)
    const now = new Date()
    if (target.getTime() > new Date(now.getFullYear(), now.getMonth(), 1).getTime()) return
    this.statsYear = target.getFullYear()
    this.statsMonth = target.getMonth()
    this.loadStats(false)
  },

  onRetryLoad() { this.loadStats(true) },

  goToInventory() { wx.navigateTo({ url: '/pages/inventory/inventory' }) },

  onLifeRecordTap(e) {
    wx.navigateTo({ url: `/pages/life-completion-detail/life-completion-detail?id=${e.currentTarget.dataset.id}` })
  }
})
