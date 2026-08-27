/** 菜谱收藏管理：云端为事实来源，本地存储用于缓存和首次迁移。 */
const STORAGE_KEY = 'favorite_food_ids'
const { createVersionedStorage, getBackupData, parseStoredValue } = require('./versioned-storage')
const { createUserDataSync } = require('./user-data-sync')

const storage = createVersionedStorage({
  key: STORAGE_KEY,
  version: 3,
  defaultValue: [],
  migrations: {
    1: migrateFavorites,
    2: value => Array.from(new Set([...migrateFavorites(getBackupData(STORAGE_KEY, 1)), ...migrateFavorites(value)])),
    3: migrateFavorites
  },
  validate: value => Array.isArray(value) && value.every(id => Number.isSafeInteger(id) && id > 0)
})

function migrateFavorites(value) {
  const parsed = parseStoredValue(value)
  return Array.isArray(parsed)
    ? Array.from(new Set(parsed.map(Number).filter(id => Number.isSafeInteger(id) && id > 0)))
    : []
}

function saveFavoriteIds(ids) {
  storage.save(ids)
}

const cloudSync = createUserDataSync({
  kind: 'favorites',
  getLocal: getFavoriteIdsSync,
  saveLocal: saveFavoriteIds,
  migrationVersion: 2
})

function syncFavorites() {
  return cloudSync.sync()
}

async function getFavoriteIds() {
  await syncFavorites()
  return getFavoriteIdsSync()
}

function setFavorite(foodId, isFavorite) {
  const normalizedId = Number(foodId)
  return cloudSync.mutate(ids => isFavorite
    ? Array.from(new Set([...ids, normalizedId]))
    : ids.filter(id => id !== normalizedId))
}

function getFavoriteIdsSync() {
  return storage.get()
}

module.exports = { syncFavorites, getFavoriteIds, getFavoriteIdsSync, setFavorite }
