const { createDefaultCandidates } = require('./candidate-defaults')

const KINDS = new Set(['life', 'inventory', 'favorites', 'shopping', 'mealCandidates'])

function mergeById(cloudItems, localItems, getTime = item => item.updatedAt || item.createdAt || 0) {
  const merged = new Map()
  ;[...(cloudItems || []), ...(localItems || [])].forEach(item => {
    if (!item || typeof item.id !== 'string') return
    const current = merged.get(item.id)
    if (!current || getTime(item) >= getTime(current)) merged.set(item.id, item)
  })
  return Array.from(merged.values())
}

function mergeData(kind, cloudData, localData) {
  if (kind === 'inventory') return mergeById(cloudData, localData)
  if (kind === 'favorites') return Array.from(new Set([...(cloudData || []), ...(localData || [])]))
  if (kind === 'shopping') return { ...(cloudData || {}), ...(localData || {}) }
  if (kind === 'mealCandidates') return mergeById(cloudData, localData)
  return {
    lists: mergeById(cloudData && cloudData.lists, localData && localData.lists),
    templates: mergeById(cloudData && cloudData.templates, localData && localData.templates),
    history: mergeById(cloudData && cloudData.history, localData && localData.history, item => item.completedAt || 0)
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 200)
  }
}

function defaultData(kind) {
  if (kind === 'life') return { lists: [], templates: [], history: [] }
  if (kind === 'shopping') return {}
  if (kind === 'mealCandidates') return createDefaultCandidates()
  return []
}

function isText(value, max) {
  return typeof value === 'string' && value.length <= max
}

function isTimestamp(value, nullable = false) {
  return (nullable && value === null) || (Number.isSafeInteger(value) && value >= 0)
}

function validateInventory(data) {
  return Array.isArray(data) && data.length <= 200 && data.every(item => item &&
    isText(item.id, 80) && item.id.length > 0 && isText(item.name, 40) && item.name.trim() &&
    Number.isFinite(item.quantity) && item.quantity >= 0 && item.quantity <= 100000 &&
    isText(item.unit, 12) && isText(item.expiryDate, 10) &&
    isTimestamp(item.createdAt) && isTimestamp(item.updatedAt))
}

function validateLife(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const { lists, templates, history } = data
  if (!Array.isArray(lists) || lists.length > 100 || !Array.isArray(templates) || templates.length > 100 || !Array.isArray(history) || history.length > 200) return false
  const validLists = lists.every(list => list && isText(list.id, 80) && list.id.length > 0 && isText(list.title, 40) && list.title.trim() &&
    isTimestamp(list.createdAt) && isTimestamp(list.updatedAt) && ['none', 'daily', 'weekly', 'monthly'].includes(list.repeat) &&
    isTimestamp(list.lastCompletedAt, true) && Array.isArray(list.items) && list.items.length <= 100 &&
    list.items.every(item => item && isText(item.id, 80) && isText(item.text, 80) && item.text.trim() && typeof item.done === 'boolean'))
  const validTemplates = templates.every(item => item && isText(item.id, 80) && isText(item.title, 40) &&
    isTimestamp(item.createdAt) && Array.isArray(item.items) && item.items.length <= 100 && item.items.every(text => isText(text, 80)))
  const validHistory = history.every(item => item && isText(item.id, 120) && isText(item.listId, 80) && isText(item.title, 40) &&
    isTimestamp(item.completedAt) && Array.isArray(item.items) && item.items.length <= 100 && item.items.every(text => isText(text, 80)))
  return validLists && validTemplates && validHistory
}

function validateFavorites(data) {
  return Array.isArray(data) && data.length <= 500 &&
    data.every(id => Number.isSafeInteger(id) && id > 0) && new Set(data).size === data.length
}

function validateShopping(data) {
  return data && typeof data === 'object' && !Array.isArray(data) &&
    Object.keys(data).length <= 500 && Object.keys(data).every(key => key.length > 0 && key.length <= 120 && data[key] === true)
}

function validateMealCandidates(data) {
  return Array.isArray(data) && data.length <= 100 && new Set(data.map(item => item && item.id)).size === data.length && data.every(item => item &&
    isText(item.id, 80) && item.id.length > 0 && ['dine_in', 'takeout'].includes(item.sourceType) &&
    isText(item.name, 40) && item.name.trim() && isText(item.note, 80) && item.dishId === null &&
    typeof item.enabled === 'boolean' && item.weight === 1 &&
    isTimestamp(item.createdAt) && isTimestamp(item.updatedAt))
}

function validateData(kind, data) {
  if (kind === 'inventory') return validateInventory(data)
  if (kind === 'life') return validateLife(data)
  if (kind === 'favorites') return validateFavorites(data)
  if (kind === 'shopping') return validateShopping(data)
  if (kind === 'mealCandidates') return validateMealCandidates(data)
  return false
}

function validateEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return { code: 40001, message: '请求参数格式不正确' }
  if (!['get', 'migrate', 'replace'].includes(event.action)) return { code: 40001, message: '操作类型不正确' }
  if (!KINDS.has(event.kind)) return { code: 40001, message: '数据类型不正确' }
  if (event.action === 'get') return null
  if (!validateData(event.kind, event.data)) return { code: 40001, message: '数据内容不正确' }
  if (event.action === 'migrate' && (typeof event.migrationId !== 'string' || !/^[A-Za-z0-9_-]{8,80}$/.test(event.migrationId))) {
    return { code: 40001, message: '迁移标识不正确' }
  }
  if (event.action === 'replace' && (!Number.isInteger(event.expectedRevision) || event.expectedRevision < 0)) {
    return { code: 40001, message: '数据修订号不正确' }
  }
  return null
}

module.exports = { mergeById, mergeData, defaultData, validateData, validateEvent }
