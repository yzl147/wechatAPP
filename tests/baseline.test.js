const test = require('node:test')
const assert = require('node:assert/strict')
const { formatTime } = require('../utils/util')

test('Node 测试环境可以加载并验证纯 JavaScript 工具函数', () => {
  const date = new Date(2026, 7, 26, 9, 5, 7)
  assert.equal(formatTime(date), '2026/08/26 09:05:07')
})
