const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createCookedItemSnapshot,
  createExternalItemSnapshot,
  createMealRecordDocument,
  isRecordDeleted,
  toCurrentRecord,
  toDeletedRecord
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

test('饮食记录响应过滤历史金额和状态且不修改原对象', () => {
  const record = {
    status: 'cancelled',
    completedTime: 123,
    totalPrice: 36,
    deletedAt: 1788000000000,
    items: [{ id: 13, quantity: 2, price: 18, subtotal: 36 }]
  }
  const current = toCurrentRecord(record)

  assert.equal(Object.hasOwn(current, 'status'), false)
  assert.equal(Object.hasOwn(current, 'completedTime'), false)
  assert.equal(Object.hasOwn(current, 'totalPrice'), false)
  assert.equal(Object.hasOwn(current, 'deletedAt'), false)
  assert.equal(Object.hasOwn(current.items[0], 'price'), false)
  assert.equal(Object.hasOwn(current.items[0], 'subtotal'), false)
  assert.equal(record.status, 'cancelled')
  assert.equal(record.items[0].price, 18)
})

test('软删除状态兼容旧记录和已经恢复的记录', () => {
  assert.equal(isRecordDeleted({ orderId: 'FO1' }), false)
  assert.equal(isRecordDeleted({ orderId: 'FO1', deletedAt: null }), false)
  assert.equal(isRecordDeleted({ orderId: 'FO1', deletedAt: 1788000000000 }), true)
})

test('最近删除响应保留删除时间并继续过滤历史字段', () => {
  const deleted = toDeletedRecord({
    orderId: 'FO1',
    orderTime: 100,
    deletedAt: 1788000000000,
    totalPrice: 18,
    items: [{ id: 13, name: '番茄炒蛋', price: 18 }]
  })

  assert.equal(deleted.deletedAt, 1788000000000)
  assert.equal(Object.hasOwn(deleted, 'totalPrice'), false)
  assert.equal(Object.hasOwn(deleted.items[0], 'price'), false)
})
