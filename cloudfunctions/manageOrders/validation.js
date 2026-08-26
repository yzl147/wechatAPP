const MEAL_TYPES = new Set(['cook', 'dine_out', 'takeout'])
const MAX_ITEMS = 20
const MAX_QUANTITY = 20
const MAX_BATCH_SIZE = 50

function validationError(message, field) {
  return { code: 40001, message, field }
}

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
}

function isOrderId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(value)
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
  const actions = ['create', 'list', 'detail', 'updateStatus', 'delete', 'batchComplete', 'batchDelete', 'summary']
  if (!actions.includes(event.action)) return validationError('操作类型不正确', 'action')
  if (event.action === 'create') return validateCreateEvent(event)
  if (['detail', 'delete'].includes(event.action) && !isOrderId(event.orderId)) {
    return validationError('记录 ID 不正确', 'orderId')
  }
  if (event.action === 'updateStatus') {
    if (!isOrderId(event.orderId)) return validationError('记录 ID 不正确', 'orderId')
    if (event.status !== 'completed') return validationError('记录状态不正确', 'status')
  }
  if (['batchComplete', 'batchDelete'].includes(event.action)) return validateOrderIds(event.orderIds)
  return null
}

module.exports = { validateOrderEvent }
