const candidateService = require('../../services/meal-candidate-service')
const cloudUtil = require('../../utils/cloud')

const SOURCE_TABS = [
  { type: 'dine_in', label: '堂食' },
  { type: 'takeout', label: '外卖' }
]

Page({
  data: {
    loadStatus: 'loading',
    syncWarning: '',
    currentSource: 'dine_in',
    tabs: SOURCE_TABS,
    candidates: [],
    name: '',
    note: '',
    editingId: '',
    operationPending: false
  },

  onShow() {
    this.loadCandidates()
  },

  async loadCandidates() {
    this.setData({ loadStatus: 'loading', syncWarning: '' })
    try {
      const result = await candidateService.loadCandidates()
      this.updateCandidates(result.candidates)
      if (result.syncError) {
        const syncWarning = cloudUtil.getErrorMessage(result.syncError, '云端同步失败，当前显示本地缓存')
        this.setData({
          loadStatus: result.candidates.length > 0 ? 'success' : 'error',
          syncWarning: result.candidates.length > 0 ? syncWarning : ''
        })
      } else {
        this.setData({ loadStatus: 'success' })
      }
    } catch (error) {
      console.error('加载候选餐单失败', error)
      this.setData({ loadStatus: 'error' })
    }
  },

  onRetryLoad() { this.loadCandidates() },

  updateCandidates(allCandidates = candidateService.getCachedCandidates()) {
    const { currentSource } = this.data
    const candidates = allCandidates.filter(item => item.sourceType === currentSource)
    const tabs = SOURCE_TABS.map(tab => {
      const sourceItems = allCandidates.filter(item => item.sourceType === tab.type)
      return {
        ...tab,
        count: sourceItems.length,
        enabledCount: sourceItems.filter(item => item.enabled).length
      }
    })
    this.setData({ candidates, tabs })
  },

  onSourceTap(e) {
    if (this.data.operationPending) return
    this.setData({
      currentSource: e.currentTarget.dataset.source,
      name: '',
      note: '',
      editingId: ''
    }, () => this.updateCandidates())
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onNoteInput(e) { this.setData({ note: e.detail.value }) },

  onStartEdit(e) {
    if (this.data.operationPending) return
    const candidate = candidateService.getCachedCandidates().find(item => item.id === e.currentTarget.dataset.id)
    if (!candidate) return
    this.setData({ editingId: candidate.id, name: candidate.name, note: candidate.note })
    if (wx.pageScrollTo) wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },

  onCancelEdit() {
    if (this.data.operationPending) return
    this.setData({ editingId: '', name: '', note: '' })
  },

  async onSaveCandidate() {
    if (this.data.operationPending) return
    const name = this.data.name.trim()
    const note = this.data.note.trim()
    const wasEditing = !!this.data.editingId
    if (!name) {
      wx.showToast({ title: '请填写候选名称', icon: 'none' })
      return
    }
    this.setData({ operationPending: true })
    try {
      let candidates
      if (this.data.editingId) {
        const result = await candidateService.editCandidate(this.data.editingId, { name, note })
        candidates = result.candidates
        if (!result.updated) throw new Error('候选餐单不存在')
      } else {
        candidates = await candidateService.addCandidate({ sourceType: this.data.currentSource, name, note })
      }
      this.setData({ editingId: '', name: '', note: '' })
      this.updateCandidates(candidates)
      wx.showToast({ title: wasEditing ? '已更新' : '已添加', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: cloudUtil.getErrorMessage(error, '保存失败，请重试'), icon: 'none' })
    } finally {
      this.setData({ operationPending: false })
    }
  },

  async onEnabledChange(e) {
    if (this.data.operationPending) {
      this.updateCandidates()
      return
    }
    this.setData({ operationPending: true })
    try {
      const result = await candidateService.setCandidateEnabled(e.currentTarget.dataset.id, e.detail.value)
      if (!result.updated) throw new Error('候选餐单不存在')
      this.updateCandidates(result.candidates)
    } catch (error) {
      this.updateCandidates()
      wx.showToast({ title: cloudUtil.getErrorMessage(error, '更新失败，请重试'), icon: 'none' })
    } finally {
      this.setData({ operationPending: false })
    }
  },

  onDeleteCandidate(e) {
    if (this.data.operationPending) return
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除候选餐单',
      content: '删除后不会再参与“今天吃什么”，确定继续吗？',
      confirmColor: '#c43d38',
      success: result => { if (result.confirm) this.deleteCandidate(id) }
    })
  },

  async deleteCandidate(id) {
    this.setData({ operationPending: true })
    try {
      const candidates = await candidateService.removeCandidate(id)
      if (this.data.editingId === id) this.setData({ editingId: '', name: '', note: '' })
      this.updateCandidates(candidates)
      wx.showToast({ title: '已删除', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: cloudUtil.getErrorMessage(error, '删除失败，请重试'), icon: 'none' })
    } finally {
      this.setData({ operationPending: false })
    }
  },

  onRestoreDefaults() {
    if (this.data.operationPending) return
    wx.showModal({
      title: '恢复默认候选',
      content: '将补回已删除的默认堂食和外卖候选，不会覆盖或删除你的自定义内容。',
      success: result => { if (result.confirm) this.restoreDefaults() }
    })
  },

  async restoreDefaults() {
    this.setData({ operationPending: true })
    try {
      const candidates = await candidateService.restoreDefaultCandidates()
      this.updateCandidates(candidates)
      wx.showToast({ title: '默认候选已恢复', icon: 'none' })
    } catch (error) {
      wx.showToast({ title: cloudUtil.getErrorMessage(error, '恢复失败，请重试'), icon: 'none' })
    } finally {
      this.setData({ operationPending: false })
    }
  },

  onEmptyAction() {
    if (wx.pageScrollTo) wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  }
})
