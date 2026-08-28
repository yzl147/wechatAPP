const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createMealDecisionPreferenceRepository,
  formatLocalDate
} = require('../repositories/local/meal-decision-preference-repository')

function createHarness(initial, timestamp) {
  let stored = initial
  const storage = {
    get() { return stored },
    save(value) { stored = value }
  }
  return {
    repository: createMealDecisionPreferenceRepository({ storage, now: () => timestamp }),
    getStored: () => stored
  }
}

test('当天用餐方式会按本地日期保存并清理未知和重复来源', () => {
  const timestamp = new Date(2026, 7, 28, 10, 30).getTime()
  const { repository, getStored } = createHarness({ date: '', selectedSources: [] }, timestamp)

  const selected = repository.saveSelectedSources(['dine_in', 'unknown', 'dine_in', 'cook'])

  assert.deepEqual(selected, ['dine_in', 'cook'])
  assert.deepEqual(getStored(), {
    date: formatLocalDate(timestamp),
    selectedSources: ['dine_in', 'cook']
  })
  assert.deepEqual(repository.getSelectedSources(), ['dine_in', 'cook'])
})

test('跨天后不自动沿用前一天的用餐方式', () => {
  const today = new Date(2026, 7, 28, 10, 30).getTime()
  const yesterday = today - 24 * 60 * 60 * 1000
  const { repository } = createHarness({
    date: formatLocalDate(yesterday),
    selectedSources: ['takeout']
  }, today)

  assert.deepEqual(repository.getSelectedSources(), [])
})
