const test = require('node:test')
const assert = require('node:assert/strict')
const { createMealRecordService, formatTime } = require('../services/meal-record-service')

test('饮食记录 service 使用领域术语组织保存和删除流程', async () => {
  const calls = []
  const service = createMealRecordService({
    async createCookedRecord(...args) { calls.push(['save', ...args]); return { recordId: 'FO1' } },
    async deleteRecord(...args) { calls.push(['delete', ...args]) },
    async restoreRecord(...args) { calls.push(['restore', ...args]) },
    async deleteRecords(...args) { calls.push(['batchDelete', ...args]) }
  })

  assert.deepEqual(await service.saveCookedMeal([{ dishId: 13 }], '周末'), { recordId: 'FO1' })
  await service.deleteRecord('FO1')
  await service.restoreRecord('FO1')
  await service.deleteRecords(['FO1', 'FO2'])
  assert.deepEqual(calls, [
    ['save', [{ dishId: 13 }], '周末'],
    ['delete', 'FO1'],
    ['restore', 'FO1'],
    ['batchDelete', ['FO1', 'FO2']]
  ])
})

test('饮食记录时间格式保持原页面展示格式', () => {
  assert.equal(formatTime(new Date(2026, 7, 29, 9, 5).getTime()), '2026-08-29 09:05')
})
