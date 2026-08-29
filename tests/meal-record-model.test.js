const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createCookedItemSnapshot,
  createExternalItemSnapshot,
  createMealRecordDocument,
  toLegacyCompatibleRecord
} = require('../cloudfunctions/manageOrders/record-model')

test('新饮食记录文档不再持久化价格金额和订单状态', () => {
  const item = createCookedItemSnapshot({
    id: 13,
    name: '番茄炒蛋',
    price: 18,
    ingredients: ['鸡蛋', '番茄']
  }, 2)
  const document = createMealRecordDocument({
    orderId: 'FO1000',
    openid: 'user-1',
    orderTime: 100,
    items: [item],
    remark: ' 少盐 ',
    mealType: 'cook',
    venue: ''
  })

  assert.equal(document.totalCount, 2)
  assert.equal(document.remark, '少盐')
  assert.equal(Object.hasOwn(item, 'price'), false)
  assert.equal(Object.hasOwn(item, 'subtotal'), false)
  assert.equal(Object.hasOwn(document, 'totalPrice'), false)
  assert.equal(Object.hasOwn(document, 'status'), false)
})

test('外出用餐快照只保留饮食记录所需字段', () => {
  assert.deepEqual(createExternalItemSnapshot('牛肉面', 123), {
    id: 'meal-123',
    name: '牛肉面',
    quantity: 1,
    image: ''
  })
})

test('饮食记录响应为旧客户端补充默认字段且不修改原对象', () => {
  const record = { orderId: 'FO1000', items: [{ id: 13, quantity: 2 }] }
  const compatible = toLegacyCompatibleRecord(record)

  assert.equal(compatible.status, 'completed')
  assert.equal(compatible.totalPrice, 0)
  assert.equal(compatible.items[0].price, 0)
  assert.equal(compatible.items[0].subtotal, 0)
  assert.equal(Object.hasOwn(record, 'status'), false)
  assert.equal(Object.hasOwn(record.items[0], 'price'), false)
})

test('饮食记录响应保留历史文档中已有的价格和状态', () => {
  const compatible = toLegacyCompatibleRecord({
    status: 'cancelled',
    totalPrice: 36,
    items: [{ id: 13, quantity: 2, price: 18, subtotal: 36 }]
  })

  assert.equal(compatible.status, 'cancelled')
  assert.equal(compatible.totalPrice, 36)
  assert.equal(compatible.items[0].price, 18)
  assert.equal(compatible.items[0].subtotal, 36)
})
