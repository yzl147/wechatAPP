const test = require('node:test')
const assert = require('node:assert/strict')
const { PHASES, createDecisionState, transition } = require('../domain/meal-decision/decision-state')

const dineIn = { id: 'dine_in', sourceType: 'dine_in', name: '堂食' }
const takeout = { id: 'takeout', sourceType: 'takeout', name: '外卖' }
const noodles = { id: 'candidate-1', sourceType: 'dine_in', name: '牛肉面' }

test('两阶段状态机按选择来源、确认来源、选择餐单和接受结果推进', () => {
  let state = createDecisionState(['dine_in', 'takeout'])
  state = transition(state, { type: 'START_SOURCE_SPIN', eligibleSources: [dineIn, takeout], result: dineIn })
  assert.equal(state.phase, PHASES.SOURCE_SPINNING)
  assert.equal(state.pendingResult, dineIn)

  state = transition(state, { type: 'FINISH_SOURCE_SPIN' })
  assert.equal(state.phase, PHASES.SOURCE_RESULT)
  assert.equal(state.sourceResult, dineIn)

  state = transition(state, { type: 'CONFIRM_SOURCE' })
  state = transition(state, { type: 'START_CANDIDATE_SPIN', candidates: [noodles], result: noodles })
  assert.equal(state.phase, PHASES.CANDIDATE_SPINNING)

  state = transition(state, { type: 'FINISH_CANDIDATE_SPIN' })
  state = transition(state, { type: 'ACCEPT_RESULT' })
  assert.equal(state.phase, PHASES.ACCEPTED)
  assert.equal(state.acceptedResult, noodles)
})

test('转动开始时结果已经确定且转动中拒绝快速重复启动', () => {
  const spinning = transition(createDecisionState(['dine_in']), {
    type: 'START_SOURCE_SPIN', eligibleSources: [dineIn], result: dineIn
  })

  assert.equal(spinning.pendingResult, dineIn)
  assert.throws(() => transition(spinning, {
    type: 'START_SOURCE_SPIN', eligibleSources: [dineIn], result: dineIn
  }))
})

test('状态机拒绝未进入有效池的来源和跨来源餐单', () => {
  assert.throws(() => transition(createDecisionState(['dine_in']), {
    type: 'START_SOURCE_SPIN', eligibleSources: [dineIn], result: takeout
  }))
  assert.throws(() => transition(createDecisionState(['dine_in']), {
    type: 'START_SOURCE_SPIN', eligibleSources: [dineIn, takeout], result: takeout
  }))

  let state = transition(createDecisionState(['dine_in']), {
    type: 'START_SOURCE_SPIN', eligibleSources: [dineIn], result: dineIn
  })
  state = transition(state, { type: 'FINISH_SOURCE_SPIN' })
  state = transition(state, { type: 'CONFIRM_SOURCE' })
  assert.throws(() => transition(state, {
    type: 'START_CANDIDATE_SPIN',
    candidates: [{ id: 'takeout-1', sourceType: 'takeout', name: '黄焖鸡' }],
    result: { id: 'takeout-1', sourceType: 'takeout', name: '黄焖鸡' }
  }))
  assert.throws(() => transition(state, {
    type: 'START_CANDIDATE_SPIN', candidates: [noodles], result: { ...noodles, id: 'unknown' }
  }))
})

test('重新抽取会保留来源选择并累计重转次数', () => {
  let state = transition(createDecisionState(['dine_in']), {
    type: 'START_SOURCE_SPIN', eligibleSources: [dineIn], result: dineIn
  })
  state = transition(state, { type: 'FINISH_SOURCE_SPIN' })
  state = transition(state, { type: 'REROLL_SOURCE' })
  assert.equal(state.phase, PHASES.SOURCE_SELECTION)
  assert.deepEqual(state.selectedSources, ['dine_in'])
  assert.equal(state.rerollCount, 1)

  state = transition(state, { type: 'START_SOURCE_SPIN', eligibleSources: [dineIn], result: dineIn })
  state = transition(state, { type: 'FINISH_SOURCE_SPIN' })
  state = transition(state, { type: 'CONFIRM_SOURCE' })
  state = transition(state, { type: 'START_CANDIDATE_SPIN', candidates: [noodles], result: noodles })
  state = transition(state, { type: 'FINISH_CANDIDATE_SPIN' })
  state = transition(state, { type: 'REROLL_CANDIDATE' })
  assert.equal(state.phase, PHASES.CANDIDATE_READY)
  assert.equal(state.rerollCount, 2)
})
