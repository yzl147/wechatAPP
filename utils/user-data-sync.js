const cloudUtil = require('./cloud')
const { createVersionedStorage } = require('./versioned-storage')

const metaStorage = createVersionedStorage({
  key: 'user_data_sync_meta',
  version: 1,
  defaultValue: {},
  migrations: { 1: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {} },
  validate: value => value && typeof value === 'object' && !Array.isArray(value)
})

function createMigrationId(kind) {
  return `${kind}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
}

function createUserDataSync({ kind, getLocal, saveLocal }) {
  let syncPromise = null

  function getMeta() {
    const all = metaStorage.get()
    return all[kind] || { migrationId: '', revision: 0, migrated: false }
  }

  function saveMeta(meta) {
    const all = metaStorage.get()
    metaStorage.save({ ...all, [kind]: meta })
  }

  async function runSync() {
    const meta = getMeta()
    const action = meta.migrated ? 'get' : 'migrate'
    const migrationId = meta.migrationId || createMigrationId(kind)
    if (!meta.migrationId) saveMeta({ ...meta, migrationId })
    const result = await cloudUtil.callFunction('manageUserData', action === 'get'
      ? { action, kind }
      : { action, kind, data: getLocal(), migrationId })
    const payload = result.data
    saveLocal(payload.data)
    saveMeta({ migrationId, revision: payload.revision, migrated: true, syncedAt: Date.now() })
    return payload.data
  }

  function sync() {
    if (!syncPromise) syncPromise = runSync().finally(() => { syncPromise = null })
    return syncPromise
  }

  async function mutate(updater) {
    await sync()
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const current = getLocal()
      const next = updater(current)
      const meta = getMeta()
      try {
        const result = await cloudUtil.callFunction('manageUserData', {
          action: 'replace',
          kind,
          data: next,
          expectedRevision: meta.revision
        })
        saveLocal(result.data.data)
        saveMeta({ ...meta, revision: result.data.revision, migrated: true, syncedAt: Date.now() })
        return result.data.data
      } catch (error) {
        if (error.code !== 40901 || !error.details || attempt > 0) throw error
        saveLocal(error.details.data)
        saveMeta({ ...meta, revision: error.details.revision, migrated: true, syncedAt: Date.now() })
      }
    }
    throw new Error('数据同步失败')
  }

  return { sync, mutate }
}

module.exports = { createUserDataSync }
