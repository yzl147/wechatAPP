const lifeListUtil = require('../../utils/life-list')

const TEMPLATES = [
  { title: '家务清单', items: ['倒垃圾', '清理台面', '扫地拖地', '洗晒衣物'], repeat: 'weekly' },
  { title: '出行准备', items: ['身份证/证件', '手机和充电器', '钥匙', '常用药品'], repeat: 'none' },
  { title: '露营准备', items: ['帐篷和睡袋', '照明工具', '饮用水', '防蚊用品'], repeat: 'none' },
  { title: '搬家清单', items: ['证件和贵重物品', '打包纸箱', '清洁用品', '交接钥匙'], repeat: 'none' },
  { title: '换季收纳', items: ['整理当季衣物', '清洗晾晒', '标记收纳箱', '检查防潮用品'], repeat: 'monthly' }
]

Page({
  data: { lists: [], customTemplates: [], templates: TEMPLATES.map(template => template.title), title: '', itemsText: '', repeatIndex: 0, repeatOptions: ['不重复', '每天', '每周', '每月'] },

  onShow() { this.loadLists() },

  loadLists() { this.setData({ lists: lifeListUtil.getDisplayLists(), customTemplates: lifeListUtil.getCustomTemplates() }) },
  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onItemsInput(e) { this.setData({ itemsText: e.detail.value }) },
  onRepeatChange(e) { this.setData({ repeatIndex: Number(e.detail.value) }) },

  onCreateList() {
    const { title, itemsText } = this.data
    if (!title.trim()) {
      wx.showToast({ title: '请填写清单名称', icon: 'none' })
      return
    }
    const repeat = ['none', 'daily', 'weekly', 'monthly'][this.data.repeatIndex]
    const list = lifeListUtil.createList(title, itemsText.split(/\n|，|,/), repeat)
    this.setData({ title: '', itemsText: '', repeatIndex: 0 })
    wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${list.id}` })
  },

  onUseTemplate(e) {
    const template = TEMPLATES[e.currentTarget.dataset.index]
    const list = lifeListUtil.createList(template.title, template.items, template.repeat)
    wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${list.id}` })
  },

  onUseCustomTemplate(e) {
    const template = this.data.customTemplates.find(item => item.id === e.currentTarget.dataset.id)
    if (!template) return
    const list = lifeListUtil.createList(template.title, template.items)
    wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${list.id}` })
  },

  onListTap(e) {
    wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${e.currentTarget.dataset.id}` })
  }
})
