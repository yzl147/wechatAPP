const STORAGE_KEY = 'life_checklists'

function getLists() {
  const lists = wx.getStorageSync(STORAGE_KEY)
  return Array.isArray(lists) ? lists : []
}

function saveLists(lists) {
  wx.setStorageSync(STORAGE_KEY, lists)
}

function createList(title, itemTexts) {
  const now = Date.now()
  const list = {
    id: `${now}-${Math.floor(Math.random() * 1000)}`,
    title: title.trim(),
    createdAt: now,
    updatedAt: now,
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
  return getLists().find(list => list.id === id) || null
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
    items: list.items.map(item => item.id === itemId ? { ...item, done: !item.done } : item)
  }))
}

function addItem(listId, text) {
  return updateList(listId, list => ({
    ...list,
    items: list.items.concat({ id: `${Date.now()}-${list.items.length}`, text: text.trim(), done: false })
  }))
}

function removeItem(listId, itemId) {
  return updateList(listId, list => ({ ...list, items: list.items.filter(item => item.id !== itemId) }))
}

function removeList(id) {
  saveLists(getLists().filter(list => list.id !== id))
}

function getDisplayLists() {
  return getLists().map(list => ({
    ...list,
    doneCount: list.items.filter(item => item.done).length,
    totalCount: list.items.length
  })).sort((a, b) => b.updatedAt - a.updatedAt)
}

module.exports = { createList, getList, getDisplayLists, toggleItem, addItem, removeItem, removeList }
