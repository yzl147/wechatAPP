const test = require('node:test')
const assert = require('node:assert/strict')
const { createDishRepository } = require('../repositories/cloud/dish-repository')

test('菜谱 repository 封装列表和详情云函数协议', async () => {
  const requests = []
  const repository = createDishRepository({
    async callFunction(name, data) {
      requests.push({ name, data })
      return { data: data.action === 'list' ? [{ id: 2 }] : { id: data.id } }
    }
  })

  assert.deepEqual(await repository.listDishes(), [{ id: 2 }])
  assert.deepEqual(await repository.getDishDetail(13), { id: 13 })
  assert.deepEqual(requests, [
    { name: 'manageDishes', data: { action: 'list' } },
    { name: 'manageDishes', data: { action: 'detail', id: 13 } }
  ])
})

test('菜谱列表响应不是数组时 repository 返回安全空列表', async () => {
  const repository = createDishRepository({ async callFunction() { return { data: null } } })
  assert.deepEqual(await repository.listDishes(), [])
})
