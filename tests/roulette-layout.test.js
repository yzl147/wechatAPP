const test = require('node:test')
const assert = require('node:assert/strict')
const {
  normalizeDegrees,
  normalizeWheelItems,
  buildSectorLayout,
  getSpinTarget,
  truncateWheelLabel
} = require('../components/business/roulette/roulette-layout')

test('转盘展示数据过滤无效项和重复 ID 并补充稳定颜色', () => {
  const items = normalizeWheelItems([
    { id: 'one', label: '牛肉面' },
    { id: 'one', label: '重复项' },
    { id: 'two', name: '麻辣烫', color: '#123456' },
    { id: '', label: '无效项' },
    null
  ])

  assert.deepEqual(items.map(item => item.id), ['one', 'two'])
  assert.equal(items[0].color, '#f45b2a')
  assert.equal(items[1].label, '麻辣烫')
  assert.equal(items[1].color, '#123456')
})

test('扇区中心从顶部开始且均匀分布', () => {
  const sectors = buildSectorLayout([
    { id: 'one', label: '堂食' },
    { id: 'two', label: '外卖' },
    { id: 'three', label: '自己做' }
  ])

  assert.equal(sectors.length, 3)
  assert.ok(Math.abs(sectors[0].centerAngle + Math.PI / 2) < 1e-10)
  assert.ok(Math.abs(sectors[1].centerAngle - sectors[0].centerAngle - Math.PI * 2 / 3) < 1e-10)
})

test('目标角度让指定扇区停在顶部并至少完成指定圈数', () => {
  const target = getSpinTarget(35, 4, 2, 5)

  assert.ok(target >= 35 + 5 * 360)
  assert.equal(normalizeDegrees(target), 180)
  assert.equal(normalizeDegrees(getSpinTarget(target, 4, 0, 5)), 0)
})

test('目标角度拒绝空转盘和越界结果', () => {
  assert.throws(() => getSpinTarget(0, 0, 0), /positive integer/)
  assert.throws(() => getSpinTarget(0, 3, 3), /out of range/)
})

test('长名称根据扇区数量截断且不拆散 Unicode 字符', () => {
  assert.equal(truncateWheelLabel('一家很好吃的牛肉面店', 3), '一家很好吃的牛肉…')
  assert.equal(truncateWheelLabel('🍜🍜🍜🍜', 13), '🍜🍜🍜…')
  assert.equal(truncateWheelLabel('麻辣烫', 8), '麻辣烫')
})
