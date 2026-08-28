const { createVersionedStorage } = require('../../utils/versioned-storage')
const { normalizeSelectedSources } = require('../../domain/meal-decision/candidate-filter')

const storage = createVersionedStorage({
  key: 'meal_decision_daily_preference',
  version: 1,
  defaultValue: { date: '', selectedSources: [] },
  migrations: { 1: migratePreference },
  validate: isPreference
})

function createMealDecisionPreferenceRepository({ storage: preferenceStorage, now = Date.now }) {
  function getSelectedSources() {
    const preference = preferenceStorage.get()
    return preference.date === formatLocalDate(now()) ? normalizeSelectedSources(preference.selectedSources) : []
  }

  function saveSelectedSources(selectedSources) {
    const preference = {
      date: formatLocalDate(now()),
      selectedSources: normalizeSelectedSources(selectedSources)
    }
    preferenceStorage.save(preference)
    return preference.selectedSources
  }

  return { getSelectedSources, saveSelectedSources }
}

function migratePreference(value) {
  if (!value || typeof value !== 'object') return { date: '', selectedSources: [] }
  return {
    date: typeof value.date === 'string' ? value.date : '',
    selectedSources: normalizeSelectedSources(value.selectedSources)
  }
}

function isPreference(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  if (typeof value.date !== 'string' || (value.date && !/^\d{4}-\d{2}-\d{2}$/.test(value.date))) return false
  if (!Array.isArray(value.selectedSources)) return false
  const normalized = normalizeSelectedSources(value.selectedSources)
  return normalized.length === value.selectedSources.length && normalized.every((item, index) => item === value.selectedSources[index])
}

function formatLocalDate(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

module.exports = {
  ...createMealDecisionPreferenceRepository({ storage }),
  createMealDecisionPreferenceRepository,
  formatLocalDate,
  isPreference
}
