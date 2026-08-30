const { createMealDecisionService, PHASES } = require('../../services/meal-decision-service')
const candidateService = require('../../services/meal-candidate-service')
const dishService = require('../../services/dish-service')
const preferenceRepository = require('../../repositories/local/meal-decision-preference-repository')
const mealListService = require('../../services/meal-list-service')
const cloudUtil = require('../../utils/cloud')

const SOURCE_DEFINITIONS = [
  { sourceType: 'dine_in', name: '堂食', description: '去店里或食堂吃', color: '#477aa9' },
  { sourceType: 'takeout', name: '外卖', description: '点一份送到身边', color: '#e8a23a' },
  { sourceType: 'cook', name: '自己做', description: '从现有菜谱里挑选', color: '#248a58' }
]

Page({
  data: {
    loadStatus: 'loading',
    phase: PHASES.SOURCE_SELECTION,
    sourceOptions: [],
    selectedSummary: '尚未选择用餐方式',
    unavailableMessage: '',
    syncWarning: '',
    dishWarning: '',
    storageWarning: '',
    renderWarning: '',
    wheelItems: [],
    wheelSelectedId: '',
    wheelSpinToken: 0,
    wheelDuration: 2400,
    wheelCenterText: '选方式',
    wheelEmptyText: '请先选择用餐方式',
    canStartSource: false,
    isSpinning: false,
    isSourceStage: true,
    sourceResult: null,
    candidateResult: null,
    acceptedResult: null,
    activeSourceName: '',
    candidateActionHint: '',
    addPending: false,
    addedToMealList: false,
    returningFromCandidates: false
  },

  onLoad() {
    this._decision = createMealDecisionService({
      candidates: candidateService,
      dishes: dishService,
      preferences: preferenceRepository
    })
    this.loadDecision()
  },

  onShow() {
    if (!this.data.returningFromCandidates || !this._decision) return
    this.setData({ returningFromCandidates: false })
    this.loadDecision()
  },

  async loadDecision() {
    this.setData({ loadStatus: 'loading', renderWarning: '' })
    try {
      const snapshot = await this._decision.initialize()
      this.renderSnapshot(snapshot, { loadStatus: 'success', wheelSelectedId: '' })
    } catch (error) {
      console.error('加载用餐决策失败', error)
      this.setData({ loadStatus: 'error' })
    }
  },

  onRetryLoad() { this.loadDecision() },

  onToggleSource(e) {
    if (this.data.isSpinning || this.data.phase !== PHASES.SOURCE_SELECTION) return
    const sourceType = e.currentTarget.dataset.source
    const selected = this.data.sourceOptions.filter(item => item.selected).map(item => item.sourceType)
    const next = selected.includes(sourceType)
      ? selected.filter(item => item !== sourceType)
      : selected.concat(sourceType)
    this.renderSnapshot(this._decision.setSelectedSources(next))
  },

  onStartSource() { this.startSource(false) },
  onDirectSource() { this.startSource(true) },

  startSource(direct) {
    if (this.data.isSpinning) return
    try {
      const result = this._decision.startSourceSpin()
      if (result.skippedAnimation) {
        this.renderSnapshot(result, { wheelSelectedId: '' })
        wx.showToast({ title: `只有${result.result.name}可用，已直接选择`, icon: 'none' })
        return
      }
      this.startWheel(result, direct ? 0 : 2400)
    } catch (error) {
      this.showDecisionError(error)
    }
  },

  onWheelFinish() {
    try {
      const snapshot = this.data.phase === PHASES.SOURCE_SPINNING
        ? this._decision.finishSourceSpin()
        : this._decision.finishCandidateSpin()
      this.renderSnapshot(snapshot)
    } catch (error) {
      this.showDecisionError(error)
    }
  },

  onWheelBlocked() {
    wx.showToast({ title: '转盘还在转，请稍候', icon: 'none' })
  },

  onWheelRenderError() {
    this.setData({ renderWarning: '转盘暂时无法绘制，可使用“直接告诉我”继续。' })
  },

  onConfirmSource() {
    try {
      this.renderSnapshot(this._decision.confirmSource(), { wheelSelectedId: '' })
    } catch (error) {
      this.showDecisionError(error)
    }
  },

  onRerollSource() {
    try {
      this._decision.rerollSource()
      this.startSource(false)
    } catch (error) {
      this.showDecisionError(error)
    }
  },

  onStartCandidate() { this.startCandidate(false) },
  onDirectCandidate() { this.startCandidate(true) },

  startCandidate(direct) {
    if (this.data.isSpinning) return
    try {
      const result = this._decision.startCandidateSpin()
      if (result.skippedAnimation) {
        this.renderSnapshot(result, { wheelSelectedId: '' })
        wx.showToast({ title: '只有一个候选，已直接选择', icon: 'none' })
        return
      }
      this.startWheel(result, direct ? 0 : 2400)
    } catch (error) {
      this.showDecisionError(error)
    }
  },

  onRerollCandidate() {
    try {
      this._decision.rerollCandidate()
      this.startCandidate(false)
    } catch (error) {
      this.showDecisionError(error)
    }
  },

  onAcceptResult() {
    try {
      this.renderSnapshot(this._decision.acceptResult(), { addPending: false, addedToMealList: false })
    } catch (error) {
      this.showDecisionError(error)
    }
  },

  onResetDecision() {
    this.renderSnapshot(this._decision.reset(), {
      wheelSelectedId: '',
      addPending: false,
      addedToMealList: false
    })
  },

  onViewDish() {
    const result = this.data.acceptedResult
    const dishId = Number(result && result.dishId)
    if (!Number.isSafeInteger(dishId) || dishId <= 0) {
      wx.showToast({ title: '菜谱信息不完整，请重新选择', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/detail/detail?id=${dishId}` })
  },

  async onAddCookResult() {
    if (this.data.addPending) return
    if (this.data.addedToMealList) {
      wx.switchTab({ url: '/pages/cart/cart' })
      return
    }
    const result = this.data.acceptedResult
    const dishId = Number(result && result.dishId)
    if (!Number.isSafeInteger(dishId) || dishId <= 0) {
      wx.showToast({ title: '菜谱信息不完整，请重新选择', icon: 'none' })
      return
    }

    this.setData({ addPending: true })
    try {
      await mealListService.addDish({ id: dishId })
      this.setData({ addedToMealList: true })
      wx.showToast({ title: `${result.name} 已加入今日清单`, icon: 'none' })
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' })
    } catch (error) {
      wx.showToast({ title: cloudUtil.getErrorMessage(error, '加入失败，请重试'), icon: 'none' })
    } finally {
      this.setData({ addPending: false })
    }
  },

  onManageCandidates() {
    this.setData({ returningFromCandidates: true })
    wx.navigateTo({ url: '/pages/meal-candidates/meal-candidates' })
  },

  async onRetryDishes() {
    if (this.data.phase !== PHASES.SOURCE_SELECTION) return
    try {
      const snapshot = await this._decision.reloadDishes()
      this.renderSnapshot(snapshot)
      if (!snapshot.dishError) wx.showToast({ title: '菜谱已重新加载', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: '菜谱仍无法加载', icon: 'none' })
    }
  },

  startWheel(snapshot, duration) {
    const selected = snapshot.state.pendingResult
    this.renderSnapshot(snapshot, {
      wheelSelectedId: selected ? (selected.id || selected.sourceType) : '',
      wheelDuration: duration,
      wheelSpinToken: this.data.wheelSpinToken + 1
    })
  },

  renderSnapshot(snapshot, extra = {}) {
    const state = snapshot.state
    const selectedSet = new Set(state.selectedSources)
    const unavailableSet = new Set(snapshot.unavailableSources.map(item => item.sourceType))
    const sourceOptions = SOURCE_DEFINITIONS.map(item => ({
      ...item,
      selected: selectedSet.has(item.sourceType),
      available: (snapshot.pools[item.sourceType] || []).length > 0,
      count: (snapshot.pools[item.sourceType] || []).length,
      unavailable: unavailableSet.has(item.sourceType)
    }))
    const isSourceStage = [PHASES.SOURCE_SELECTION, PHASES.SOURCE_SPINNING, PHASES.SOURCE_RESULT].includes(state.phase)
    const sourceWheelItems = snapshot.eligibleSources.map(item => ({
      id: item.sourceType,
      label: item.name,
      color: SOURCE_DEFINITIONS.find(source => source.sourceType === item.sourceType).color
    }))
    const candidateWheelItems = snapshot.activeCandidates.map((item, index) => ({
      id: item.id,
      label: item.name,
      color: index % 2 === 0 ? '#f45b2a' : '#e8794f'
    }))
    const sourceResult = state.sourceResult
    const candidateResult = state.candidateResult
    const acceptedResult = state.acceptedResult
    const activeSourceName = sourceResult ? sourceResult.name : ''
    const unavailableMessage = snapshot.unavailableSources
      .map(item => `${item.name}暂无可用候选`)
      .join('；')
    const selectedNames = sourceOptions.filter(item => item.selected).map(item => item.name)

    this.setData({
      phase: state.phase,
      sourceOptions,
      selectedSummary: selectedNames.length ? `当前参与：${selectedNames.join('、')}` : '尚未选择用餐方式',
      unavailableMessage,
      syncWarning: snapshot.candidateSyncError
        ? cloudUtil.getErrorMessage(snapshot.candidateSyncError, '候选餐单云同步失败，当前使用本地缓存')
        : '',
      dishWarning: snapshot.dishError ? '菜谱加载失败，“自己做”暂时不参与。' : '',
      storageWarning: snapshot.preferenceError ? '今天的用餐方式未能保存，下次进入需要重新选择。' : '',
      wheelItems: isSourceStage ? sourceWheelItems : candidateWheelItems,
      wheelCenterText: isSourceStage ? '选方式' : '选餐单',
      wheelEmptyText: state.selectedSources.length ? '所选方式暂无可用候选' : '请先选择用餐方式',
      canStartSource: state.selectedSources.length > 0 && snapshot.eligibleSources.length > 0,
      isSpinning: [PHASES.SOURCE_SPINNING, PHASES.CANDIDATE_SPINNING].includes(state.phase),
      isSourceStage,
      sourceResult,
      candidateResult,
      acceptedResult,
      activeSourceName,
      candidateActionHint: getCandidateActionHint(candidateResult || acceptedResult),
      ...extra
    })
  },

  showDecisionError(error) {
    const message = error && error.isDecisionError ? error.message : '当前操作未完成，请重试'
    wx.showToast({ title: message, icon: 'none' })
  }
})

function getCandidateActionHint(result) {
  if (!result) return ''
  if (result.sourceType === 'cook') return '可以查看做法，或加入今日饮食清单准备食材'
  return '按这个选择安排今天这一餐'
}
