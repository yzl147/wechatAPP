const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50
const RANGE_PAGE_SIZE = 50

function normalizePageSize(value) {
  return Number.isInteger(value) ? Math.min(Math.max(value, 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE
}

function createCursor(record) {
  if (!record) return null
  return { orderTime: record.orderTime, id: record._id }
}

function buildCursorCondition(command, cursor) {
  return command.or([
    { orderTime: command.lt(cursor.orderTime) },
    command.and([
      { orderTime: command.eq(cursor.orderTime) },
      { _id: command.lt(cursor.id) }
    ])
  ])
}

async function fetchOrderPage({ collection, command, baseCondition, cursor, limit }) {
  const pageSize = normalizePageSize(limit)
  const condition = cursor
    ? command.and([baseCondition, buildCursorCondition(command, cursor)])
    : baseCondition
  const { data } = await collection
    .where(condition)
    .orderBy('orderTime', 'desc')
    .orderBy('_id', 'desc')
    .limit(pageSize + 1)
    .get()
  const hasMore = data.length > pageSize
  const items = data.slice(0, pageSize)
  return {
    items,
    hasMore,
    nextCursor: hasMore ? createCursor(items[items.length - 1]) : null
  }
}

async function fetchAllOrders(options) {
  const allItems = []
  let cursor = null
  do {
    const page = await fetchOrderPage({
      ...options,
      cursor,
      limit: RANGE_PAGE_SIZE
    })
    allItems.push(...page.items)
    cursor = page.nextCursor
  } while (cursor)
  return allItems
}

module.exports = {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  normalizePageSize,
  createCursor,
  buildCursorCondition,
  fetchOrderPage,
  fetchAllOrders
}
