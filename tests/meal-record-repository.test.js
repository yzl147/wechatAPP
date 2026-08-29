const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createMealRecordRepository,
  normalizeRecord,
  normalizeDeletedRecord
} = require('../repositories/cloud/meal-record-repository')

test('饮食记录 repository 将旧字段映射为客户端领域字段', () => {
  assert.deepEqual(normalizeRecord({
    orderId: 'FO1234',
    orderTime: 1788000000000,
    status: 'completed',
    totalPrice: 18,
    items: [{ id: 13, name: '麻婆豆腐', price: 18, subtotal: 18 }]
  }), {
    recordId: 'FO1234',
    recordedAt: 1788000000000,
    items: [{ id: 13, dishId: 13, name: '麻婆豆腐' }]
  })
  assert.equal(normalizeRecord(null), null)
  assert.equal(normalizeDeletedRecord(null), null)
  assert.equal(normalizeDeletedRecord({
    orderId: 'FO2', orderTime: 100, deletedAt: 200, items: []
  }).deletedAt, 200)
})

test('饮食记录 repository 隔离旧 manageOrders 参数', async () => {
  const calls = []
  const repository = createMealRecordRepository({
    async callFunction(name, data) {
      calls.push({ name, data })
      if (data.action === 'deletedList') {
        return { data: { items: [{ orderId: 'FO2', orderTime: 1, deletedAt: 2, items: [] }], hasMore: false } }
      }
      return { data: data.action === 'list' ? { items: [], hasMore: false } : { orderId: 'FO1', orderTime: 1, items: [] } }
    }
  })

  const deletedPage = await repository.listDeletedPage({ limit: 10 })
  await repository.getRecord('FO1')
  await repository.createCookedRecord([{ dishId: 13, quantity: 2 }])
  const deletion = await repository.deleteRecord('FO1')
  const restoration = await repository.restoreRecord('FO1')
  await repository.deleteRecords(['FO1'])
  assert.deepEqual(deletion, { recordId: 'FO1', recoverable: false })
  assert.deepEqual(restoration, { recordId: 'FO1', restored: false })
  assert.equal(deletedPage.items[0].recordId, 'FO2')
  assert.equal(deletedPage.items[0].deletedAt, 2)
  assert.deepEqual(calls, [
    { name: 'manageOrders', data: { action: 'deletedList', cursor: null, limit: 10 } },
    { name: 'manageOrders', data: { action: 'detail', orderId: 'FO1' } },
    { name: 'manageOrders', data: { action: 'create', items: [{ dishId: 13, quantity: 2 }], remark: '', mealType: 'cook' } },
    { name: 'manageOrders', data: { action: 'delete', orderId: 'FO1' } },
    { name: 'manageOrders', data: { action: 'restore', orderId: 'FO1' } },
    { name: 'manageOrders', data: { action: 'batchDelete', orderIds: ['FO1'] } }
  ])
})
