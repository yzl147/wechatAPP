const STORAGE_KEY = 'life_checklists'
const TEMPLATE_STORAGE_KEY = 'life_list_custom_templates'
const HISTORY_STORAGE_KEY = 'life_list_completion_history'
const { createVersionedStorage, getBackupData, parseStoredValue } = require('./versioned-storage')

const listStorage = createVersionedStorage({
  key: STORAGE_KEY,
  version: 2,
  defaultValue: [],
  migrations: {
    1: migrateLists,
    2: value => mergeById(migrateLists(getBackupData(STORAGE_KEY, 1)), migrateLists(value))
  },
  validate: value => Array.isArray(value) && value.every(isLifeList)
})
const templateStorage = createVersionedStorage({
  key: TEMPLATE_STORAGE_KEY,
  version: 2,
  defaultValue: [],
  migrations: {
    1: migrateTemplates,
    2: value => mergeById(migrateTemplates(getBackupData(TEMPLATE_STORAGE_KEY, 1)), migrateTemplates(value))
  },
  validate: value => Array.isArray(value) && value.every(item => item && typeof item.id === 'string' && typeof item.title === 'string' && Array.isArray(item.items))
})
const historyStorage = createVersionedStorage({
  key: HISTORY_STORAGE_KEY,
  version: 2,
  defaultValue: [],
  migrations: {
    1: migrateHistory,
    2: value => mergeById(migrateHistory(getBackupData(HISTORY_STORAGE_KEY, 1)), migrateHistory(value))
  },
  validate: value => Array.isArray(value) && value.every(item => item && typeof item.id === 'string' && typeof item.title === 'string' && Number.isSafeInteger(item.completedAt) && Array.isArray(item.items))
})

function getLists() {
  return listStorage.get()
}

function saveLists(lists) {
  listStorage.save(lists)
}

function createList(title, itemTexts, repeat = 'none') {
  const now = Date.now()
  const list = {
    id: `${now}-${Math.floor(Math.random() * 1000)}`,
    title: title.trim(),
    createdAt: now,
    updatedAt: now,
    repeat,
    lastCompletedAt: null,
    items: itemTexts.filter(Boolean).map((text, index) => ({
      id: `${now}-${index}`,
      text: text.trim(),
      done: false
    }))
  }
  const lists = getLists()
  lists.unshift(list)
  saveLists(lists)
  return list
}

function getList(id) {
  const lists = refreshRecurringLists(getLists())
  return toDisplayList(lists.find(list => list.id === id))
}

function updateList(id, updater) {
  const lists = getLists().map(list => {
    if (list.id !== id) return list
    return { ...updater(list), updatedAt: Date.now() }
  })
  saveLists(lists)
  return lists.find(list => list.id === id) || null
}

function toggleItem(listId, itemId) {
  return updateList(listId, list => ({
    ...list,
    items: list.items.map(item => item.id === itemId ? { ...item, done: !item.done } : item),
    lastCompletedAt: null
  }))
}

function addItem(listId, text) {
  return updateList(listId, list => ({
    ...list,
    lastCompletedAt: null,
    items: list.items.concat({ id: `${Date.now()}-${list.items.length}`, text: text.trim(), done: false })
  }))
}

function removeItem(listId, itemId) {
  return updateList(listId, list => ({ ...list, items: list.items.filter(item => item.id !== itemId) }))
}

function removeList(id) {
  saveLists(getLists().filter(list => list.id !== id))
}

function getCustomTemplates() {
  return templateStorage.get()
}

function saveAsTemplate(list) {
  if (!list || !list.title || !list.items || list.items.length === 0) return null
  const templates = getCustomTemplates()
  const template = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: list.title,
    items: list.items.map(item => item.text).filter(Boolean),
    createdAt: Date.now()
  }
  templates.unshift(template)
  templateStorage.save(templates)
  return template
}

function getDisplayLists() {
  return refreshRecurringLists(getLists()).map(toDisplayList)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

function refreshRecurringLists(lists) {
  let changed = false
  const refreshed = lists.map(list => {
    if (!shouldStartNextRound(list)) return list
    changed = true
    return {
      ...list,
      items: list.items.map(item => ({ ...item, done: false })),
      lastCompletedAt: null,
      updatedAt: Date.now()
    }
  })
  if (changed) saveLists(refreshed)
  return refreshed
}

function shouldStartNextRound(list) {
  if (!list.repeat || list.repeat === 'none' || !list.lastCompletedAt) return false
  const interval = { daily: 86400000, weekly: 7 * 86400000, monthly: 30 * 86400000 }[list.repeat]
  return Date.now() - list.lastCompletedAt >= interval
}

function toDisplayList(list) {
  if (!list) return null
  const doneCount = list.items.filter(item => item.done).length
  const isCompleted = list.items.length > 0 && doneCount === list.items.length
  if (isCompleted && !list.lastCompletedAt) {
    const completedAt = Date.now()
    const lists = getLists().map(item => item.id === list.id ? { ...item, lastCompletedAt: completedAt, updatedAt: completedAt } : item)
    saveLists(lists)
    addCompletionHistory({
      listId: list.id,
      title: list.title,
      completedAt,
      items: list.items.map(item => item.text)
    })
    list = lists.find(item => item.id === list.id)
  }
  return {
    ...list,
    doneCount,
    totalCount: list.items.length,
    isCompleted,
    repeatText: { daily: '每天重复', weekly: '每周重复', monthly: '每月重复' }[list.repeat] || '不重复',
    lastCompletedText: list.lastCompletedAt ? `上次完成 ${formatDate(list.lastCompletedAt)}` : ''
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}-${date.getDate()}`
}

function addCompletionHistory(record) {
  const history = getCompletionHistory()
  history.unshift({ id: `${record.completedAt}-${record.listId}`, ...record })
  historyStorage.save(history.slice(0, 200))
}

function getCompletionHistory() {
  return historyStorage.get()
}

function getCompletionRecord(id) {
  return getCompletionHistory().find(item => item.id === id) || null
}

function migrateLists(value) {
  const parsed = parseStoredValue(value)
  const source = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.lists) ? parsed.lists : [])
  return source.filter(item => item && typeof item === 'object' && String(item.title || '').trim()).map((item, index) => {
    const createdAt = Number.isSafeInteger(item.createdAt) ? item.createdAt : 0
    const rawItems = Array.isArray(item.items) ? item.items : []
    return {
      id: typeof item.id === 'string' && item.id ? item.id : `legacy-list-${createdAt}-${index}`,
      title: String(item.title).trim(),
      createdAt,
      updatedAt: Number.isSafeInteger(item.updatedAt) ? item.updatedAt : createdAt,
      repeat: ['none', 'daily', 'weekly', 'monthly'].includes(item.repeat) ? item.repeat : 'none',
      lastCompletedAt: Number.isSafeInteger(item.lastCompletedAt) ? item.lastCompletedAt : null,
      items: rawItems.map((entry, itemIndex) => ({
        id: entry && typeof entry === 'object' && typeof entry.id === 'string' ? entry.id : `${createdAt}-${itemIndex}`,
        text: String(entry && typeof entry === 'object' ? entry.text || '' : entry || '').trim(),
        done: !!(entry && typeof entry === 'object' && entry.done)
      })).filter(entry => entry.text)
    }
  })
}

function migrateTemplates(value) {
  const parsed = parseStoredValue(value)
  const source = Array.isArray(parsed) ? parsed : []
  return source.filter(item => item && String(item.title || '').trim()).map((item, index) => ({
    id: typeof item.id === 'string' && item.id ? item.id : `legacy-template-${index}`,
    title: String(item.title).trim(),
    items: Array.isArray(item.items) ? item.items.map(text => String(text).trim()).filter(Boolean) : [],
    createdAt: Number.isSafeInteger(item.createdAt) ? item.createdAt : 0
  }))
}

function migrateHistory(value) {
  const parsed = parseStoredValue(value)
  const source = Array.isArray(parsed) ? parsed : []
  return source.filter(item => item && String(item.title || '').trim() && Number.isSafeInteger(item.completedAt)).map((item, index) => ({
    id: typeof item.id === 'string' && item.id ? item.id : `${item.completedAt}-legacy-${index}`,
    listId: typeof item.listId === 'string' ? item.listId : '',
    title: String(item.title).trim(),
    completedAt: item.completedAt,
    items: Array.isArray(item.items) ? item.items.map(text => String(text).trim()).filter(Boolean) : []
  }))
}

function isLifeList(item) {
  return item && typeof item.id === 'string' && typeof item.title === 'string' &&
    Number.isSafeInteger(item.createdAt) && Number.isSafeInteger(item.updatedAt) &&
    Array.isArray(item.items) && item.items.every(entry => entry && typeof entry.id === 'string' && typeof entry.text === 'string' && typeof entry.done === 'boolean')
}

function mergeById(recovered, current) {
  const currentIds = new Set(current.map(item => item.id))
  return current.concat(recovered.filter(item => !currentIds.has(item.id)))
}

module.exports = { createList, getList, getDisplayLists, toggleItem, addItem, removeItem, removeList, getCustomTemplates, saveAsTemplate, getCompletionHistory, getCompletionRecord }
