function drawFromBag(items, previousState = {}, random = Math.random) {
  const availableItems = uniqueItems(items)
  if (availableItems.length === 0) return { item: null, state: createEmptyBagState() }

  const availableIds = availableItems.map(item => item.id)
  const availableSet = new Set(availableIds)
  const previousCycleIds = uniqueIds(previousState.cycleIds).filter(id => availableSet.has(id))
  let remainingIds = uniqueIds(previousState.remainingIds).filter(id => availableSet.has(id))
  const newIds = availableIds.filter(id => !previousCycleIds.includes(id))
  if (newIds.length > 0) remainingIds = remainingIds.concat(shuffle(newIds, random))

  const lastPickedId = availableSet.has(previousState.lastPickedId) ? previousState.lastPickedId : null
  if (remainingIds.length === 0 || shouldRestartToAvoidRepeat(remainingIds, availableIds, lastPickedId)) {
    remainingIds = shuffle(availableIds, random)
  }
  moveLastPickedAwayFromFront(remainingIds, lastPickedId)

  const pickedId = remainingIds.shift()
  return {
    item: availableItems.find(item => item.id === pickedId) || null,
    state: {
      remainingIds,
      cycleIds: availableIds,
      lastPickedId: pickedId
    }
  }
}

function createEmptyBagState() {
  return { remainingIds: [], cycleIds: [], lastPickedId: null }
}

function shouldRestartToAvoidRepeat(remainingIds, availableIds, lastPickedId) {
  return availableIds.length > 1 && remainingIds.length === 1 && remainingIds[0] === lastPickedId
}

function moveLastPickedAwayFromFront(ids, lastPickedId) {
  if (ids.length <= 1 || ids[0] !== lastPickedId) return
  const alternateIndex = ids.findIndex(id => id !== lastPickedId)
  if (alternateIndex > 0) [ids[0], ids[alternateIndex]] = [ids[alternateIndex], ids[0]]
}

function shuffle(values, random) {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomValue = Number(random())
    const target = Math.min(index, Math.max(0, Math.floor((Number.isFinite(randomValue) ? randomValue : 0) * (index + 1))))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function uniqueItems(items) {
  if (!Array.isArray(items)) return []
  const seen = new Set()
  return items.filter(item => {
    if (!item || typeof item.id !== 'string' || !item.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function uniqueIds(ids) {
  return Array.isArray(ids) ? Array.from(new Set(ids.filter(id => typeof id === 'string' && id))) : []
}

module.exports = { drawFromBag, createEmptyBagState, shuffle }
