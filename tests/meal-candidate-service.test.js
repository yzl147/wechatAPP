const test = require('node:test')
const assert = require('node:assert/strict')
const { createMealCandidateService } = require('../services/meal-candidate-service')

function createHarness(options = {}) {
  let cached = options.initial || []
  const calls = []
  const repository = {
    async syncCandidates() {
      calls.push(['sync'])
      if (options.syncError) throw options.syncError
    },
    listCached() { return cached },
    async addCandidate(input) {
      calls.push(['add', input])
      cached = [{ id: 'new', ...input }, ...cached]
    },
    async editCandidate(id, changes) {
      calls.push(['edit', id, changes])
      let updated = null
      cached = cached.map(item => {
        if (item.id !== id) return item
        updated = { ...item, ...changes }
        return updated
      })
      return updated
    },
    async setCandidateEnabled(id, enabled) {
      calls.push(['enable', id, enabled])
      const item = cached.find(candidate => candidate.id === id)
      if (!item) return null
      item.enabled = enabled
      return item
    },
    async removeCandidate(id) {
      calls.push(['remove', id])
      cached = cached.filter(item => item.id !== id)
    },
    async restoreDefaultCandidates() {
      calls.push(['restore'])
      cached = cached.concat({ id: 'default', name: '默认候选' })
    }
  }
  return {
    service: createMealCandidateService(repository),
    calls
  }
}

test('候选服务同步成功后返回最新缓存', async () => {
  const cached = [{ id: 'one', name: '牛肉面' }]
  const { service, calls } = createHarness({ initial: cached })

  const result = await service.loadCandidates()

  assert.deepEqual(result, { candidates: cached, syncError: null })
  assert.deepEqual(calls, [['sync']])
})

test('候选服务同步失败时保留本地缓存并返回错误', async () => {
  const syncError = new Error('offline')
  const cached = [{ id: 'one', name: '牛肉面' }]
  const { service } = createHarness({ initial: cached, syncError })

  const result = await service.loadCandidates()

  assert.equal(result.syncError, syncError)
  assert.deepEqual(result.candidates, cached)
})

test('候选服务通过 repository 完成增改、启停、删除和恢复默认', async () => {
  const { service, calls } = createHarness({
    initial: [{ id: 'one', name: '牛肉面', enabled: true }]
  })

  await service.addCandidate({ sourceType: 'takeout', name: '盖浇饭' })
  const edited = await service.editCandidate('one', { name: '兰州牛肉面' })
  const disabled = await service.setCandidateEnabled('one', false)
  await service.removeCandidate('new')
  const restored = await service.restoreDefaultCandidates()

  assert.equal(edited.updated.name, '兰州牛肉面')
  assert.equal(disabled.updated.enabled, false)
  assert.deepEqual(restored.map(item => item.id), ['one', 'default'])
  assert.deepEqual(calls, [
    ['add', { sourceType: 'takeout', name: '盖浇饭' }],
    ['edit', 'one', { name: '兰州牛肉面' }],
    ['enable', 'one', false],
    ['remove', 'new'],
    ['restore']
  ])
})
