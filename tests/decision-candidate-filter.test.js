const test = require('node:test')
const assert = require('node:assert/strict')
const {
  buildCandidatePools,
  evaluateSources,
  normalizeSelectedSources
} = require('../domain/meal-decision/candidate-filter')

const customCandidates = [
  { id: 'dine-1', sourceType: 'dine_in', name: '牛肉面', enabled: true },
  { id: 'dine-off', sourceType: 'dine_in', name: '火锅', enabled: false },
  { id: 'takeout-1', sourceType: 'takeout', name: '黄焖鸡', enabled: true }
]
const dishes = [{ id: 2, name: '麻婆豆腐' }, { id: 13, name: '番茄炒蛋' }]

test('候选池只包含启用的自定义候选并把菜谱转换为自己做候选', () => {
  const pools = buildCandidatePools({ customCandidates, dishes })

  assert.deepEqual(pools.dine_in.map(item => item.id), ['dine-1'])
  assert.deepEqual(pools.takeout.map(item => item.id), ['takeout-1'])
  assert.deepEqual(pools.cook.map(item => item.id), ['dish-2', 'dish-13'])
  assert.deepEqual(pools.cook[0], {
    id: 'dish-2', sourceType: 'cook', name: '麻婆豆腐', note: '', dishId: 2, enabled: true, weight: 1
  })
})

test('三个来源全部选中时只有存在候选的来源能够参与', () => {
  const pools = buildCandidatePools({ customCandidates: customCandidates.filter(item => item.sourceType !== 'takeout'), dishes })
  const result = evaluateSources(['dine_in', 'takeout', 'cook'], pools)

  assert.deepEqual(result.eligibleSources.map(item => item.sourceType), ['dine_in', 'cook'])
  assert.deepEqual(result.unavailableSources.map(item => item.sourceType), ['takeout'])
})

test('未勾选的来源即使存在候选也不会进入第一阶段', () => {
  const pools = buildCandidatePools({ customCandidates, dishes })
  const result = evaluateSources(['dine_in', 'takeout'], pools)

  assert.deepEqual(result.eligibleSources.map(item => item.sourceType), ['dine_in', 'takeout'])
  assert.equal(result.eligibleSources.some(item => item.sourceType === 'cook'), false)
})

test('只选自己做、全部未选和菜谱加载失败分别得到明确结果', () => {
  const pools = buildCandidatePools({ customCandidates, dishes })
  assert.deepEqual(evaluateSources(['cook'], pools).eligibleSources.map(item => item.sourceType), ['cook'])
  assert.deepEqual(evaluateSources([], pools).eligibleSources, [])

  const noDishes = buildCandidatePools({ customCandidates, dishes: [] })
  const result = evaluateSources(['dine_in', 'cook'], noDishes)
  assert.deepEqual(result.eligibleSources.map(item => item.sourceType), ['dine_in'])
  assert.deepEqual(result.unavailableSources.map(item => item.sourceType), ['cook'])
})

test('来源选择会去重并忽略未知值', () => {
  assert.deepEqual(normalizeSelectedSources(['takeout', 'unknown', 'takeout', 'cook']), ['takeout', 'cook'])
})
