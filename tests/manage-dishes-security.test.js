const test = require('node:test')
const assert = require('node:assert/strict')
const { getForbiddenActionResponse, maskIdentifier } = require('../cloudfunctions/manageDishes/security')

test('普通客户端调用 reinit 时返回稳定的拒绝码', () => {
  assert.deepEqual(getForbiddenActionResponse('reinit'), {
    code: 40301,
    message: '无权执行菜谱管理操作'
  })
})

test('正常菜谱查询操作不受管理操作拦截影响', () => {
  assert.equal(getForbiddenActionResponse('list'), null)
  assert.equal(getForbiddenActionResponse('detail'), null)
})

test('日志中的调用者标识经过脱敏', () => {
  assert.equal(maskIdentifier('o123456789xyz'), 'o12***xyz')
  assert.equal(maskIdentifier('short'), '***')
  assert.equal(maskIdentifier(''), 'unknown')
})
