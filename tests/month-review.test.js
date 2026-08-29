const test = require('node:test')
const assert = require('node:assert/strict')
const { createMonthDescriptor, isCurrentMonth, summarizeMeals, selectLifeRecords } = require('../domain/stats/month-review')

test('月份范围覆盖闰年二月且结束时间不包含下月', () => {
  const month = createMonthDescriptor(2028, 1)
  assert.equal(month.key, '2028-02')
  assert.equal(month.label, '2028年2月')
  assert.equal(month.startTime, new Date(2028, 1, 1).getTime())
  assert.equal(month.endTime, new Date(2028, 2, 1).getTime())
})

test('十二月的结束时间正确跨到下一年', () => {
  const month = createMonthDescriptor(2026, 11)
  assert.equal(month.endTime, new Date(2027, 0, 1).getTime())
  assert.equal(isCurrentMonth(2026, 11, new Date(2026, 11, 31)), true)
  assert.equal(isCurrentMonth(2026, 10, new Date(2026, 11, 31)), false)
})

test('饮食统计区分三种方式并只汇总自己做的菜品', () => {
  const summary = summarizeMeals([
    { items: [{ name: '番茄炒蛋', quantity: 2 }, { name: '清蒸鱼', quantity: 1 }] },
    { mealType: 'cook', items: [{ name: '番茄炒蛋', quantity: 1 }] },
    { mealType: 'dine_out', items: [{ name: '不应统计', quantity: 9 }] },
    { mealType: 'takeout' }
  ])

  assert.deepEqual({ cook: summary.cookCount, dineOut: summary.dineOutCount, takeout: summary.takeoutCount, total: summary.totalCount }, {
    cook: 2,
    dineOut: 1,
    takeout: 1,
    total: 4
  })
  assert.deepEqual(summary.topDishes, [{ name: '番茄炒蛋', count: 3 }, { name: '清蒸鱼', count: 1 }])
})

test('生活完成记录只保留所选月份并按完成时间倒序', () => {
  const records = [
    { id: 'old', completedAt: new Date(2026, 6, 31, 23, 59).getTime() },
    { id: 'first', completedAt: new Date(2026, 7, 2, 8, 0).getTime() },
    { id: 'second', completedAt: new Date(2026, 7, 20, 8, 0).getTime() },
    { id: 'next', completedAt: new Date(2026, 8, 1, 0, 0).getTime() }
  ]

  assert.deepEqual(selectLifeRecords(records, 2026, 7).map(item => item.id), ['second', 'first'])
  assert.deepEqual(records.map(item => item.id), ['old', 'first', 'second', 'next'])
})
