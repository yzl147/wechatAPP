const SOURCE_TYPES = ['dine_in', 'takeout', 'cook']
const SOURCE_LABELS = {
  dine_in: '堂食',
  takeout: '外卖',
  cook: '自己做'
}

function buildCandidatePools({ customCandidates = [], dishes = [] }) {
  return {
    dine_in: customCandidates.filter(item => item.sourceType === 'dine_in' && item.enabled),
    takeout: customCandidates.filter(item => item.sourceType === 'takeout' && item.enabled),
    cook: dishes.map(toCookCandidate).filter(Boolean)
  }
}

function evaluateSources(selectedSources, pools) {
  const selected = normalizeSelectedSources(selectedSources)
  const eligibleSources = []
  const unavailableSources = []

  selected.forEach(sourceType => {
    const count = Array.isArray(pools[sourceType]) ? pools[sourceType].length : 0
    const source = { id: sourceType, sourceType, name: SOURCE_LABELS[sourceType], count }
    if (count > 0) eligibleSources.push(source)
    else unavailableSources.push(source)
  })

  return { selectedSources: selected, eligibleSources, unavailableSources }
}

function normalizeSelectedSources(selectedSources) {
  if (!Array.isArray(selectedSources)) return []
  return Array.from(new Set(selectedSources.filter(sourceType => SOURCE_TYPES.includes(sourceType))))
}

function toCookCandidate(dish) {
  const dishId = Number(dish && dish.id)
  const name = String(dish && dish.name || '').trim()
  if (!Number.isSafeInteger(dishId) || dishId <= 0 || !name) return null
  return {
    id: `dish-${dishId}`,
    sourceType: 'cook',
    name,
    note: '',
    dishId,
    enabled: true,
    weight: 1
  }
}

module.exports = {
  SOURCE_TYPES,
  SOURCE_LABELS,
  buildCandidatePools,
  evaluateSources,
  normalizeSelectedSources,
  toCookCandidate
}
