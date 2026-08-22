/** 菜谱收藏管理：收藏数据保存在当前设备。 */
const STORAGE_KEY = 'favorite_food_ids'

function getFavoriteIds() {
  return Promise.resolve(getFavoriteIdsSync())
}

function setFavorite(foodId, isFavorite) {
  const ids = getFavoriteIdsSync()
  const nextIds = isFavorite
    ? Array.from(new Set([...ids, foodId]))
    : ids.filter(id => id !== foodId)
  wx.setStorageSync(STORAGE_KEY, nextIds)
  return Promise.resolve(nextIds)
}

function getFavoriteIdsSync() {
  const ids = wx.getStorageSync(STORAGE_KEY)
  return Array.isArray(ids) ? ids : []
}

module.exports = { getFavoriteIds, setFavorite }
