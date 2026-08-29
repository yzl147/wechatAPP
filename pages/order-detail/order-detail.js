const mealRecordService = require('../../services/meal-record-service')
const mealListService = require('../../services/meal-list-service')
const cloudUtil = require('../../utils/cloud')

Page({
  data: {
    record: null,
    recordId: '',
    loadStatus: 'loading',
    fromHistory: false
  },

  onLoad(options) {
    const recordId = options.recordId || options.orderId
    if (recordId) {
      this.setData({ recordId })
      this.loadMealRecord(recordId)
    } else {
      this.setData({ loadStatus: 'empty' })
    }
    if (options.fromHistory === 'true') {
      this.setData({ fromHistory: true })
    }
  },

  async loadMealRecord(recordId) {
    this.setData({ loadStatus: 'loading' })
    try {
      const record = await mealRecordService.getRecord(recordId)
      if (record) {
        const recordData = {
          ...record,
          mealType: record.mealType || 'cook',
          mealTypeText: getMealTypeText(record.mealType),
          isCook: !record.mealType || record.mealType === 'cook',
          totalCount: getRecordCount(record),
          _timeText: mealRecordService.formatTime(record.recordedAt)
        }
        this.setData({ record: recordData, loadStatus: 'success' })
        wx.setNavigationBarTitle({ title: '饮食记录' })
      } else {
        this.setData({ record: null, loadStatus: 'empty' })
      }
    } catch (e) {
      console.error('加载饮食记录详情失败', e && e.code, e && e.requestId)
      this.setData({ loadStatus: 'error' })
    }
  },

  onRetryLoad() { this.loadMealRecord(this.data.recordId) },

  onViewMealRecords() {
    wx.switchTab({
      url: '/pages/orders/orders'
    })
  },

  // 按原份数将这餐菜品重新加入今日清单
  async onReuseMeal() {
    const { record } = this.data
    if (!record || !record.items || record.items.length === 0) return
    wx.showLoading({ title: '加入清单中...' })
    try {
      for (const item of record.items) {
        await mealListService.addDish(item, item.quantity || 1)
      }
      wx.hideLoading()
      wx.showToast({ title: '已加入今日清单', icon: 'success' })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: cloudUtil.getErrorMessage(e, '加入失败，请重试'), icon: 'none' })
    }
  },

  onDeleteRecord() {
    const record = this.data.record
    const dishNames = (record && record.items) ? record.items.map(item => item.name).join('、') : ''
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条饮食记录吗？\n（${dishNames}）`,
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          try {
            await mealRecordService.deleteRecord(record.recordId)
            wx.showToast({ title: '已删除', icon: 'none' })
            setTimeout(() => {
              wx.switchTab({ url: '/pages/orders/orders' })
            }, 800)
          } catch (e) {
            wx.showToast({ title: cloudUtil.getErrorMessage(e, '删除失败，请重试'), icon: 'none' })
          }
        }
      }
    })
  },

  // 继续选菜
  goToIndex() {
    wx.navigateTo({
      url: '/pages/index/index'
    })
  }
})

function getMealTypeText(type) {
  return { dine_out: '外出吃', takeout: '外卖' }[type] || '自己做'
}

function getRecordCount(record) {
  if (Number.isFinite(record.totalCount)) return record.totalCount
  return record.items.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
}
