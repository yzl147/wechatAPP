const DEFAULT_COLORS = ['#f45b2a', '#477aa9', '#248a58', '#e8a23a', '#8b6bb8', '#3f8f9d']

function normalizeDegrees(value) {
  const degrees = Number(value)
  if (!Number.isFinite(degrees)) return 0
  return ((degrees % 360) + 360) % 360
}

function normalizeWheelItems(items) {
  if (!Array.isArray(items)) return []
  const seen = new Set()
  return items.reduce((result, item, index) => {
    if (!item || item.id === undefined || item.id === null) return result
    const id = String(item.id).trim()
    const label = String(item.label || item.name || '').trim()
    if (!id || !label || seen.has(id)) return result
    seen.add(id)
    result.push({
      id,
      label,
      color: isColor(item.color) ? item.color : DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    })
    return result
  }, [])
}

function buildSectorLayout(items) {
  const normalized = normalizeWheelItems(items)
  if (normalized.length === 0) return []
  const sectorAngle = Math.PI * 2 / normalized.length
  const firstStart = -Math.PI / 2 - sectorAngle / 2
  return normalized.map((item, index) => ({
    ...item,
    index,
    startAngle: firstStart + sectorAngle * index,
    endAngle: firstStart + sectorAngle * (index + 1),
    centerAngle: -Math.PI / 2 + sectorAngle * index
  }))
}

function getSpinTarget(currentRotation, itemCount, selectedIndex, turns = 5) {
  const count = Number(itemCount)
  const index = Number(selectedIndex)
  if (!Number.isInteger(count) || count <= 0) throw new RangeError('itemCount must be a positive integer')
  if (!Number.isInteger(index) || index < 0 || index >= count) throw new RangeError('selectedIndex is out of range')
  const safeTurns = Math.max(0, Math.floor(Number(turns) || 0))
  const current = Number.isFinite(Number(currentRotation)) ? Number(currentRotation) : 0
  const targetOrientation = normalizeDegrees(-index * (360 / count))
  const delta = normalizeDegrees(targetOrientation - normalizeDegrees(current))
  return current + safeTurns * 360 + delta
}

function truncateWheelLabel(label, itemCount) {
  const characters = Array.from(String(label || '').trim())
  const count = Number(itemCount) || 0
  const limit = count <= 4 ? 8 : count <= 8 ? 6 : count <= 12 ? 4 : 3
  return characters.length > limit ? `${characters.slice(0, limit).join('')}…` : characters.join('')
}

function isColor(value) {
  return typeof value === 'string' && /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i.test(value.trim())
}

module.exports = {
  DEFAULT_COLORS,
  normalizeDegrees,
  normalizeWheelItems,
  buildSectorLayout,
  getSpinTarget,
  truncateWheelLabel
}
