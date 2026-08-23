const lifeListUtil = require('../../utils/life-list')

Page({
  data: { record: null, timeText: '', hasCurrentList: false },

  onLoad(options) {
    const record = lifeListUtil.getCompletionRecord(options.id)
    if (!record) {
      wx.showToast({ title: '完成记录不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 600)
      return
    }
    const currentList = lifeListUtil.getList(record.listId)
    this.setData({
      record,
      timeText: formatTime(record.completedAt),
      hasCurrentList: !!currentList
    })
    wx.setNavigationBarTitle({ title: record.title })
  },

  openCurrentList() {
    wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${this.data.record.listId}` })
  }
})

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}
