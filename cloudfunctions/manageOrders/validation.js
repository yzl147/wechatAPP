const MEAL_TYPES = new Set(['cook', 'dine_out', 'takeout'])
const MAX_ITEMS = 20
const MAX_QUANTITY = 20
const MAX_BATCH_SIZE = 50
const MAX_LIST_SIZE = 50
const MAX_RANGE_MS = 32 * 24 * 60 * 60 * 1000

function validationError(message, field) {
  return { code: 40001, message, field }
}

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
}

function isOrderId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(value)
}

function validateListEvent(event) {
  if (event.limit !== undefined && (!Number.isInteger(event.limit) || event.limit < 1 || event.limit > MAX_LIST_SIZE)) {
    return validationError(`每页记录数量必须是 1 到 ${MAX_LIST_SIZE}`, 'limit')
  }
  if (event.cursor === undefined || event.cursor === null) return null
  const cursor = event.cursor
  if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor) ||
      !Number.isSafeInteger(cursor.orderTime) || cursor.orderTime < 0 ||
      typeof cursor.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(cursor.id)) {
    return validationError('分页游标不正确', 'cursor')
  }
  return null
}

function validateDeletedListEvent(event) {
  if (event.limit !== undefined && (!Number.isInteger(event.limit) || event.limit < 1 || event.limit > MAX_LIST_SIZE)) {
    return validationError(`每页记录数量必须是 1 到 ${MAX_LIST_SIZE}`, 'limit')
  }
  if (event.cursor === undefined || event.cursor === null) return null
  const cursor = event.cursor
  if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor) ||
      !Number.isSafeInteger(cursor.deletedAt) || cursor.deletedAt <= 0 ||
      typeof cursor.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(cursor.id)) {
    return validationError('分页游标不正确', 'cursor')
  }
  return null
}

function validateRangeEvent(event) {
  const { startTime, endTime } = event
  if (!Number.isSafeInteger(startTime) || !Number.isSafeInteger(endTime) || startTime < 0 || endTime <= startTime) {
    return validationError('日期范围不正确', 'startTime')
  }
  if (endTime - startTime > MAX_RANGE_MS) {
    return validationError('日期范围不能超过 32 天', 'endTime')
  }
  return null
}

function validateOrderIds(orderIds) {
  if (!Array.isArray(orderIds) || orderIds.length === 0 || orderIds.length > MAX_BATCH_SIZE) {
    return validationError(`记录数量必须是 1 到 ${MAX_BATCH_SIZE} 条`, 'orderIds')
  }
  if (orderIds.some(id => !isOrderId(id)) || new Set(orderIds).size !== orderIds.length) {
    return validationError('记录 ID 列表不正确', 'orderIds')
  }
  return null
}

function validateCreateEvent(event) {
  const mealType = event.mealType || 'cook'
  if (!MEAL_TYPES.has(mealType)) return validationError('饮食方式不正确', 'mealType')
  if (event.remark !== undefined && (typeof event.remark !== 'string' || event.remark.length > 120)) {
    return validationError('备注不能超过 120 个字', 'remark')
  }

  if (mealType === 'cook') {
    if (!Array.isArray(event.items) || event.items.length === 0 || event.items.length > MAX_ITEMS) {
      return validationError(`菜谱数量必须是 1 到 ${MAX_ITEMS} 项`, 'items')
    }
    const dishIds = []
    for (const item of event.items) {
      if (!item || !Number.isSafeInteger(item.dishId) || item.dishId <= 0) {
        return validationError('菜谱 ID 不正确', 'items')
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
        return validationError(`每道菜份数必须是 1 到 ${MAX_QUANTITY} 的整数`, 'items')
      }
      dishIds.push(item.dishId)
    }
    if (new Set(dishIds).size !== dishIds.length) return validationError('菜谱不能重复提交', 'items')
    return null
  }

  if (!isNonEmptyString(event.venue, 40)) return validationError('地点或店铺不能为空且不能超过 40 个字', 'venue')
  if (!isNonEmptyString(event.dishes, 80)) return validationError('餐食内容不能为空且不能超过 80 个字', 'dishes')
  return null
}

function validateOrderEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return validationError('请求参数格式不正确', 'event')
  }
  const actions = ['create', 'list', 'deletedList', 'range', 'detail', 'delete', 'restore', 'batchDelete']
  if (!actions.includes(event.action)) return validationError('操作类型不正确', 'action')
  if (event.action === 'create') return validateCreateEvent(event)
  if (event.action === 'list') return validateListEvent(event)
  if (event.action === 'deletedList') return validateDeletedListEvent(event)
  if (event.action === 'range') return validateRangeEvent(event)
  if (['detail', 'delete', 'restore'].includes(event.action) && !isOrderId(event.orderId)) {
    return validationError('记录 ID 不正确', 'orderId')
  }
  if (event.action === 'batchDelete') return validateOrderIds(event.orderIds)
  return null
}

module.exports = { validateOrderEvent }
