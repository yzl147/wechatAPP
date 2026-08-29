const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createCursor,
  fetchOrderPage,
  fetchAllOrders
} = require('../cloudfunctions/manageOrders/pagination')

function createCommandRecorder() {
  return {
    lt: value => ({ op: 'lt', value }),
    eq: value => ({ op: 'eq', value }),
    or: values => ({ op: 'or', values }),
    and: values => ({ op: 'and', values })
  }
}

function createQueuedCollection(pages) {
  const calls = { where: [], orderBy: [], limit: [] }
  const collection = {
    calls,
    where(value) { calls.where.push(value); return this },
    orderBy(field, direction) { calls.orderBy.push([field, direction]); return this },
    limit(value) { calls.limit.push(value); return this },
    async get() { return { data: pages.shift() || [] } }
  }
  return collection
}

function createRecords(count, start = 0) {
  return Array.from({ length: count }, (_, index) => ({
    _id: `id_${String(start + index).padStart(4, '0')}`,
    orderId: `FO${start + index}`,
    orderTime: 2000000000000 - start - index
  }))
}

test('列表多取一条来判断下一页，并以最后一条生成游标', async () => {
  const records = createRecords(21)
  const collection = createQueuedCollection([records])
  const page = await fetchOrderPage({
    collection,
    command: createCommandRecorder(),
    baseCondition: { _openid: 'user' },
    cursor: null,
    limit: 20
  })

  assert.equal(page.items.length, 20)
  assert.equal(page.hasMore, true)
  assert.deepEqual(page.nextCursor, createCursor(records[19]))
  assert.deepEqual(collection.calls.orderBy, [['orderTime', 'desc'], ['_id', 'desc']])
  assert.deepEqual(collection.calls.limit, [21])
})

test('空数据和恰好一页时不返回下一页游标', async () => {
  const empty = await fetchOrderPage({
    collection: createQueuedCollection([[]]),
    command: createCommandRecorder(),
    baseCondition: { _openid: 'user' },
    limit: 20
  })
  const exact = await fetchOrderPage({
    collection: createQueuedCollection([createRecords(20)]),
    command: createCommandRecorder(),
    baseCondition: { _openid: 'user' },
    limit: 20
  })

  assert.deepEqual(empty, { items: [], hasMore: false, nextCursor: null })
  assert.equal(exact.items.length, 20)
  assert.equal(exact.hasMore, false)
  assert.equal(exact.nextCursor, null)
})

test('范围查询分批读取超过 120 条记录且不重复遗漏', async () => {
  const allRecords = createRecords(125)
  const collection = createQueuedCollection([
    allRecords.slice(0, 51),
    allRecords.slice(50, 101),
    allRecords.slice(100)
  ])
  const result = await fetchAllOrders({
    collection,
    command: createCommandRecorder(),
    baseCondition: { _openid: 'user', orderTime: { op: 'range' } }
  })

  assert.equal(result.length, 125)
  assert.equal(new Set(result.map(item => item._id)).size, 125)
  assert.deepEqual(result.map(item => item._id), allRecords.map(item => item._id))
  assert.deepEqual(collection.calls.limit, [51, 51, 51])
  assert.equal(collection.calls.where[1].op, 'and')
})

test('分页跳过软删除记录并继续扫描到完整可见页', async () => {
  const records = createRecords(5)
  records[1].deletedAt = 100
  records[2].deletedAt = 200
  const collection = createQueuedCollection([
    records.slice(0, 3),
    records.slice(3)
  ])
  const page = await fetchOrderPage({
    collection,
    command: createCommandRecorder(),
    baseCondition: { _openid: 'user' },
    limit: 2,
    includeRecord: record => !record.deletedAt
  })

  assert.deepEqual(page.items.map(item => item.orderId), ['FO0', 'FO3'])
  assert.equal(page.hasMore, true)
  assert.deepEqual(page.nextCursor, createCursor(records[3]))
  assert.deepEqual(collection.calls.limit, [3, 3])
})
