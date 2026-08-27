const test = require('node:test')
const assert = require('node:assert/strict')

function installWx(handler) {
  const storage = new Map()
  global.wx = {
    getStorageSync(key) { return storage.has(key) ? storage.get(key) : '' },
    setStorageSync(key, value) { storage.set(key, value) },
    showToast() {},
    cloud: { callFunction: handler }
  }
  return storage
}

function reloadSyncModule() {
  const path = require.resolve('../utils/user-data-sync')
  delete require.cache[path]
  return require('../utils/user-data-sync')
}

test.afterEach(() => { delete global.wx })

test('首次同步上传本地数据并在后续改为云端读取', async () => {
  const actions = []
  installWx(async options => {
    actions.push(options.data.action)
    return { result: { code: 0, data: { data: options.data.data || [{ id: 'cloud' }], revision: actions.length }, requestId: 'req' } }
  })
  let local = [{ id: 'local' }]
  const { createUserDataSync } = reloadSyncModule()
  const repository = createUserDataSync({ kind: 'inventory', getLocal: () => local, saveLocal: value => { local = value } })

  await repository.sync()
  await repository.sync()

  assert.deepEqual(actions, ['migrate', 'get'])
  assert.deepEqual(local, [{ id: 'cloud' }])
})

test('修订冲突时刷新云端数据并将同一操作重试一次', async () => {
  const replaceRequests = []
  let callIndex = 0
  installWx(async options => {
    callIndex += 1
    if (options.data.action === 'migrate') {
      return { result: { code: 0, data: { data: [{ id: 'base' }], revision: 1 } } }
    }
    replaceRequests.push(options.data)
    if (replaceRequests.length === 1) {
      return { result: { code: 40901, message: '冲突', data: { data: [{ id: 'cloud-new' }], revision: 2 } } }
    }
    return { result: { code: 0, data: { data: options.data.data, revision: 3 } } }
  })
  let local = []
  const { createUserDataSync } = reloadSyncModule()
  const repository = createUserDataSync({ kind: 'inventory', getLocal: () => local, saveLocal: value => { local = value } })
  await repository.mutate(items => items.concat({ id: 'my-change' }))

  assert.equal(replaceRequests.length, 2)
  assert.equal(replaceRequests[1].expectedRevision, 2)
  assert.deepEqual(local.map(item => item.id), ['cloud-new', 'my-change'])
})

test('网络失败时拒绝写入且不改变本地缓存', async () => {
  installWx(async () => { throw new Error('offline') })
  const original = [{ id: 'cached' }]
  let local = original
  const { createUserDataSync } = reloadSyncModule()
  const repository = createUserDataSync({ kind: 'inventory', getLocal: () => local, saveLocal: value => { local = value } })

  await assert.rejects(repository.mutate(items => items.concat({ id: 'unsaved' })), error => error.code === 'CLOUD_CALL_FAILED')

  assert.strictEqual(local, original)
  assert.deepEqual(local, [{ id: 'cached' }])
})

test('迁移版本提升后使用新标识再次合并本地数据', async () => {
  const requests = []
  installWx(async options => {
    requests.push(options.data)
    return { result: { code: 0, data: { data: options.data.data, revision: requests.length } } }
  })
  let local = [2]
  const { createUserDataSync } = reloadSyncModule()

  await createUserDataSync({ kind: 'favorites', getLocal: () => local, saveLocal: value => { local = value } }).sync()
  local = [2, 13]
  await createUserDataSync({ kind: 'favorites', getLocal: () => local, saveLocal: value => { local = value }, migrationVersion: 2 }).sync()

  assert.deepEqual(requests.map(item => item.action), ['migrate', 'migrate'])
  assert.notEqual(requests[0].migrationId, requests[1].migrationId)
  assert.deepEqual(requests[1].data, [2, 13])
})
