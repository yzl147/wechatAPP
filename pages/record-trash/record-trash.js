const mealRecordService = require('../../services/meal-record-service')
const cloudUtil = require('../../utils/cloud')

Page({
  data: {
    records: [],
    loadStatus: 'loading',
    nextCursor: null,
    hasMore: true,
    loadingMore: false,
    restoringId: ''
  },

  onShow() {
    this.loadDeletedRecords(true)
  },

  onReachBottom() {
    this.loadDeletedRecords(false)
  },

  async loadDeletedRecords(reset = true) {
    if (this.data.loadingMore || (!reset && !this.data.hasMore)) return
    const hasData = this.data.records.length > 0
    if (reset && !hasData) this.setData({ loadStatus: 'loading' })
    if (!reset) this.setData({ loadingMore: true })
    try {
      const page = await mealRecordService.getDeletedPage({
        cursor: reset ? null : this.data.nextCursor,
        limit: 20
      })
      const incoming = page.items.map(formatDeletedRecord)
      const records = reset ? incoming : mergeRecords(this.data.records, incoming)
      this.setData({
        records,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        loadingMore: false,
        loadStatus: records.length > 0 ? 'success' : 'empty'
      })
    } catch (error) {
      console.error('加载最近删除记录失败', error && error.code, error && error.requestId)
      this.setData({ loadingMore: false })
      if (!hasData) this.setData({ loadStatus: 'error' })
      else wx.showToast({ title: cloudUtil.getErrorMessage(error, '加载失败，请重试'), icon: 'none' })
    }
  },

  onRetryLoad() {
    this.loadDeletedRecords(true)
  },

  async onRestore(e) {
    const recordId = e.currentTarget.dataset.id
    if (!recordId || this.data.restoringId) return
    this.setData({ restoringId: recordId })
    try {
      const result = await mealRecordService.restoreRecord(recordId)
      if (!result.restored) throw new Error('记录未恢复')
      const records = this.data.records.filter(item => item.recordId !== recordId)
      this.setData({
        records,
        restoringId: '',
        loadStatus: records.length > 0 ? 'success' : 'empty'
      })
      wx.showToast({ title: '已恢复饮食记录', icon: 'success' })
      if (records.length === 0 && this.data.hasMore) this.loadDeletedRecords(false)
    } catch (error) {
      this.setData({ restoringId: '' })
      wx.showToast({ title: cloudUtil.getErrorMessage(error, '恢复失败，请重试'), icon: 'none' })
    }
  }
})

function formatDeletedRecord(record) {
  const items = Array.isArray(record.items) ? record.items : []
  return {
    ...record,
    _titleText: record.venue || items.map(item => item.name).filter(Boolean).slice(0, 3).join('、') || '饮食记录',
    _mealTypeText: { dine_out: '外出吃', takeout: '点外卖' }[record.mealType] || '自己做',
    _recordedTime: mealRecordService.formatTime(record.recordedAt),
    _deletedTime: mealRecordService.formatTime(record.deletedAt),
    _itemsText: items
      .filter(item => item && item.name)
      .map(item => `${item.name} ×${Number(item.quantity) || 1}`)
      .join('、')
  }
}

function mergeRecords(existing, incoming) {
  const seen = new Set(existing.map(item => item.recordId))
  return existing.concat(incoming.filter(item => {
    if (seen.has(item.recordId)) return false
    seen.add(item.recordId)
    return true
  }))
}
