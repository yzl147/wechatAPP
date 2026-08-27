function cloneDefault(value) {
  if (Array.isArray(value)) return value.map(item => cloneDefault(item))
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((result, key) => {
      result[key] = cloneDefault(value[key])
      return result
    }, {})
  }
  return value
}

function isEnvelope(value) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Number.isInteger(value.schemaVersion) && Object.prototype.hasOwnProperty.call(value, 'data')
}

function parseStoredValue(value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch (error) {
    return value
  }
}

function getBackupData(key, version) {
  const backup = wx.getStorageSync(`${key}__backup_before_v${version}`)
  return backup && typeof backup === 'object' && Object.prototype.hasOwnProperty.call(backup, 'data')
    ? parseStoredValue(backup.data)
    : undefined
}

function createVersionedStorage({ key, version, defaultValue, migrations = {}, validate }) {
  const backupKey = `${key}__backup_before_v${version}`

  function notify(title) {
    if (typeof wx !== 'undefined' && typeof wx.showToast === 'function') wx.showToast({ title, icon: 'none' })
  }

  function save(data) {
    if (!validate(data)) throw new Error(`Invalid data for ${key}`)
    try {
      wx.setStorageSync(key, { schemaVersion: version, data, updatedAt: Date.now() })
      return data
    } catch (error) {
      console.error('本地数据保存失败', key, error && error.message)
      notify('数据保存失败，请检查存储空间')
      throw error
    }
  }

  function backup(raw) {
    try {
      wx.setStorageSync(backupKey, { createdAt: Date.now(), data: raw })
      return true
    } catch (error) {
      console.error('本地数据备份失败', key, error && error.message)
      return false
    }
  }

  function get() {
    const raw = wx.getStorageSync(key)
    if (raw === undefined || raw === null || raw === '') return cloneDefault(defaultValue)

    try {
      const envelope = isEnvelope(raw) ? raw : { schemaVersion: 0, data: raw }
      if (envelope.schemaVersion > version) throw new Error(`Unsupported schema version for ${key}`)
      let currentVersion = envelope.schemaVersion
      let data = envelope.data
      while (currentVersion < version) {
        const nextVersion = currentVersion + 1
        const migrate = migrations[nextVersion]
        if (typeof migrate !== 'function') throw new Error(`Missing migration ${key} v${nextVersion}`)
        data = migrate(data)
        currentVersion = nextVersion
      }
      if (!validate(data)) throw new Error(`Invalid data for ${key}`)
      if (envelope.schemaVersion < version) {
        if (!backup(raw)) {
          notify('数据升级暂未保存，原数据仍保留')
          return data
        }
        try {
          save(data)
        } catch (error) {
          return data
        }
      }
      return data
    } catch (error) {
      const preserved = backup(raw)
      console.error('本地数据读取失败', key, error && error.message)
      notify(preserved ? '本地数据异常，已保留备份' : '本地数据异常，原数据仍保留')
      return cloneDefault(defaultValue)
    }
  }

  return { get, save, backupKey }
}

module.exports = { createVersionedStorage, isEnvelope, parseStoredValue, getBackupData }
