/** 菜谱收藏管理：收藏数据保存在当前设备。 */
const STORAGE_KEY = 'favorite_food_ids'
const { createVersionedStorage, getBackupData, parseStoredValue } = require('./versioned-storage')

const storage = createVersionedStorage({
  key: STORAGE_KEY,
  version: 2,
  defaultValue: [],
  migrations: {
    1: migrateFavorites,
    2: value => Array.from(new Set([...migrateFavorites(getBackupData(STORAGE_KEY, 1)), ...migrateFavorites(value)]))
  },
  validate: value => Array.isArray(value) && value.every(id => Number.isSafeInteger(id) && id > 0)
})

function migrateFavorites(value) {
  const parsed = parseStoredValue(value)
  return Array.isArray(parsed)
    ? Array.from(new Set(parsed.map(Number).filter(id => Number.isSafeInteger(id) && id > 0)))
    : []
}

function getFavoriteIds() {
  return Promise.resolve(getFavoriteIdsSync())
}

function setFavorite(foodId, isFavorite) {
  const ids = getFavoriteIdsSync()
  const nextIds = isFavorite
    ? Array.from(new Set([...ids, foodId]))
    : ids.filter(id => id !== foodId)
  storage.save(nextIds)
  return Promise.resolve(nextIds)
}

function getFavoriteIdsSync() {
  return storage.get()
}

module.exports = { getFavoriteIds, setFavorite }
