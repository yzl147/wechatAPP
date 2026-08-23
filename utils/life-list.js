const STORAGE_KEY = 'life_checklists'
const TEMPLATE_STORAGE_KEY = 'life_list_custom_templates'

function getLists() {
  const lists = wx.getStorageSync(STORAGE_KEY)
  return Array.isArray(lists) ? lists : []
}

function saveLists(lists) {
  wx.setStorageSync(STORAGE_KEY, lists)
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
  const templates = wx.getStorageSync(TEMPLATE_STORAGE_KEY)
  return Array.isArray(templates) ? templates : []
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
  wx.setStorageSync(TEMPLATE_STORAGE_KEY, templates)
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
  if (isCompleted && list.repeat && list.repeat !== 'none' && !list.lastCompletedAt) {
    const lists = getLists().map(item => item.id === list.id ? { ...item, lastCompletedAt: Date.now(), updatedAt: Date.now() } : item)
    saveLists(lists)
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

module.exports = { createList, getList, getDisplayLists, toggleItem, addItem, removeItem, removeList, getCustomTemplates, saveAsTemplate }
