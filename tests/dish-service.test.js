const test = require('node:test')
const assert = require('node:assert/strict')
const { createDishService, applyFavoriteState } = require('../services/dish-service')

function createFavorites(overrides = {}) {
  return {
    async getFavoriteIds() { return [2] },
    getFavoriteIdsSync() { return [13] },
    async setFavorite(id, isFavorite) { return isFavorite ? [Number(id)] : [] },
    ...overrides
  }
}

test('菜谱 service 加载列表并合并收藏状态', async () => {
  const service = createDishService({
    dishes: { async listDishes() { return [{ id: 1 }, { id: 2 }] } },
    favorites: createFavorites()
  })
  const result = await service.loadCatalog()

  assert.equal(result.syncError, null)
  assert.deepEqual(result.dishes, [{ id: 1, isFavorite: false }, { id: 2, isFavorite: true }])
})

test('收藏同步失败时 service 使用本地缓存且不影响菜谱详情', async () => {
  const syncError = Object.assign(new Error('offline'), { code: 'CLOUD_CALL_FAILED' })
  const service = createDishService({
    dishes: { async getDishDetail() { return { id: 13, name: '麻婆豆腐' } } },
    favorites: createFavorites({ async getFavoriteIds() { throw syncError } })
  })
  const result = await service.loadDetail(13)

  assert.equal(result.syncError, syncError)
  assert.equal(result.dish.isFavorite, true)
})

test('菜谱请求失败时 service 保留原错误供页面显示错误态', async () => {
  const dishError = new Error('dish unavailable')
  const service = createDishService({
    dishes: { async listDishes() { throw dishError } },
    favorites: createFavorites()
  })

  await assert.rejects(service.loadCatalog(), error => error === dishError)
})

test('收藏操作返回服务端确认后的真实状态', async () => {
  const service = createDishService({ dishes: {}, favorites: createFavorites() })
  assert.deepEqual(await service.setFavorite('20', true), { favoriteIds: [20], isFavorite: true })
  assert.deepEqual(applyFavoriteState([{ id: '2' }], [2]), [{ id: '2', isFavorite: true }])
})
