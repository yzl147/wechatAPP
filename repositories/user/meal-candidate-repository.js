const { createVersionedStorage } = require('../../utils/versioned-storage')
const { createUserDataSync } = require('../../utils/user-data-sync')
const {
  createDefaultCandidates,
  createCandidate,
  updateCandidate,
  getEnabledCandidates,
  isCandidate
} = require('../../domain/meal-decision/candidate-model')

const storage = createVersionedStorage({
  key: 'meal_decision_candidates',
  version: 1,
  defaultValue: [],
  migrations: { 1: migrateCandidates },
  validate: value => Array.isArray(value) && value.length <= 100 && value.every(isCandidate)
})

const cloudSync = createUserDataSync({
  kind: 'mealCandidates',
  getLocal: storage.get,
  saveLocal: storage.save
})

function createMealCandidateRepository({ gateway, getLocal, now = Date.now, random = Math.random }) {
  function listCached(sourceType) {
    const candidates = getLocal()
    return sourceType ? candidates.filter(item => item.sourceType === sourceType) : candidates
  }

  async function syncCandidates() {
    return gateway.sync()
  }

  async function addCandidate(input) {
    const timestamp = now()
    const candidate = createCandidate(input, {
      id: `candidate-${timestamp}-${Math.floor(random() * 1000000)}`,
      now: timestamp
    })
    await gateway.mutate(items => [candidate, ...items])
    return candidate
  }

  async function editCandidate(id, changes) {
    let updated = null
    await gateway.mutate(items => items.map(item => {
      if (item.id !== id) return item
      updated = updateCandidate(item, changes, now())
      return updated
    }))
    return updated
  }

  async function setCandidateEnabled(id, enabled) {
    return editCandidate(id, { enabled })
  }

  async function removeCandidate(id) {
    await gateway.mutate(items => items.filter(item => item.id !== id))
  }

  async function restoreDefaultCandidates() {
    return gateway.mutate(items => mergeById(items, createDefaultCandidates()))
  }

  function listEnabledCached(sourceType) {
    return getEnabledCandidates(getLocal(), sourceType)
  }

  return {
    syncCandidates,
    listCached,
    listEnabledCached,
    addCandidate,
    editCandidate,
    setCandidateEnabled,
    removeCandidate,
    restoreDefaultCandidates
  }
}

function migrateCandidates(value) {
  if (!Array.isArray(value)) return []
  return value.filter(isCandidate).slice(0, 100)
}

function mergeById(current, defaults) {
  const currentIds = new Set(current.map(item => item.id))
  return current.concat(defaults.filter(item => !currentIds.has(item.id)))
}

module.exports = {
  ...createMealCandidateRepository({ gateway: cloudSync, getLocal: storage.get }),
  createMealCandidateRepository
}
