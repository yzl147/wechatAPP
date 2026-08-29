const lifeListUtil = require('../../utils/life-list')

Page({
  data: {
    list: null,
    newItem: '',
    loadStatus: 'loading',
    progressPercent: 0,
    remainingCount: 0,
    mutationPendingId: '',
    addPending: false,
    templatePending: false,
    deletePending: false
  },

  onLoad(options) { this.listId = options.id },
  async onShow() {
    await this.loadPage()
  },

  async loadPage() {
    if (!this.data.list) this.setData({ loadStatus: 'loading' })
    try {
      try {
        await lifeListUtil.syncLifeData()
      } catch (error) {
        wx.showToast({ title: '云端同步失败，显示本地缓存', icon: 'none' })
      }
      this.loadList()
    } catch (error) {
      console.error('加载生活清单详情失败', error)
      this.setData({ loadStatus: 'error' })
    }
  },

  onRetryLoad() { this.loadPage() },

  loadList() {
    const list = lifeListUtil.getList(this.listId)
    if (!list) {
      this.setData({ list: null, loadStatus: 'empty' })
      return
    }
    const doneCount = list.items.filter(item => item.done).length
    const totalCount = list.items.length
    this.setData({
      list: { ...list, doneCount, totalCount },
      progressPercent: totalCount ? Math.round(doneCount / totalCount * 100) : 0,
      remainingCount: Math.max(0, totalCount - doneCount),
      loadStatus: 'success'
    })
    wx.setNavigationBarTitle({ title: list.title })
  },

  async onToggleItem(e) {
    const id = e.currentTarget.dataset.id
    if (!id || this.data.mutationPendingId || this.data.addPending || this.data.templatePending || this.data.deletePending) return
    this.setData({ mutationPendingId: id })
    try {
      await lifeListUtil.toggleItem(this.listId, id)
      this.loadList()
    } catch (error) {
      wx.showToast({ title: '更新失败，请重试', icon: 'none' })
    } finally {
      this.setData({ mutationPendingId: '' })
    }
  },
  onNewItemInput(e) { this.setData({ newItem: e.detail.value }) },
  async onAddItem() {
    const text = this.data.newItem.trim()
    if (!text || this.data.addPending || this.data.mutationPendingId || this.data.templatePending || this.data.deletePending) return
    this.setData({ addPending: true })
    try {
      await lifeListUtil.addItem(this.listId, text)
      this.setData({ newItem: '' })
      this.loadList()
    } catch (error) {
      wx.showToast({ title: '添加失败，请重试', icon: 'none' })
    } finally {
      this.setData({ addPending: false })
    }
  },
  onRemoveItem(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.list.items.find(entry => entry.id === id)
    if (!item || this.data.mutationPendingId || this.data.addPending || this.data.templatePending || this.data.deletePending) return
    wx.showModal({
      title: '删除清单项目',
      content: `确定删除“${item.text}”吗？`,
      confirmColor: '#c43d38',
      success: async result => {
        if (!result.confirm) return
        this.setData({ mutationPendingId: id })
        try {
          await lifeListUtil.removeItem(this.listId, id)
          this.loadList()
        } catch (error) {
          wx.showToast({ title: '删除失败，请重试', icon: 'none' })
        } finally {
          this.setData({ mutationPendingId: '' })
        }
      }
    })
  },
  async onSaveAsTemplate() {
    if (this.data.templatePending || this.data.deletePending || this.data.mutationPendingId || this.data.addPending) return
    this.setData({ templatePending: true })
    try {
      const template = await lifeListUtil.saveAsTemplate(this.data.list)
      wx.showToast({ title: template ? '已保存为模板' : '清单没有可保存的项目', icon: 'none' })
    } catch (error) {
      wx.showToast({ title: '保存模板失败，请重试', icon: 'none' })
    } finally {
      this.setData({ templatePending: false })
    }
  },
  onDeleteList() {
    if (this.data.deletePending || this.data.templatePending || this.data.mutationPendingId || this.data.addPending) return
    wx.showModal({
      title: '删除清单',
      content: '确定删除这张清单吗？已保存的历史完成记录不会受到影响。',
      confirmColor: '#c43d38',
      success: async result => {
        if (!result.confirm) return
        this.setData({ deletePending: true })
        try {
          await lifeListUtil.removeList(this.listId)
          wx.navigateBack()
        } catch (error) {
          this.setData({ deletePending: false })
          wx.showToast({ title: '删除失败，请重试', icon: 'none' })
        }
      }
    })
  },

  onBackToLists() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/life-lists/life-lists' }) })
  }
})
