const lifeListUtil = require('../../utils/life-list')

const TEMPLATES = [
  { title: '家务清单', items: ['倒垃圾', '清理台面', '扫地拖地', '洗晒衣物'] },
  { title: '出行准备', items: ['身份证/证件', '手机和充电器', '钥匙', '常用药品'] }
]

Page({
  data: { lists: [], title: '', itemsText: '' },

  onShow() { this.loadLists() },

  loadLists() { this.setData({ lists: lifeListUtil.getDisplayLists() }) },
  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onItemsInput(e) { this.setData({ itemsText: e.detail.value }) },

  onCreateList() {
    const { title, itemsText } = this.data
    if (!title.trim()) {
      wx.showToast({ title: '请填写清单名称', icon: 'none' })
      return
    }
    const list = lifeListUtil.createList(title, itemsText.split(/\n|，|,/))
    this.setData({ title: '', itemsText: '' })
    wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${list.id}` })
  },

  onUseTemplate(e) {
    const template = TEMPLATES[e.currentTarget.dataset.index]
    const list = lifeListUtil.createList(template.title, template.items)
    wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${list.id}` })
  },

  onListTap(e) {
    wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${e.currentTarget.dataset.id}` })
  }
})
