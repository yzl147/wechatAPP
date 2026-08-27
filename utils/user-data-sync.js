const cloudUtil = require('./cloud')
const { createVersionedStorage } = require('./versioned-storage')

const metaStorage = createVersionedStorage({
  key: 'user_data_sync_meta',
  version: 1,
  defaultValue: {},
  migrations: { 1: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {} },
  validate: value => value && typeof value === 'object' && !Array.isArray(value)
})

function createMigrationId(kind, migrationVersion) {
  return `${kind}_v${migrationVersion}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
}

function createUserDataSync({ kind, getLocal, saveLocal, migrationVersion = 1 }) {
  let syncPromise = null

  function getMeta() {
    const all = metaStorage.get()
    const saved = all[kind] || { migrationId: '', revision: 0, migrated: false }
    return {
      ...saved,
      migrationVersion: saved.migrationVersion || (saved.migrated ? 1 : 0)
    }
  }

  function saveMeta(meta) {
    const all = metaStorage.get()
    metaStorage.save({ ...all, [kind]: meta })
  }

  async function runSync() {
    const meta = getMeta()
    const needsMigration = !meta.migrated || meta.migrationVersion < migrationVersion
    const action = needsMigration ? 'migrate' : 'get'
    const migrationId = needsMigration
      ? (meta.migrationVersion === migrationVersion && meta.migrationId
          ? meta.migrationId
          : createMigrationId(kind, migrationVersion))
      : meta.migrationId
    if (needsMigration) saveMeta({ ...meta, migrationId, migrationVersion })
    const result = await cloudUtil.callFunction('manageUserData', action === 'get'
      ? { action, kind }
      : { action, kind, data: getLocal(), migrationId })
    const payload = result.data
    saveLocal(payload.data)
    saveMeta({ migrationId, migrationVersion, revision: payload.revision, migrated: true, syncedAt: Date.now() })
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
