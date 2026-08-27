const test = require('node:test')
const assert = require('node:assert/strict')
const { createVersionedStorage } = require('../utils/versioned-storage')

function installStorage(initial = {}, shouldFail) {
  const values = new Map(Object.entries(initial))
  const toasts = []
  global.wx = {
    getStorageSync(key) { return values.has(key) ? values.get(key) : '' },
    setStorageSync(key, value) {
      if (shouldFail && shouldFail(key, value)) throw new Error('storage full')
      values.set(key, value)
    },
    showToast(options) { toasts.push(options) }
  }
  values.toasts = toasts
  return values
}

function reload(modulePath) {
  const resolved = require.resolve(modulePath)
  delete require.cache[resolved]
  return require(modulePath)
}

test.afterEach(() => {
  delete global.wx
})

test('旧库存数组迁移为带版本信封并保留原始备份', () => {
  const legacy = [{ name: '鸡蛋', quantity: '6', unit: '个' }]
  const values = installStorage({ ingredient_inventory: legacy })
  const inventory = reload('../utils/inventory')

  const first = inventory.getInventory()
  const saved = values.get('ingredient_inventory')
  const backup = values.get('ingredient_inventory__backup_before_v2')

  assert.equal(first[0].name, '鸡蛋')
  assert.equal(first[0].quantity, 6)
  assert.equal(saved.schemaVersion, 2)
  assert.deepEqual(backup.data, legacy)
  assert.deepEqual(inventory.getInventory(), first)
})

test('另一种旧库存对象结构也能得到相同规范数据', () => {
  const values = installStorage({
    ingredient_inventory: JSON.stringify({ items: [{ id: 'egg', name: ' 鸡蛋 ', quantity: 2, unit: '个', createdAt: 10 }] })
  })
  const inventory = reload('../utils/inventory')
  const items = inventory.getInventory()

  assert.deepEqual(items, [{
    id: 'egg',
    name: '鸡蛋',
    quantity: 2,
    unit: '个',
    expiryDate: '',
    createdAt: 10
  }])
  assert.equal(values.get('ingredient_inventory').schemaVersion, 2)
})

test('v2 会从首次 v1 备份补回丢失库存且保留当前新增项', () => {
  const oldEgg = { id: 'old-egg', name: '鸡蛋', quantity: 6, unit: '个', expiryDate: '', createdAt: 10 }
  const newMilk = { id: 'new-milk', name: '牛奶', quantity: 1, unit: '盒', expiryDate: '', createdAt: 20 }
  const values = installStorage({
    ingredient_inventory: { schemaVersion: 1, data: [newMilk], updatedAt: 30 },
    ingredient_inventory__backup_before_v1: { createdAt: 15, data: [oldEgg] }
  })
  const inventory = reload('../utils/inventory')
  const items = inventory.getInventory()

  assert.deepEqual(items.map(item => item.id), ['new-milk', 'old-egg'])
  assert.equal(values.get('ingredient_inventory').schemaVersion, 2)
})

test('v2 会从首次 v1 备份恢复生活清单和收藏', async () => {
  const oldList = {
    id: 'old-list', title: '原来的清单', createdAt: 10, updatedAt: 10,
    repeat: 'none', lastCompletedAt: null,
    items: [{ id: 'old-item', text: '原来的项目', done: false }]
  }
  const values = installStorage({
    life_checklists: { schemaVersion: 1, data: [], updatedAt: 20 },
    life_checklists__backup_before_v1: { createdAt: 10, data: [oldList] },
    favorite_food_ids: { schemaVersion: 1, data: [], updatedAt: 20 },
    favorite_food_ids__backup_before_v1: { createdAt: 10, data: [2, 13] }
  })
  const lifeList = reload('../utils/life-list')
  const favorite = reload('../utils/favorite')

  assert.equal(lifeList.getDisplayLists()[0].id, 'old-list')
  assert.deepEqual(await favorite.getFavoriteIds(), [2, 13])
  assert.equal(values.get('life_checklists').schemaVersion, 2)
  assert.equal(values.get('favorite_food_ids').schemaVersion, 2)
})

test('旧生活清单中的字符串项目迁移后仍可正常展示', () => {
  installStorage({
    life_checklists: [{
      title: '周末家务',
      createdAt: 100,
      items: ['洗碗', { id: 'item-2', text: '拖地', done: true }]
    }]
  })
  const lifeList = reload('../utils/life-list')
  const lists = lifeList.getDisplayLists()

  assert.equal(lists.length, 1)
  assert.equal(lists[0].items[0].text, '洗碗')
  assert.equal(lists[0].items[0].done, false)
  assert.equal(lists[0].doneCount, 1)
})

test('旧采购勾选数组迁移为布尔映射', () => {
  const values = installStorage({ meal_shopping_checked_items: ['鸡蛋-个', '葱-根'] })
  const shopping = reload('../utils/shopping')
  shopping.setItemChecked('鸡蛋-个', false)

  assert.deepEqual(values.get('meal_shopping_checked_items').data, { '葱-根': true })
})

test('不可识别的未来版本返回默认值且不覆盖原数据', () => {
  const raw = { schemaVersion: 9, data: ['future'] }
  const values = installStorage({ example: raw })
  const storage = createVersionedStorage({
    key: 'example',
    version: 1,
    defaultValue: [],
    migrations: { 1: value => value },
    validate: Array.isArray
  })

  assert.deepEqual(storage.get(), [])
  assert.deepEqual(values.get('example'), raw)
  assert.deepEqual(values.get(storage.backupKey).data, raw)
})

test('迁移前备份失败时不写入新结构', () => {
  const legacy = ['old']
  const values = installStorage({ example: legacy }, key => key.includes('__backup_'))
  const storage = createVersionedStorage({
    key: 'example',
    version: 1,
    defaultValue: [],
    migrations: { 1: value => value },
    validate: Array.isArray
  })

  assert.deepEqual(storage.get(), legacy)
  assert.deepEqual(values.get('example'), legacy)
  assert.equal(values.toasts[0].title, '数据升级暂未保存，原数据仍保留')
})
