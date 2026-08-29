const test = require('node:test')
const assert = require('node:assert/strict')
const { createMealListRepository } = require('../repositories/cloud/meal-list-repository')

test('饮食清单 repository 隔离旧购物车协议并补充菜谱 ID', async () => {
  const calls = []
  const repository = createMealListRepository({
    async callFunction(name, data) {
      calls.push({ name, data })
      if (data.action === 'get') return { data: [{ foodId: 13, name: '麻婆豆腐', quantity: 1, price: 18 }] }
      return { data: { count: 2 } }
    }
  })

  assert.deepEqual(await repository.listItems(), [{ dishId: 13, name: '麻婆豆腐', quantity: 1 }])
  assert.deepEqual(await repository.getSummary(), { count: 2 })
  await repository.increaseDish(13)
  assert.deepEqual(calls[1], { name: 'manageCart', data: { action: 'summary' } })
  assert.deepEqual(calls[2], { name: 'manageCart', data: { action: 'increase', foodId: 13 } })
})
