const candidateRepository = require('../repositories/user/meal-candidate-repository')

function createMealCandidateService(repository) {
  async function loadCandidates() {
    try {
      await repository.syncCandidates()
      return { candidates: repository.listCached(), syncError: null }
    } catch (syncError) {
      return { candidates: repository.listCached(), syncError }
    }
  }

  function getCachedCandidates() {
    return repository.listCached()
  }

  async function addCandidate(input) {
    await repository.addCandidate(input)
    return getCachedCandidates()
  }

  async function editCandidate(id, changes) {
    const updated = await repository.editCandidate(id, changes)
    return { updated, candidates: getCachedCandidates() }
  }

  async function setCandidateEnabled(id, enabled) {
    const updated = await repository.setCandidateEnabled(id, enabled)
    return { updated, candidates: getCachedCandidates() }
  }

  async function removeCandidate(id) {
    await repository.removeCandidate(id)
    return getCachedCandidates()
  }

  async function restoreDefaultCandidates() {
    await repository.restoreDefaultCandidates()
    return getCachedCandidates()
  }

  return {
    loadCandidates,
    getCachedCandidates,
    addCandidate,
    editCandidate,
    setCandidateEnabled,
    removeCandidate,
    restoreDefaultCandidates
  }
}

module.exports = {
  ...createMealCandidateService(candidateRepository),
  createMealCandidateService
}
