const test = require('node:test')
const assert = require('node:assert/strict')
const { getExpiryInfo, createDisplayInventory } = require('../domain/inventory/expiry-calculator')

const NOW = new Date(2026, 7, 27, 12, 0, 0)

test('保质期状态区分过期、今天到期、临期、正常和未设置', () => {
  assert.deepEqual(getExpiryInfo('2026-08-26', NOW), { type: 'expired', text: '已过期', order: 0 })
  assert.deepEqual(getExpiryInfo('2026-08-27', NOW), { type: 'expiring', text: '今天到期', order: 1 })
  assert.deepEqual(getExpiryInfo('2026-08-30', NOW), { type: 'expiring', text: '3 天后到期', order: 1 })
  assert.deepEqual(getExpiryInfo('2026-08-31', NOW), { type: 'normal', text: '4 天后到期', order: 2 })
  assert.deepEqual(getExpiryInfo('', NOW), { type: 'no-expiry', text: '未设置日期', order: 3 })
})

test('展示库存按紧急程度和创建时间排序且不修改输入', () => {
  const items = [
    { id: 'none', expiryDate: '', createdAt: 1 },
    { id: 'later', expiryDate: '2026-08-29', createdAt: 20 },
    { id: 'expired', expiryDate: '2026-08-26', createdAt: 30 },
    { id: 'today', expiryDate: '2026-08-27', createdAt: 10 }
  ]
  const result = createDisplayInventory(items, NOW)

  assert.deepEqual(result.map(item => item.id), ['expired', 'today', 'later', 'none'])
  assert.equal(Object.prototype.hasOwnProperty.call(items[0], 'expiry'), false)
})
