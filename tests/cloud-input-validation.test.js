const test = require('node:test')
const assert = require('node:assert/strict')
const { validateDishEvent } = require('../cloudfunctions/manageDishes/validation')
const { validateCartEvent } = require('../cloudfunctions/manageCart/validation')
const { validateOrderEvent } = require('../cloudfunctions/manageOrders/validation')

test('菜谱详情只接受正整数 ID', () => {
  assert.equal(validateDishEvent({ action: 'detail', id: 1 }), null)
  assert.equal(validateDishEvent({ action: 'list' }), null)
  assert.equal(validateDishEvent({ action: 'detail', id: '1' }).code, 40001)
  assert.equal(validateDishEvent({ action: 'detail', id: -1 }).code, 40001)
  assert.equal(validateDishEvent({ action: 'unknown' }).code, 40001)
})

test('加入今日清单只接受菜谱 ID 和有限整数份数', () => {
  assert.equal(validateCartEvent({ action: 'add', dishId: 1, quantity: 2 }), null)
  assert.equal(validateCartEvent({ action: 'add', dishId: 1, quantity: 0 }).code, 40001)
  assert.equal(validateCartEvent({ action: 'add', dishId: 1, quantity: 21 }).code, 40001)
  assert.equal(validateCartEvent({ action: 'add', dishId: 1, quantity: 1.5 }).code, 40001)
  assert.equal(validateCartEvent({ action: 'add', dishId: '1', quantity: 1 }).code, 40001)
  assert.equal(validateCartEvent({ action: 'add', food: { id: 1, name: '伪造菜谱' }, quantity: 1 }).code, 40001)
})

test('今日清单增减和删除校验菜谱 ID', () => {
  assert.equal(validateCartEvent({ action: 'increase', foodId: 1 }), null)
  assert.equal(validateCartEvent({ action: 'decrease', foodId: null }).code, 40001)
  assert.equal(validateCartEvent({ action: 'remove', foodId: {} }).code, 40001)
  assert.equal(validateCartEvent({ action: 1 }).code, 40001)
})

test('自己做的饮食记录只接受非重复菜谱 ID 和有限份数', () => {
  assert.equal(validateOrderEvent({
    action: 'create',
    mealType: 'cook',
    items: [{ dishId: 1, quantity: 1 }, { dishId: 2, quantity: 2 }]
  }), null)
  assert.equal(validateOrderEvent({ action: 'create', mealType: 'cook', items: [] }).code, 40001)
  assert.equal(validateOrderEvent({
    action: 'create', mealType: 'cook', items: [{ id: 1, name: '客户端快照', quantity: 1 }]
  }).code, 40001)
  assert.equal(validateOrderEvent({ action: 'create', mealType: 'cook', items: [{ dishId: 1, quantity: -1 }] }).code, 40001)
  assert.equal(validateOrderEvent({
    action: 'create',
    mealType: 'cook',
    items: [{ dishId: 1, quantity: 1 }, { dishId: 1, quantity: 2 }]
  }).code, 40001)
})

test('外出和外卖记录校验枚举及文本长度', () => {
  assert.equal(validateOrderEvent({
    action: 'create', mealType: 'takeout', venue: '附近餐馆', dishes: '牛肉面', remark: ''
  }), null)
  assert.equal(validateOrderEvent({ action: 'create', mealType: 'unknown', venue: '店', dishes: '饭' }).code, 40001)
  assert.equal(validateOrderEvent({ action: 'create', mealType: 'dine_out', venue: ' ', dishes: '饭' }).code, 40001)
  assert.equal(validateOrderEvent({ action: 'create', mealType: 'takeout', venue: '店', dishes: '饭', remark: 'a'.repeat(121) }).code, 40001)
})

test('记录操作校验单条 ID、状态枚举和批量上限', () => {
  assert.equal(validateOrderEvent({ action: 'detail', orderId: 'FO12345678' }), null)
  assert.equal(validateOrderEvent({ action: 'delete', orderId: '' }).code, 40001)
  assert.equal(validateOrderEvent({ action: 'updateStatus', orderId: 'FO12345678', status: 'pending' }).code, 40001)
  assert.equal(validateOrderEvent({ action: 'batchDelete', orderIds: ['FO1', 'FO2'] }), null)
  assert.equal(validateOrderEvent({ action: 'batchDelete', orderIds: Array.from({ length: 51 }, (_, i) => `FO${i}`) }).code, 40001)
  assert.equal(validateOrderEvent({ action: 'batchDelete', orderIds: ['FO1', 'FO1'] }).code, 40001)
  assert.equal(validateOrderEvent({ action: 'unknown' }).code, 40001)
})
