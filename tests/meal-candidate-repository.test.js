const test = require('node:test')
const assert = require('node:assert/strict')
const { createDefaultCandidates } = require('../domain/meal-decision/candidate-model')
const { createMealCandidateRepository } = require('../repositories/user/meal-candidate-repository')

function createHarness(initial = createDefaultCandidates()) {
  let data = initial
  const gateway = {
    async sync() { return data },
    async mutate(updater) {
      data = updater(data)
      return data
    }
  }
  const repository = createMealCandidateRepository({
    gateway,
    getLocal: () => data,
    now: () => 1000,
    random: () => 0.123456
  })
  return { repository, getData: () => data }
}

test('候选 repository 支持新增、编辑、关闭和删除', async () => {
  const { repository, getData } = createHarness([])
  const added = await repository.addCandidate({ sourceType: 'dine_in', name: '牛肉面', note: '公司东门' })

  assert.equal(added.id, 'candidate-1000-123456')
  assert.equal(getData().length, 1)
  await repository.editCandidate(added.id, { name: '兰州牛肉面' })
  assert.equal(getData()[0].name, '兰州牛肉面')
  await repository.setCandidateEnabled(added.id, false)
  assert.deepEqual(repository.listEnabledCached('dine_in'), [])
  await repository.removeCandidate(added.id)
  assert.deepEqual(getData(), [])
})

test('恢复默认候选不会覆盖已有的同 ID 自定义内容', async () => {
  const changed = { ...createDefaultCandidates()[0], name: '一楼食堂', updatedAt: 200 }
  const { repository, getData } = createHarness([changed])

  await repository.restoreDefaultCandidates()

  assert.equal(getData().length, 12)
  assert.equal(getData().find(item => item.id === changed.id).name, '一楼食堂')
})
