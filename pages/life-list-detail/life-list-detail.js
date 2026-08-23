const lifeListUtil = require('../../utils/life-list')

Page({
  data: { list: null, newItem: '' },

  onLoad(options) { this.listId = options.id },
  onShow() { this.loadList() },

  loadList() {
    const list = lifeListUtil.getList(this.listId)
    if (!list) {
      wx.navigateBack()
      return
    }
    const doneCount = list.items.filter(item => item.done).length
    this.setData({ list: { ...list, doneCount, totalCount: list.items.length } })
    wx.setNavigationBarTitle({ title: list.title })
  },

  onToggleItem(e) { lifeListUtil.toggleItem(this.listId, e.currentTarget.dataset.id); this.loadList() },
  onNewItemInput(e) { this.setData({ newItem: e.detail.value }) },
  onAddItem() {
    const text = this.data.newItem.trim()
    if (!text) return
    lifeListUtil.addItem(this.listId, text)
    this.setData({ newItem: '' })
    this.loadList()
  },
  onRemoveItem(e) { lifeListUtil.removeItem(this.listId, e.currentTarget.dataset.id); this.loadList() },
  onDeleteList() {
    wx.showModal({ title: '删除清单', content: '确定删除这张清单吗？', confirmColor: '#e74c3c', success: res => {
      if (!res.confirm) return
      lifeListUtil.removeList(this.listId)
      wx.navigateBack()
    } })
  }
})
