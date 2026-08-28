const candidateService = require('./meal-candidate-service')
const dishService = require('./dish-service')
const preferenceRepository = require('../repositories/local/meal-decision-preference-repository')
const { buildCandidatePools, evaluateSources } = require('../domain/meal-decision/candidate-filter')
const { drawFromBag, createEmptyBagState } = require('../domain/meal-decision/random-bag')
const { PHASES, createDecisionState, transition } = require('../domain/meal-decision/decision-state')

function createMealDecisionService({ candidates, dishes, preferences, random = Math.random }) {
  let state = createDecisionState([])
  let pools = buildCandidatePools({})
  let sourceBag = createEmptyBagState()
  let candidateBags = {}
  let candidateSyncError = null
  let dishError = null
  let preferenceError = null

  async function initialize() {
    let selectedSources = []
    try {
      selectedSources = preferences.getSelectedSources()
      preferenceError = null
    } catch (error) {
      preferenceError = error
    }

    const [candidateResult, dishResult] = await Promise.all([
      loadCustomCandidates(),
      loadDishes()
    ])
    pools = buildCandidatePools({
      customCandidates: candidateResult.candidates,
      dishes: dishResult.dishes
    })
    candidateSyncError = candidateResult.error
    dishError = dishResult.error
    state = createDecisionState(selectedSources)
    sourceBag = createEmptyBagState()
    candidateBags = {}
    return getSnapshot()
  }

  async function reloadDishes() {
    const result = await loadDishes()
    pools = { ...pools, cook: buildCandidatePools({ dishes: result.dishes }).cook }
    dishError = result.error
    return getSnapshot()
  }

  function setSelectedSources(selectedSources) {
    state = transition(state, { type: 'SET_SOURCES', selectedSources })
    try {
      preferences.saveSelectedSources(state.selectedSources)
      preferenceError = null
    } catch (error) {
      preferenceError = error
    }
    return getSnapshot()
  }

  function startSourceSpin() {
    const evaluation = evaluateSources(state.selectedSources, pools)
    if (state.selectedSources.length === 0) throw createDecisionError('NO_SOURCE_SELECTED', '请至少选择一种用餐方式')
    if (evaluation.eligibleSources.length === 0) throw createDecisionError('NO_ELIGIBLE_SOURCE', '已选方式暂时没有可用餐单')
    const draw = drawFromBag(evaluation.eligibleSources, sourceBag, random)
    sourceBag = draw.state
    state = transition(state, {
      type: 'START_SOURCE_SPIN',
      result: draw.item,
      eligibleSources: evaluation.eligibleSources
    })
    if (evaluation.eligibleSources.length === 1) {
      state = transition(state, { type: 'FINISH_SOURCE_SPIN' })
      state = transition(state, { type: 'CONFIRM_SOURCE' })
      return { ...getSnapshot(), skippedAnimation: true, result: draw.item }
    }
    return { ...getSnapshot(), skippedAnimation: false, result: draw.item }
  }

  function finishSourceSpin() {
    state = transition(state, { type: 'FINISH_SOURCE_SPIN' })
    return getSnapshot()
  }

  function confirmSource() {
    state = transition(state, { type: 'CONFIRM_SOURCE' })
    return getSnapshot()
  }

  function rerollSource() {
    state = transition(state, { type: 'REROLL_SOURCE' })
    return getSnapshot()
  }

  function startCandidateSpin() {
    const sourceType = state.sourceResult && (state.sourceResult.sourceType || state.sourceResult.id)
    const available = Array.isArray(pools[sourceType]) ? pools[sourceType] : []
    if (available.length === 0) throw createDecisionError('NO_CANDIDATE', '当前用餐方式暂时没有候选餐单')
    const draw = drawFromBag(available, candidateBags[sourceType], random)
    candidateBags[sourceType] = draw.state
    state = transition(state, { type: 'START_CANDIDATE_SPIN', result: draw.item, candidates: available })
    if (available.length === 1) {
      state = transition(state, { type: 'FINISH_CANDIDATE_SPIN' })
      return { ...getSnapshot(), skippedAnimation: true, result: draw.item }
    }
    return { ...getSnapshot(), skippedAnimation: false, result: draw.item }
  }

  function finishCandidateSpin() {
    state = transition(state, { type: 'FINISH_CANDIDATE_SPIN' })
    return getSnapshot()
  }

  function rerollCandidate() {
    state = transition(state, { type: 'REROLL_CANDIDATE' })
    return getSnapshot()
  }

  function acceptResult() {
    state = transition(state, { type: 'ACCEPT_RESULT' })
    return getSnapshot()
  }

  function reset() {
    state = transition(state, { type: 'RESET' })
    return getSnapshot()
  }

  function getSnapshot() {
    const evaluation = evaluateSources(state.selectedSources, pools)
    const sourceType = state.sourceResult && (state.sourceResult.sourceType || state.sourceResult.id)
    return {
      state,
      pools,
      eligibleSources: evaluation.eligibleSources,
      unavailableSources: evaluation.unavailableSources,
      activeCandidates: sourceType && Array.isArray(pools[sourceType]) ? pools[sourceType] : [],
      candidateSyncError,
      dishError,
      preferenceError
    }
  }

  async function loadCustomCandidates() {
    try {
      const result = await candidates.loadCandidates()
      return { candidates: result.candidates, error: result.syncError }
    } catch (error) {
      const cached = typeof candidates.getCachedCandidates === 'function' ? candidates.getCachedCandidates() : []
      return { candidates: cached, error }
    }
  }

  async function loadDishes() {
    try {
      const result = await dishes.loadCatalog()
      return { dishes: result.dishes, error: null }
    } catch (error) {
      return { dishes: [], error }
    }
  }

  return {
    initialize,
    reloadDishes,
    setSelectedSources,
    startSourceSpin,
    finishSourceSpin,
    confirmSource,
    rerollSource,
    startCandidateSpin,
    finishCandidateSpin,
    rerollCandidate,
    acceptResult,
    reset,
    getSnapshot
  }
}

function createDecisionError(code, message) {
  const error = new Error(message)
  error.code = code
  error.isDecisionError = true
  return error
}

module.exports = {
  ...createMealDecisionService({
    candidates: candidateService,
    dishes: dishService,
    preferences: preferenceRepository
  }),
  createMealDecisionService,
  createDecisionError,
  PHASES
}
