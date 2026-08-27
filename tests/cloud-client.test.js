const test = require('node:test')
const assert = require('node:assert/strict')

function loadCloudUtil(callFunction) {
  global.wx = { cloud: { callFunction } }
  const modulePath = require.resolve('../utils/cloud')
  delete require.cache[modulePath]
  return require('../utils/cloud')
}

test.afterEach(() => {
  delete global.wx
})

test('客户端云调用返回成功业务数据', async () => {
  const cloudUtil = loadCloudUtil(async () => ({
    result: { code: 0, data: [{ id: 1 }], requestId: 'req-ok' }
  }))
  const result = await cloudUtil.callFunction('manageDishes', { action: 'list' })
  assert.deepEqual(result.data, [{ id: 1 }])
})

test('客户端安全显示业务错误和 requestId', async () => {
  const cloudUtil = loadCloudUtil(async () => ({
    result: { code: 40001, message: '参数错误', requestId: 'req-business' }
  }))

  await assert.rejects(
    cloudUtil.callFunction('manageCart', { action: 'add' }),
    error => {
      assert.equal(error.isSafeCloudError, true)
      assert.equal(error.code, 40001)
      assert.equal(cloudUtil.getErrorMessage(error), '参数错误（编号：req-business）')
      return true
    }
  )
})

test('客户端保留服务端提供的安全冲突详情', async () => {
  const details = { data: [{ id: 'cloud-item' }], revision: 3 }
  const cloudUtil = loadCloudUtil(async () => ({
    result: { code: 40901, message: '数据已更新', data: details, requestId: 'req-conflict' }
  }))
  await assert.rejects(
    cloudUtil.callFunction('manageUserData', { action: 'replace' }),
    error => error.code === 40901 && error.details === details
  )
})

test('客户端不会向页面透传 SDK 原始异常', async () => {
  const rawMessage = 'cloud.callFunction:fail collection not exists: secret_table'
  const cloudUtil = loadCloudUtil(async () => { throw new Error(rawMessage) })

  await assert.rejects(
    cloudUtil.callFunction('manageOrders', { action: 'list' }),
    error => {
      assert.equal(error.message, '网络或服务暂时不可用，请稍后重试')
      assert.equal(error.message.includes(rawMessage), false)
      return true
    }
  )
})

test('客户端将缺少业务码的响应视为安全错误', async () => {
  const cloudUtil = loadCloudUtil(async () => ({ result: { data: [] } }))
  await assert.rejects(
    cloudUtil.callFunction('manageDishes', { action: 'list' }),
    error => error.code === 'INVALID_RESPONSE' && error.isSafeCloudError
  )
})
