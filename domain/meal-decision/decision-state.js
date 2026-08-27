const { normalizeSelectedSources } = require('./candidate-filter')

const PHASES = {
  SOURCE_SELECTION: 'source_selection',
  SOURCE_SPINNING: 'source_spinning',
  SOURCE_RESULT: 'source_result',
  CANDIDATE_READY: 'candidate_ready',
  CANDIDATE_SPINNING: 'candidate_spinning',
  CANDIDATE_RESULT: 'candidate_result',
  ACCEPTED: 'accepted'
}

function createDecisionState(selectedSources = []) {
  return {
    phase: PHASES.SOURCE_SELECTION,
    selectedSources: normalizeSelectedSources(selectedSources),
    eligibleSources: [],
    sourceResult: null,
    candidateResult: null,
    pendingResult: null,
    acceptedResult: null,
    rerollCount: 0
  }
}

function transition(state, event) {
  if (!state || !event || typeof event.type !== 'string') throw new Error('决策状态或事件不正确')
  switch (event.type) {
    case 'SET_SOURCES':
      assertPhase(state, PHASES.SOURCE_SELECTION)
      return { ...createDecisionState(event.selectedSources), rerollCount: state.rerollCount }
    case 'START_SOURCE_SPIN':
      assertPhase(state, PHASES.SOURCE_SELECTION)
      assertSourceResult(event.result, event.eligibleSources, state.selectedSources)
      return {
        ...state,
        phase: PHASES.SOURCE_SPINNING,
        eligibleSources: [...event.eligibleSources],
        pendingResult: event.result,
        sourceResult: null,
        candidateResult: null,
        acceptedResult: null
      }
    case 'FINISH_SOURCE_SPIN':
      assertPhase(state, PHASES.SOURCE_SPINNING)
      return { ...state, phase: PHASES.SOURCE_RESULT, sourceResult: state.pendingResult, pendingResult: null }
    case 'CONFIRM_SOURCE':
      assertPhase(state, PHASES.SOURCE_RESULT)
      return { ...state, phase: PHASES.CANDIDATE_READY }
    case 'REROLL_SOURCE':
      assertPhase(state, PHASES.SOURCE_RESULT)
      return {
        ...state,
        phase: PHASES.SOURCE_SELECTION,
        sourceResult: null,
        pendingResult: null,
        rerollCount: state.rerollCount + 1
      }
    case 'START_CANDIDATE_SPIN':
      assertPhase(state, PHASES.CANDIDATE_READY)
      assertCandidateResult(event.result, state.sourceResult, event.candidates)
      return { ...state, phase: PHASES.CANDIDATE_SPINNING, pendingResult: event.result, candidateResult: null }
    case 'FINISH_CANDIDATE_SPIN':
      assertPhase(state, PHASES.CANDIDATE_SPINNING)
      return { ...state, phase: PHASES.CANDIDATE_RESULT, candidateResult: state.pendingResult, pendingResult: null }
    case 'REROLL_CANDIDATE':
      assertPhase(state, PHASES.CANDIDATE_RESULT)
      return {
        ...state,
        phase: PHASES.CANDIDATE_READY,
        candidateResult: null,
        rerollCount: state.rerollCount + 1
      }
    case 'ACCEPT_RESULT':
      assertPhase(state, PHASES.CANDIDATE_RESULT)
      return { ...state, phase: PHASES.ACCEPTED, acceptedResult: state.candidateResult }
    case 'RESET':
      return createDecisionState(event.selectedSources || state.selectedSources)
    default:
      throw new Error('未知的决策事件')
  }
}

function assertPhase(state, expected) {
  if (state.phase !== expected) throw new Error(`当前阶段不能执行该操作：${state.phase}`)
}

function assertSourceResult(result, eligibleSources, selectedSources) {
  const ids = Array.isArray(eligibleSources) ? eligibleSources.map(item => item.sourceType || item.id) : []
  if (ids.some(id => !selectedSources.includes(id)) || !result || !ids.includes(result.sourceType || result.id)) {
    throw new Error('用餐方式结果不在已选择的有效候选中')
  }
}

function assertCandidateResult(result, sourceResult, candidates) {
  const expectedSource = sourceResult && (sourceResult.sourceType || sourceResult.id)
  const candidateIds = Array.isArray(candidates) ? candidates.map(item => item.id) : []
  if (!result || result.sourceType !== expectedSource || !candidateIds.includes(result.id)) {
    throw new Error('餐单结果不在已确认用餐方式的有效候选中')
  }
}

module.exports = { PHASES, createDecisionState, transition }
