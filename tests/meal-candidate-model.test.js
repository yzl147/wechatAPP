const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createDefaultCandidates,
  createCandidate,
  updateCandidate,
  getEnabledCandidates,
  isCandidate
} = require('../domain/meal-decision/candidate-model')
const { createDefaultCandidates: createCloudDefaults } = require('../cloudfunctions/manageUserData/candidate-defaults')

test('默认候选包含六个堂食和六个外卖且 ID 稳定唯一', () => {
  const candidates = createDefaultCandidates()

  assert.equal(candidates.filter(item => item.sourceType === 'dine_in').length, 6)
  assert.equal(candidates.filter(item => item.sourceType === 'takeout').length, 6)
  assert.equal(new Set(candidates.map(item => item.id)).size, 12)
  assert.equal(candidates.every(isCandidate), true)
  assert.deepEqual(createCloudDefaults(), candidates)
})

test('自定义候选会清理文本并保持 MVP 固定权重', () => {
  const candidate = createCandidate({ sourceType: 'dine_in', name: ' 牛肉面 ', note: ' 公司东门 ' }, {
    id: 'candidate-1',
    now: 100
  })

  assert.deepEqual(candidate, {
    id: 'candidate-1',
    sourceType: 'dine_in',
    name: '牛肉面',
    note: '公司东门',
    dishId: null,
    enabled: true,
    weight: 1,
    createdAt: 100,
    updatedAt: 100
  })
})

test('候选编辑和启用筛选不修改原对象', () => {
  const original = createCandidate({ sourceType: 'takeout', name: '轻食' }, { id: 'candidate-2', now: 100 })
  const updated = updateCandidate(original, { name: '沙拉', enabled: false }, 200)

  assert.equal(original.name, '轻食')
  assert.equal(updated.name, '沙拉')
  assert.equal(updated.enabled, false)
  assert.equal(updated.updatedAt, 200)
  assert.deepEqual(getEnabledCandidates([original, updated], 'takeout'), [original])
})

test('候选模型拒绝空名称、未知来源和超长备注', () => {
  assert.throws(() => createCandidate({ sourceType: 'cook', name: '番茄炒蛋' }, { id: 'x', now: 1 }))
  assert.throws(() => createCandidate({ sourceType: 'takeout', name: '' }, { id: 'x', now: 1 }))
  assert.throws(() => createCandidate({ sourceType: 'takeout', name: '面食', note: '长'.repeat(81) }, { id: 'x', now: 1 }))
})
