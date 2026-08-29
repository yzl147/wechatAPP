const MAX_QUANTITY = 20

function validationError(message, field) {
  return { code: 40001, message, field }
}

function isDishId(value) {
  return Number.isSafeInteger(value) && value > 0
}

function validateCartEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return validationError('请求参数格式不正确', 'event')
  }
  const actions = ['get', 'summary', 'add', 'increase', 'decrease', 'remove', 'clear']
  if (!actions.includes(event.action)) return validationError('操作类型不正确', 'action')
  if (event.action === 'add') {
    if (!isDishId(event.dishId)) return validationError('菜谱 ID 不正确', 'dishId')
    if (!Number.isInteger(event.quantity) || event.quantity < 1 || event.quantity > MAX_QUANTITY) {
      return validationError(`份数必须是 1 到 ${MAX_QUANTITY} 的整数`, 'quantity')
    }
  }
  if (['increase', 'decrease', 'remove'].includes(event.action) && !isDishId(event.foodId)) {
    return validationError('菜谱 ID 不正确', 'foodId')
  }
  return null
}

module.exports = { MAX_QUANTITY, validateCartEvent }
