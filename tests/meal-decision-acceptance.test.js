const test = require('node:test')
const assert = require('node:assert/strict')
const { createMealDecisionService, PHASES } = require('../services/meal-decision-service')

const SOURCE_COMBINATIONS = [
  ['dine_in'],
  ['takeout'],
  ['cook'],
  ['dine_in', 'takeout'],
  ['dine_in', 'cook'],
  ['takeout', 'cook'],
  ['dine_in', 'takeout', 'cook']
]

const customCandidates = [
  { id: 'dine-one', sourceType: 'dine_in', name: '牛肉面', enabled: true },
  { id: 'dine-two', sourceType: 'dine_in', name: '公司食堂', enabled: true },
  { id: 'takeout-one', sourceType: 'takeout', name: '麻辣烫', enabled: true },
  { id: 'takeout-two', sourceType: 'takeout', name: '轻食', enabled: true }
]

const dishes = [
  { id: 1, name: '番茄炒蛋' },
  { id: 2, name: '麻婆豆腐' }
]

function createService(selectedSources, random = createDeterministicRandom()) {
  return createMealDecisionService({
    candidates: {
      async loadCandidates() { return { candidates: customCandidates, syncError: null } },
      getCachedCandidates() { return customCandidates }
    },
    dishes: {
      async loadCatalog() { return { dishes } }
    },
    preferences: {
      getSelectedSources() { return selectedSources },
      saveSelectedSources() {}
    },
    random
  })
}

function createDeterministicRandom() {
  const values = [0.12, 0.87, 0.35, 0.68, 0.04, 0.51]
  let index = 0
  return () => {
    const value = values[index % values.length]
    index += 1
    return value
  }
}

test('七种非空来源组合连续抽取都不会得到未选择来源', async () => {
  for (const selectedSources of SOURCE_COMBINATIONS) {
    const service = createService(selectedSources)
    await service.initialize()

    for (let drawIndex = 0; drawIndex < 18; drawIndex += 1) {
      const draw = service.startSourceSpin()
      assert.ok(selectedSources.includes(draw.result.sourceType), `${selectedSources.join('+')} 抽到了 ${draw.result.sourceType}`)
      if (draw.skippedAnimation) {
        assert.equal(draw.state.phase, PHASES.CANDIDATE_READY)
        service.reset()
      } else {
        service.finishSourceSpin()
        service.rerollSource()
      }
    }
  }
})

test('第一阶段结果决定第二阶段候选池且三个来源均不串池', async () => {
  for (const sourceType of ['dine_in', 'takeout', 'cook']) {
    const service = createService([sourceType])
    await service.initialize()

    const sourceResult = service.startSourceSpin()
    assert.equal(sourceResult.state.phase, PHASES.CANDIDATE_READY)
    assert.equal(sourceResult.result.sourceType, sourceType)

    const candidateResult = service.startCandidateSpin()
    assert.equal(candidateResult.result.sourceType, sourceType)
    assert.ok(candidateResult.activeCandidates.some(item => item.id === candidateResult.result.id))
    if (!candidateResult.skippedAnimation) service.finishCandidateSpin()
    const accepted = service.acceptResult()
    assert.equal(accepted.state.acceptedResult.sourceType, sourceType)
  }
})

test('具体餐单立即重转不会重复上一次结果', async () => {
  const service = createService(['dine_in'], () => 0)
  await service.initialize()
  service.startSourceSpin()

  const first = service.startCandidateSpin()
  service.finishCandidateSpin()
  service.rerollCandidate()
  const second = service.startCandidateSpin()

  assert.notEqual(second.result.id, first.result.id)
})
