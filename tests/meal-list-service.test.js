const test = require('node:test')
const assert = require('node:assert/strict')
const { createMealListService, getDishId } = require('../services/meal-list-service')

test('饮食清单 service 按份数汇总', async () => {
  const service = createMealListService({
    async listItems() { return [{ dishId: 1, quantity: 2 }, { dishId: 2, quantity: 1 }] }
  })
  assert.deepEqual(await service.loadMealList(), {
    items: [{ dishId: 1, quantity: 2 }, { dishId: 2, quantity: 1 }],
    count: 3
  })
})

test('饮食清单 service 使用新术语调用 repository 并兼容旧菜谱 ID', async () => {
  const calls = []
  const repository = {
    async addDish(...args) { calls.push(['add', ...args]) },
    async removeDish(...args) { calls.push(['remove', ...args]) },
    async clear() { calls.push(['clear']) },
    async getSummary() { return { count: 4 } }
  }
  const service = createMealListService(repository)

  assert.deepEqual(await service.addDish({ foodId: 13 }, 2), { count: 4 })
  assert.deepEqual(await service.removeDish(13), { count: 4 })
  assert.deepEqual(await service.clearMealList(), { count: 0 })
  assert.deepEqual(calls, [['add', 13, 2], ['remove', 13], ['clear']])
  assert.equal(getDishId({ id: 20 }), 20)
})
