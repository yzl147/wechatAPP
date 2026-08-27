const test = require('node:test')
const assert = require('node:assert/strict')
const { drawFromBag, createEmptyBagState, shuffle } = require('../domain/meal-decision/random-bag')

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

test('抽签袋一轮内不重复且新一轮不会立即重复上次结果', () => {
  let state = createEmptyBagState()
  const picked = []
  for (let index = 0; index < 4; index += 1) {
    const result = drawFromBag(items, state, () => 0)
    picked.push(result.item.id)
    state = result.state
  }

  assert.equal(new Set(picked.slice(0, 3)).size, 3)
  assert.notEqual(picked[3], picked[2])
})

test('只有一个候选时允许重复且空候选返回空状态', () => {
  const first = drawFromBag([{ id: 'only' }], createEmptyBagState(), () => 0)
  const second = drawFromBag([{ id: 'only' }], first.state, () => 0)

  assert.equal(first.item.id, 'only')
  assert.equal(second.item.id, 'only')
  assert.deepEqual(drawFromBag([], second.state), { item: null, state: createEmptyBagState() })
})

test('候选关闭或删除后不会再抽中，新增候选会进入当前抽签袋', () => {
  const first = drawFromBag([{ id: 'a' }, { id: 'b' }], createEmptyBagState(), () => 0)
  const changed = drawFromBag([{ id: 'a' }, { id: 'c' }], first.state, () => 0)

  assert.notEqual(changed.item.id, 'b')
  assert.equal(changed.state.cycleIds.includes('c'), true)
})

test('随机源边界值不会产生越界索引且不修改输入数组', () => {
  const source = ['a', 'b', 'c']
  const result = shuffle(source, () => 1)

  assert.deepEqual(result, ['a', 'b', 'c'])
  assert.deepEqual(source, ['a', 'b', 'c'])
})
