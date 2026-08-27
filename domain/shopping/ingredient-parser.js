function parseAmount(amount) {
  const match = String(amount || '').trim().match(/^(\d+(?:\.\d+)?)\s*(kg|g|ml|个|克|毫升|勺|茶匙|把|根|头|块|碗|罐|片|袋|粒)/i)
  if (!match) return null
  return { quantity: Number(match[1]), unit: normalizeUnit(match[2]) }
}

function normalizeUnit(unit) {
  const value = String(unit || '').toLowerCase()
  if (value === 'g') return '克'
  if (value === 'kg') return '千克'
  if (value === 'ml') return '毫升'
  return value
}

function formatNumber(value) {
  return Number.isInteger(value) ? value : Number(value.toFixed(1))
}

module.exports = { parseAmount, normalizeUnit, formatNumber }
