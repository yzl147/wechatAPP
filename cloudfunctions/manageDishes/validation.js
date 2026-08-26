function validationError(message, field) {
  return { code: 40001, message, field }
}

function validateDishEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return validationError('请求参数格式不正确', 'event')
  }
  if (!['list', 'detail'].includes(event.action)) return validationError('操作类型不正确', 'action')
  if (event.action === 'detail' && (!Number.isSafeInteger(event.id) || event.id <= 0)) {
    return validationError('菜谱 ID 不正确', 'id')
  }
  return null
}

module.exports = { validateDishEvent }
