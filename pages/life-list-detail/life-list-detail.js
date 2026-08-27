const lifeListUtil = require('../../utils/life-list')

Page({
  data: { list: null, newItem: '' },

  onLoad(options) { this.listId = options.id },
  async onShow() {
    try { await lifeListUtil.syncLifeData() } catch (error) { wx.showToast({ title: '云端同步失败，显示本地缓存', icon: 'none' }) }
    this.loadList()
  },

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

  async onToggleItem(e) {
    try { await lifeListUtil.toggleItem(this.listId, e.currentTarget.dataset.id); this.loadList() } catch (error) { wx.showToast({ title: '更新失败，请重试', icon: 'none' }) }
  },
  onNewItemInput(e) { this.setData({ newItem: e.detail.value }) },
  async onAddItem() {
    const text = this.data.newItem.trim()
    if (!text) return
    try {
      await lifeListUtil.addItem(this.listId, text)
      this.setData({ newItem: '' })
      this.loadList()
    } catch (error) { wx.showToast({ title: '添加失败，请重试', icon: 'none' }) }
  },
  async onRemoveItem(e) {
    try { await lifeListUtil.removeItem(this.listId, e.currentTarget.dataset.id); this.loadList() } catch (error) { wx.showToast({ title: '删除失败，请重试', icon: 'none' }) }
  },
  async onSaveAsTemplate() {
    try {
      const template = await lifeListUtil.saveAsTemplate(this.data.list)
      wx.showToast({ title: template ? '已保存为模板' : '清单没有可保存的项目', icon: 'none' })
    } catch (error) { wx.showToast({ title: '保存模板失败，请重试', icon: 'none' }) }
  },
  onDeleteList() {
    wx.showModal({ title: '删除清单', content: '确定删除这张清单吗？', confirmColor: '#e74c3c', success: async res => {
      if (!res.confirm) return
      try { await lifeListUtil.removeList(this.listId); wx.navigateBack() } catch (error) { wx.showToast({ title: '删除失败，请重试', icon: 'none' }) }
    } })
  }
})
