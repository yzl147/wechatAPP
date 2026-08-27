function createRequestId(functionName, now, random) {
  const timePart = now().toString(36)
  const randomPart = Math.floor(random() * 0xFFFFFF).toString(36).padStart(5, '0')
  return `${functionName}-${timePart}-${randomPart}`
}

function maskIdentifier(identifier) {
  if (!identifier) return 'unknown'
  if (identifier.length <= 6) return '***'
  return `${identifier.slice(0, 3)}***${identifier.slice(-3)}`
}

async function runCloudRequest({ functionName, event, getCaller, handler, logger = console, now = Date.now, random = Math.random }) {
  const startedAt = now()
  const requestId = createRequestId(functionName, now, random)
  const action = event && typeof event.action === 'string' ? event.action : 'unknown'
  let caller = ''
  try {
    caller = getCaller ? getCaller() : ''
    const result = await handler(caller)
    const response = result && typeof result === 'object' ? result : { code: 50001, message: '服务暂时不可用，请稍后重试' }
    const logData = { requestId, action, caller: maskIdentifier(caller), code: response.code, durationMs: Math.max(0, now() - startedAt) }
    if (response.code === 0) logger.info(`[${functionName}] 请求完成`, logData)
    else logger.warn(`[${functionName}] 业务请求未成功`, logData)
    return { ...response, requestId }
  } catch (error) {
    logger.error(`[${functionName}] 请求异常`, {
      requestId,
      action,
      caller: maskIdentifier(caller),
      errorCode: error && (error.errCode || error.code || error.name) || 'UNKNOWN',
      durationMs: Math.max(0, now() - startedAt)
    })
    return { code: 50001, message: '服务暂时不可用，请稍后重试', requestId }
  }
}

module.exports = { runCloudRequest, maskIdentifier }
