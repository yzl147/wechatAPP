const test = require('node:test')
const assert = require('node:assert/strict')
const { createMealDecisionService, PHASES } = require('../services/meal-decision-service')

const customCandidates = [
  { id: 'dine-one', sourceType: 'dine_in', name: '牛肉面', enabled: true },
  { id: 'dine-two', sourceType: 'dine_in', name: '食堂', enabled: true },
  { id: 'takeout-one', sourceType: 'takeout', name: '麻辣烫', enabled: true },
  { id: 'takeout-two', sourceType: 'takeout', name: '轻食', enabled: true }
]

function createHarness(options = {}) {
  let selectedSources = options.selectedSources || []
  const savedSelections = []
  const service = createMealDecisionService({
    candidates: {
      async loadCandidates() {
        return { candidates: options.candidates || customCandidates, syncError: options.candidateError || null }
      },
      getCachedCandidates() { return options.candidates || customCandidates }
    },
    dishes: {
      async loadCatalog() {
        if (options.dishError) throw options.dishError
        return { dishes: options.dishes || [{ id: 1, name: '番茄炒蛋' }] }
      }
    },
    preferences: {
      getSelectedSources() { return selectedSources },
      saveSelectedSources(value) {
        selectedSources = value
        savedSelections.push(value)
      }
    },
    random: options.random || (() => 0)
  })
  return { service, savedSelections }
}

test('菜谱加载失败只排除自己做，不影响堂食和外卖', async () => {
  const dishError = new Error('dish offline')
  const { service } = createHarness({
    selectedSources: ['dine_in', 'takeout', 'cook'],
    dishError
  })

  const snapshot = await service.initialize()

  assert.deepEqual(snapshot.eligibleSources.map(item => item.sourceType), ['dine_in', 'takeout'])
  assert.deepEqual(snapshot.unavailableSources.map(item => item.sourceType), ['cook'])
  assert.equal(snapshot.dishError, dishError)
})

test('来源选择由服务写入当天偏好并立即重新计算有效来源', async () => {
  const { service, savedSelections } = createHarness()
  await service.initialize()

  const snapshot = service.setSelectedSources(['takeout', 'cook'])

  assert.deepEqual(savedSelections, [['takeout', 'cook']])
  assert.deepEqual(snapshot.eligibleSources.map(item => item.sourceType), ['takeout', 'cook'])
})

test('只有一个有效来源时跳过第一阶段动画直接进入餐单准备', async () => {
  const { service } = createHarness({ selectedSources: ['cook'] })
  await service.initialize()

  const result = service.startSourceSpin()

  assert.equal(result.skippedAnimation, true)
  assert.equal(result.result.sourceType, 'cook')
  assert.equal(result.state.phase, PHASES.CANDIDATE_READY)
  assert.equal(result.activeCandidates[0].name, '番茄炒蛋')
})

test('服务按状态机完成两阶段抽取和最终确认', async () => {
  const { service } = createHarness({ selectedSources: ['dine_in', 'takeout'] })
  await service.initialize()

  const sourceStart = service.startSourceSpin()
  assert.equal(sourceStart.state.phase, PHASES.SOURCE_SPINNING)
  assert.ok(sourceStart.state.pendingResult)

  service.finishSourceSpin()
  const candidateReady = service.confirmSource()
  assert.equal(candidateReady.state.phase, PHASES.CANDIDATE_READY)
  assert.ok(candidateReady.activeCandidates.length > 1)

  const candidateStart = service.startCandidateSpin()
  assert.equal(candidateStart.state.phase, PHASES.CANDIDATE_SPINNING)
  service.finishCandidateSpin()
  const accepted = service.acceptResult()

  assert.equal(accepted.state.phase, PHASES.ACCEPTED)
  assert.equal(accepted.state.acceptedResult.sourceType, accepted.state.sourceResult.sourceType)
})

test('未选择来源和所选来源无候选时给出稳定业务错误', async () => {
  const emptyHarness = createHarness({ candidates: [], dishes: [] })
  await emptyHarness.service.initialize()
  assert.throws(() => emptyHarness.service.startSourceSpin(), error => error.code === 'NO_SOURCE_SELECTED')

  emptyHarness.service.setSelectedSources(['takeout'])
  assert.throws(() => emptyHarness.service.startSourceSpin(), error => error.code === 'NO_ELIGIBLE_SOURCE')
})
