function createSafeError(message, code, requestId, details) {
  const error = new Error(message)
  error.code = code
  error.requestId = requestId || ''
  error.isSafeCloudError = true
  error.details = details
  return error
}

function callFunction(name, data) {
  return wx.cloud.callFunction({ name, data }).then(res => {
    const result = res && res.result
    if (!result || typeof result.code !== 'number') {
      throw createSafeError('服务返回异常，请稍后重试', 'INVALID_RESPONSE')
    }
    if (result.code !== 0) {
      throw createSafeError(result.message || '操作未成功', result.code, result.requestId, result.data)
    }
    return result
  }).catch(error => {
    if (error && error.isSafeCloudError) throw error
    throw createSafeError('网络或服务暂时不可用，请稍后重试', 'CLOUD_CALL_FAILED')
  })
}

function getErrorMessage(error, fallback = '操作失败，请重试') {
  const message = error && error.isSafeCloudError ? error.message : fallback
  return error && error.requestId ? `${message}（编号：${error.requestId}）` : message
}

module.exports = { callFunction, getErrorMessage }
