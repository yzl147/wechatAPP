const test = require('node:test')
const assert = require('node:assert/strict')
const { mergeData, validateData, validateEvent } = require('../cloudfunctions/manageUserData/domain')

function inventoryItem(id, quantity, updatedAt) {
  return { id, name: '鸡蛋', quantity, unit: '个', expiryDate: '', createdAt: 1, updatedAt }
}

function lifeList(id, updatedAt) {
  return {
    id,
    title: '家务清单',
    createdAt: 1,
    updatedAt,
    repeat: 'weekly',
    lastCompletedAt: null,
    items: [{ id: `${id}-item`, text: '倒垃圾', done: false }]
  }
}

test('库存迁移按稳定 ID 合并且较新的本地数据优先', () => {
  const cloud = [inventoryItem('egg', 2, 10), inventoryItem('milk', 1, 20)]
  const local = [inventoryItem('egg', 6, 30)]
  const merged = mergeData('inventory', cloud, local)

  assert.equal(merged.length, 2)
  assert.equal(merged.find(item => item.id === 'egg').quantity, 6)
  assert.equal(mergeData('inventory', merged, local).length, 2)
})

test('生活清单迁移不会重复列表、模板和完成历史', () => {
  const local = {
    lists: [lifeList('list-1', 20)],
    templates: [{ id: 'tpl-1', title: '模板', items: ['事项'], createdAt: 1 }],
    history: [{ id: 'history-1', listId: 'list-1', title: '家务清单', completedAt: 10, items: ['倒垃圾'] }]
  }
  const merged = mergeData('life', local, local)

  assert.equal(merged.lists.length, 1)
  assert.equal(merged.templates.length, 1)
  assert.equal(merged.history.length, 1)
  assert.equal(validateData('life', merged), true)
})

test('用户数据云函数拒绝越界内容和错误修订号', () => {
  assert.equal(validateEvent({ action: 'get', kind: 'life' }), null)
  assert.equal(validateEvent({ action: 'get', kind: 'unknown' }).code, 40001)
  assert.equal(validateEvent({ action: 'migrate', kind: 'inventory', data: [], migrationId: 'inventory_123456' }), null)
  assert.equal(validateEvent({ action: 'migrate', kind: 'inventory', data: [], migrationId: 'bad' }).code, 40001)
  assert.equal(validateEvent({ action: 'replace', kind: 'inventory', data: [], expectedRevision: -1 }).code, 40001)
  assert.equal(validateData('inventory', [inventoryItem('egg', 6, 20)]), true)
  assert.equal(validateData('inventory', [inventoryItem('egg', -1, 20)]), false)
})

test('收藏与采购状态首次迁移合并后不会重复或丢失', () => {
  assert.deepEqual(mergeData('favorites', [2, 13], [13, 20]), [2, 13, 20])
  assert.deepEqual(mergeData('shopping', { '鸡蛋-个': true }, { '葱-根': true }), {
    '鸡蛋-个': true,
    '葱-根': true
  })
  assert.equal(validateData('favorites', [2, 13, 20]), true)
  assert.equal(validateData('favorites', [2, 2]), false)
  assert.equal(validateData('shopping', { '鸡蛋-个': true }), true)
  assert.equal(validateData('shopping', { '鸡蛋-个': false }), false)
})
