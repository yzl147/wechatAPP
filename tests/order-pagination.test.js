const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createCursor,
  fetchOrderPage,
  fetchAllOrders,
  createDeletedCursor,
  fetchDeletedOrderPage
} = require('../cloudfunctions/manageOrders/pagination')

function createCommandRecorder() {
  return {
    lt: value => ({ op: 'lt', value }),
    eq: value => ({ op: 'eq', value }),
    gt: value => ({ op: 'gt', value }),
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

function matchesCondition(record, condition) {
  if (!condition) return true
  if (condition.op === 'and') return condition.values.every(value => matchesCondition(record, value))
  if (condition.op === 'or') return condition.values.some(value => matchesCondition(record, value))
  return Object.entries(condition).every(([field, expected]) => {
    const actual = record[field]
    if (!expected || typeof expected !== 'object' || !expected.op) return actual === expected
    if (expected.op === 'lt') return actual < expected.value
    if (expected.op === 'eq') return actual === expected.value
    if (expected.op === 'gt') return actual > expected.value
    return false
  })
}

function createMemoryCollection(records) {
  const calls = { where: [], orderBy: [], limit: [] }
  let condition = null
  let order = []
  let resultLimit = Infinity
  const collection = {
    calls,
    where(value) { condition = value; calls.where.push(value); return this },
    orderBy(field, direction) { order.push([field, direction]); calls.orderBy.push([field, direction]); return this },
    limit(value) { resultLimit = value; calls.limit.push(value); return this },
    async get() {
      const data = records
        .filter(record => matchesCondition(record, condition))
        .sort((left, right) => {
          for (const [field, direction] of order) {
            if (left[field] === right[field]) continue
            const comparison = left[field] < right[field] ? -1 : 1
            return direction === 'desc' ? -comparison : comparison
          }
          return 0
        })
        .slice(0, resultLimit)
      condition = null
      order = []
      resultLimit = Infinity
      return { data }
    }
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

test('单条和多页数据分页无重复遗漏且最终游标为空', async () => {
  const command = createCommandRecorder()
  const singleRecord = { ...createRecords(1)[0], _openid: 'user' }
  const single = await fetchOrderPage({
    collection: createMemoryCollection([singleRecord]),
    command,
    baseCondition: { _openid: 'user' },
    limit: 20
  })
  assert.deepEqual(single, { items: [singleRecord], hasMore: false, nextCursor: null })

  const records = createRecords(45).map(record => ({ ...record, _openid: 'user' }))
  const collection = createMemoryCollection(records.slice().reverse())
  const ids = []
  let cursor = null
  let pageCount = 0
  do {
    const page = await fetchOrderPage({
      collection,
      command,
      baseCondition: { _openid: 'user' },
      cursor,
      limit: 20
    })
    ids.push(...page.items.map(item => item._id))
    cursor = page.nextCursor
    pageCount += 1
  } while (cursor)

  assert.equal(pageCount, 3)
  assert.equal(ids.length, 45)
  assert.equal(new Set(ids).size, 45)
  assert.deepEqual(ids, records.map(record => record._id))
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

test('最近删除按删除时间分页并生成独立游标', async () => {
  const records = createRecords(4).map((record, index) => ({
    ...record,
    deletedAt: 300 - index
  }))
  const collection = createQueuedCollection([records])
  const page = await fetchDeletedOrderPage({
    collection,
    command: createCommandRecorder(),
    baseCondition: { _openid: 'user', deletedAt: { op: 'gt', value: 0 } },
    limit: 3
  })

  assert.deepEqual(page.items.map(item => item.orderId), ['FO0', 'FO1', 'FO2'])
  assert.equal(page.hasMore, true)
  assert.deepEqual(page.nextCursor, createDeletedCursor(records[2]))
  assert.deepEqual(collection.calls.orderBy, [['deletedAt', 'desc'], ['_id', 'desc']])
  assert.deepEqual(collection.calls.limit, [4])
})

test('最近删除续页使用 deletedAt 和文档 ID 作为稳定条件', async () => {
  const records = createRecords(2).map(record => ({ ...record, deletedAt: 100 }))
  const collection = createQueuedCollection([records])
  const page = await fetchDeletedOrderPage({
    collection,
    command: createCommandRecorder(),
    baseCondition: { _openid: 'user' },
    cursor: { deletedAt: 101, id: 'previous_id' },
    limit: 20
  })

  assert.equal(collection.calls.where[0].op, 'and')
  assert.equal(collection.calls.where[0].values[1].op, 'or')
  assert.equal(page.hasMore, false)
  assert.equal(page.nextCursor, null)
})

test('相同记录时间和批量删除时间使用文档 ID 稳定分页', async () => {
  const command = createCommandRecorder()
  const activeRecords = ['id_03', 'id_01', 'id_05', 'id_02', 'id_04'].map((id, index) => ({
    _id: id,
    _openid: 'user',
    orderId: `FO${index}`,
    orderTime: 2000000000000
  }))
  const activeCollection = createMemoryCollection(activeRecords)
  const activeIds = []
  let activeCursor = null
  do {
    const page = await fetchOrderPage({
      collection: activeCollection,
      command,
      baseCondition: { _openid: 'user' },
      cursor: activeCursor,
      limit: 2
    })
    activeIds.push(...page.items.map(item => item._id))
    activeCursor = page.nextCursor
  } while (activeCursor)

  assert.deepEqual(activeIds, ['id_05', 'id_04', 'id_03', 'id_02', 'id_01'])
  assert.equal(new Set(activeIds).size, activeRecords.length)

  const deletedRecords = activeRecords.map(record => ({ ...record, deletedAt: 2000000000100 }))
  const deletedCollection = createMemoryCollection(deletedRecords)
  const deletedIds = []
  let deletedCursor = null
  do {
    const page = await fetchDeletedOrderPage({
      collection: deletedCollection,
      command,
      baseCondition: { _openid: 'user', deletedAt: command.gt(0) },
      cursor: deletedCursor,
      limit: 2
    })
    deletedIds.push(...page.items.map(item => item._id))
    deletedCursor = page.nextCursor
  } while (deletedCursor)

  assert.deepEqual(deletedIds, ['id_05', 'id_04', 'id_03', 'id_02', 'id_01'])
  assert.equal(new Set(deletedIds).size, deletedRecords.length)
})
