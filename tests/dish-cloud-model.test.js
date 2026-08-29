const test = require('node:test')
const assert = require('node:assert/strict')
const { toCurrentDish } = require('../cloudfunctions/manageDishes/dish-model')
const dishes = require('../cloudfunctions/manageDishes/data/foods')

test('菜谱云响应过滤历史价格字段且不修改数据库对象', () => {
  const dish = { id: 13, name: '番茄炒蛋', price: 18 }
  assert.deepEqual(toCurrentDish(dish), { id: 13, name: '番茄炒蛋' })
  assert.equal(dish.price, 18)
})

test('菜谱种子数据不再包含价格字段', () => {
  assert.equal(dishes.length > 0, true)
  assert.equal(dishes.every(dish => !Object.hasOwn(dish, 'price')), true)
})
