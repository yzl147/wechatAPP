const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createMealListDocument,
  toLegacyCompatibleItem
} = require('../cloudfunctions/manageCart/meal-list-model')

test('今日饮食清单新文档不再持久化价格字段', () => {
  const document = createMealListDocument({
    openid: 'user-1',
    dish: { id: 13, name: '番茄炒蛋', price: 18, ingredients: ['鸡蛋'] },
    quantity: 2,
    addedTime: 100
  })

  assert.equal(document.foodId, 13)
  assert.equal(document.quantity, 2)
  assert.equal(Object.hasOwn(document, 'price'), false)
})

test('今日饮食清单响应为旧客户端补充默认价格且不修改原对象', () => {
  const item = { foodId: 13, quantity: 1 }
  const compatible = toLegacyCompatibleItem(item)

  assert.equal(compatible.price, 0)
  assert.equal(Object.hasOwn(item, 'price'), false)
})
