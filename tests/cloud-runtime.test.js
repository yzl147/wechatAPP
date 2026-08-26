const test = require('node:test')
const assert = require('node:assert/strict')
const { runCloudRequest, maskIdentifier } = require('../cloudfunctions/manageDishes/runtime')

function createLogger() {
  const entries = { info: [], warn: [], error: [] }
  return {
    entries,
    info(...args) { entries.info.push(args) },
    warn(...args) { entries.warn.push(args) },
    error(...args) { entries.error.push(args) }
  }
}

test('云函数请求包装器添加 requestId 并记录脱敏调用者', async () => {
  const logger = createLogger()
  let clock = 1000
  const result = await runCloudRequest({
    functionName: 'manageDishes',
    event: { action: 'list' },
    getCaller: () => 'o6zAJsz20qskwmTPBjfK2k6Qz22g',
    handler: async () => ({ code: 0, message: 'ok', data: [] }),
    logger,
    now: () => (clock += 5),
    random: () => 0.5
  })

  assert.equal(result.code, 0)
  assert.match(result.requestId, /^manageDishes-/)
  assert.equal(logger.entries.info.length, 1)
  assert.equal(logger.entries.info[0][1].caller, 'o6z***22g')
  assert.equal(logger.entries.info[0][1].action, 'list')
  assert.equal(logger.entries.info[0][1].requestId, result.requestId)
})

test('云函数请求包装器保留业务错误并附带 requestId', async () => {
  const logger = createLogger()
  const result = await runCloudRequest({
    functionName: 'manageCart',
    event: { action: 'add' },
    handler: async () => ({ code: 40001, message: '参数错误' }),
    logger,
    now: () => 1000,
    random: () => 0.2
  })

  assert.equal(result.code, 40001)
  assert.equal(result.message, '参数错误')
  assert.ok(result.requestId)
  assert.equal(logger.entries.warn.length, 1)
})

test('云函数请求包装器不向客户端泄露数据库异常', async () => {
  const logger = createLogger()
  const rawMessage = 'collection.get:fail Db or Table not exist: favorites'
  const result = await runCloudRequest({
    functionName: 'manageOrders',
    event: { action: 'list' },
    handler: async () => { throw Object.assign(new Error(rawMessage), { errCode: -502005 }) },
    logger,
    now: () => 1000,
    random: () => 0.8
  })

  assert.equal(result.code, 50001)
  assert.equal(result.message, '服务暂时不可用，请稍后重试')
  assert.ok(result.requestId)
  assert.equal(JSON.stringify(result).includes(rawMessage), false)
  assert.equal(logger.entries.error[0][1].errorCode, -502005)
  assert.equal(JSON.stringify(logger.entries.error).includes(rawMessage), false)
})

test('调用者标识不会被完整写入日志', () => {
  assert.equal(maskIdentifier('abcdefghi'), 'abc***ghi')
  assert.equal(maskIdentifier('short'), '***')
  assert.equal(maskIdentifier(''), 'unknown')
})
