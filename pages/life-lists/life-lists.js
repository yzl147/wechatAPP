const lifeListUtil = require('../../utils/life-list')

const TEMPLATES = [
  { title: '家务清单', items: ['倒垃圾', '清理台面', '扫地拖地', '洗晒衣物'], repeat: 'weekly' },
  { title: '出行准备', items: ['身份证/证件', '手机和充电器', '钥匙', '常用药品'], repeat: 'none' },
  { title: '露营准备', items: ['帐篷和睡袋', '照明工具', '饮用水', '防蚊用品'], repeat: 'none' },
  { title: '搬家清单', items: ['证件和贵重物品', '打包纸箱', '清洁用品', '交接钥匙'], repeat: 'none' },
  { title: '换季收纳', items: ['整理当季衣物', '清洗晾晒', '标记收纳箱', '检查防潮用品'], repeat: 'monthly' }
]

Page({
  data: {
    lists: [],
    customTemplates: [],
    templates: TEMPLATES.map((template, index) => ({
      ...template,
      index,
      itemCount: template.items.length,
      repeatText: getRepeatText(template.repeat)
    })),
    title: '',
    itemsText: '',
    repeatIndex: 0,
    repeatOptions: ['不重复', '每天', '每周', '每月'],
    showCreateForm: false,
    loadStatus: 'loading',
    createPending: false,
    templatePendingKey: '',
    unfinishedCount: 0,
    completedListCount: 0
  },

  onShow() { this.loadLists() },

  async loadLists() {
    if (this.data.lists.length === 0) this.setData({ loadStatus: 'loading' })
    try {
      try {
        await lifeListUtil.syncLifeData()
      } catch (error) {
        wx.showToast({ title: '云端同步失败，显示本地缓存', icon: 'none' })
      }
      const lists = lifeListUtil.getDisplayLists().map(list => ({
        ...list,
        remainingCount: Math.max(0, list.totalCount - list.doneCount),
        progressPercent: list.totalCount ? Math.round(list.doneCount / list.totalCount * 100) : 0
      }))
      this.setData({
        lists,
        customTemplates: lifeListUtil.getCustomTemplates().map(item => ({
          ...item,
          itemCount: Array.isArray(item.items) ? item.items.length : 0
        })),
        unfinishedCount: lists.reduce((total, list) => total + Math.max(0, list.totalCount - list.doneCount), 0),
        completedListCount: lists.filter(list => list.isCompleted).length,
        loadStatus: 'success'
      })
    } catch (error) {
      console.error('加载生活清单失败', error)
      this.setData({ loadStatus: 'error' })
    }
  },
  onRetryLoad() { this.loadLists() },
  onOpenCreate() { this.setData({ showCreateForm: true }) },
  onCancelCreate() {
    if (this.data.createPending) return
    this.setData({ showCreateForm: false, title: '', itemsText: '', repeatIndex: 0 })
  },
  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onItemsInput(e) { this.setData({ itemsText: e.detail.value }) },
  onRepeatChange(e) { this.setData({ repeatIndex: Number(e.detail.value) }) },

  async onCreateList() {
    const { title, itemsText, createPending } = this.data
    if (createPending || this.data.templatePendingKey) return
    if (!title.trim()) {
      wx.showToast({ title: '请填写清单名称', icon: 'none' })
      return
    }
    const repeat = ['none', 'daily', 'weekly', 'monthly'][this.data.repeatIndex]
    const items = itemsText.split(/\n|，|,/).map(item => item.trim()).filter(Boolean)
    this.setData({ createPending: true })
    try {
      const list = await lifeListUtil.createList(title, items, repeat)
      this.setData({ title: '', itemsText: '', repeatIndex: 0, showCreateForm: false })
      wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${list.id}` })
    } catch (error) {
      wx.showToast({ title: '创建失败，请检查网络', icon: 'none' })
    } finally {
      this.setData({ createPending: false })
    }
  },

  async onUseTemplate(e) {
    const index = Number(e.currentTarget.dataset.index)
    const template = TEMPLATES[index]
    if (!template) return
    await this.createFromTemplate(template, `default-${index}`)
  },

  async onUseCustomTemplate(e) {
    const template = this.data.customTemplates.find(item => item.id === e.currentTarget.dataset.id)
    if (!template) return
    await this.createFromTemplate(template, `custom-${template.id}`)
  },

  async createFromTemplate(template, pendingKey) {
    if (this.data.templatePendingKey || this.data.createPending) return
    this.setData({ templatePendingKey: pendingKey })
    try {
      const list = await lifeListUtil.createList(template.title, template.items, template.repeat || 'none')
      wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${list.id}` })
    } catch (error) {
      wx.showToast({ title: '创建失败，请检查网络', icon: 'none' })
    } finally {
      this.setData({ templatePendingKey: '' })
    }
  },

  onListTap(e) {
    wx.navigateTo({ url: `/pages/life-list-detail/life-list-detail?id=${e.currentTarget.dataset.id}` })
  }
})

function getRepeatText(repeat) {
  return { daily: '每天', weekly: '每周', monthly: '每月' }[repeat] || '单次'
}
