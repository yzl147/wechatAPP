const test = require('node:test')
const assert = require('node:assert/strict')
const { parseAmount, normalizeUnit } = require('../domain/shopping/ingredient-parser')
const { createShoppingItems } = require('../domain/shopping/shopping-calculator')

test('食材数量解析统一常见中英文单位', () => {
  assert.deepEqual(parseAmount(' 250g'), { quantity: 250, unit: '克' })
  assert.deepEqual(parseAmount('1.5 kg'), { quantity: 1.5, unit: '千克' })
  assert.deepEqual(parseAmount('2个'), { quantity: 2, unit: '个' })
  assert.equal(parseAmount('适量'), null)
  assert.equal(normalizeUnit('ML'), '毫升')
})

test('多道菜与份数会合并需求，库存充足时无需采购', () => {
  const cart = [
    { id: 1, name: '番茄炒蛋', quantity: 2, ingredients: [{ name: '鸡蛋', amount: '2个' }] },
    { id: 2, name: '蛋花汤', quantity: 1, ingredients: [{ name: '鸡蛋', amount: '1个' }] }
  ]
  const result = createShoppingItems(cart, [{ name: '鸡蛋', quantity: 6, unit: '个' }], {})

  assert.deepEqual(result, [{
    key: '鸡蛋-个',
    name: '鸡蛋',
    amount: '需要 5个',
    sourceText: '用于 番茄炒蛋 · 2 份、蛋花汤',
    isInStock: true,
    stockText: '家有 6个，库存充足',
    stockState: 'enough'
  }])
})

test('库存部分不足时显示准确缺口并保持待采购状态', () => {
  const cart = [{ id: 1, name: '番茄炒蛋', quantity: 1, ingredients: [{ name: '鸡蛋', amount: '3个' }] }]
  const result = createShoppingItems(cart, [{ name: '鸡蛋', quantity: 1, unit: '个' }], {})[0]

  assert.equal(result.amount, '需购 2个')
  assert.equal(result.stockText, '家有 1个，还差 2个')
  assert.equal(result.stockState, 'partial')
  assert.equal(result.isInStock, false)
})

test('无法计量的食材保留原文字并支持手动确认', () => {
  const cart = [{ foodId: 9, name: '清蒸鱼', quantity: 1, ingredients: [{ name: '盐', amount: '适量' }] }]
  const result = createShoppingItems(cart, [], { '9-盐-0': true })[0]

  assert.deepEqual(result, {
    key: '9-盐-0',
    name: '盐',
    amount: '适量',
    sourceText: '用于 清蒸鱼',
    isInStock: true,
    stockText: '请手动确认',
    stockState: 'manual'
  })
})
