const STORAGE_KEY = 'ingredient_inventory'
const { createVersionedStorage, getBackupData, parseStoredValue } = require('./versioned-storage')
const { createUserDataSync } = require('./user-data-sync')
const { createDisplayInventory } = require('../domain/inventory/expiry-calculator')

const storage = createVersionedStorage({
  key: STORAGE_KEY,
  version: 3,
  defaultValue: [],
  migrations: {
    1: migrateInventory,
    2: value => mergeById(migrateInventory(getBackupData(STORAGE_KEY, 1)), migrateInventory(value)),
    3: migrateInventory
  },
  validate: value => Array.isArray(value) && value.every(isInventoryItem)
})

function getInventory() {
  return storage.get()
}

function saveInventory(items) {
  storage.save(items)
}

const cloudSync = createUserDataSync({ kind: 'inventory', getLocal: getInventory, saveLocal: saveInventory })

function syncInventory() {
  return cloudSync.sync()
}

async function addInventory(item) {
  const now = Date.now()
  const inventoryItem = {
    id: `${now}-${Math.floor(Math.random() * 1000)}`,
    name: item.name.trim(),
    quantity: Number(item.quantity),
    unit: item.unit.trim() || '份',
    expiryDate: item.expiryDate || '',
    createdAt: now,
    updatedAt: now
  }
  await cloudSync.mutate(items => [inventoryItem, ...items])
  return inventoryItem
}

async function updateQuantity(id, delta) {
  return cloudSync.mutate(items => items.map(item => {
    if (item.id !== id) return item
    return { ...item, quantity: Math.max(0, Number(item.quantity) + delta), updatedAt: Date.now() }
  }))
}

async function removeInventory(id) {
  return cloudSync.mutate(items => items.filter(item => item.id !== id))
}

function getDisplayInventory() {
  return createDisplayInventory(getInventory())
}

function migrateInventory(value) {
  const parsed = parseStoredValue(value)
  const items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : [])
  return items.filter(item => item && typeof item === 'object' && String(item.name || '').trim()).map((item, index) => {
    const createdAt = Number.isSafeInteger(item.createdAt) ? item.createdAt : 0
    return {
      id: typeof item.id === 'string' && item.id ? item.id : `legacy-inventory-${createdAt}-${index}`,
      name: String(item.name).trim(),
      quantity: Math.max(0, Number(item.quantity) || 0),
      unit: String(item.unit || '份').trim() || '份',
      expiryDate: typeof item.expiryDate === 'string' ? item.expiryDate : '',
      createdAt,
      updatedAt: Number.isSafeInteger(item.updatedAt) ? item.updatedAt : createdAt
    }
  })
}

function mergeById(recovered, current) {
  const currentIds = new Set(current.map(item => item.id))
  return current.concat(recovered.filter(item => !currentIds.has(item.id)))
}

function isInventoryItem(item) {
  return item && typeof item.id === 'string' && typeof item.name === 'string' && item.name.length > 0 &&
    Number.isFinite(item.quantity) && item.quantity >= 0 && typeof item.unit === 'string' &&
    typeof item.expiryDate === 'string' && Number.isSafeInteger(item.createdAt) && Number.isSafeInteger(item.updatedAt)
}

module.exports = { syncInventory, getInventory, addInventory, updateQuantity, removeInventory, getDisplayInventory }
