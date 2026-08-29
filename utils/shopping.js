const STORAGE_KEY = 'meal_shopping_checked_items'
const inventoryUtil = require('./inventory')
const { createVersionedStorage, getBackupData, parseStoredValue } = require('./versioned-storage')
const { createUserDataSync } = require('./user-data-sync')
const shoppingCalculator = require('../domain/shopping/shopping-calculator')

const storage = createVersionedStorage({
  key: STORAGE_KEY,
  version: 2,
  defaultValue: {},
  migrations: {
    1: migrateCheckedMap,
    2: value => ({ ...migrateCheckedMap(getBackupData(STORAGE_KEY, 1)), ...migrateCheckedMap(value) })
  },
  validate: value => value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).every(key => value[key] === true)
})

function migrateCheckedMap(value) {
  const parsed = parseStoredValue(value)
  if (Array.isArray(parsed)) return parsed.reduce((map, key) => { map[String(key)] = true; return map }, {})
  if (!parsed || typeof parsed !== 'object') return {}
  return Object.keys(parsed).reduce((map, key) => {
    if (parsed[key]) map[key] = true
    return map
  }, {})
}

function getCheckedMap() {
  return storage.get()
}

function saveCheckedMap(checkedMap) {
  storage.save(checkedMap)
}

const cloudSync = createUserDataSync({ kind: 'shopping', getLocal: getCheckedMap, saveLocal: saveCheckedMap })

function syncShopping() {
  return cloudSync.sync()
}

function setItemChecked(key, checked) {
  return cloudSync.mutate(checkedMap => {
    const next = { ...checkedMap }
    if (checked) next[key] = true
    else delete next[key]
    return next
  })
}

function createShoppingItems(mealList) {
  return shoppingCalculator.createShoppingItems(mealList, inventoryUtil.getInventory(), getCheckedMap())
}

module.exports = { syncShopping, createShoppingItems, setItemChecked }
