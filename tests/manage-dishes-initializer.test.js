const test = require('node:test')
const assert = require('node:assert/strict')
const { ensureDishesInitialized, getSeedDocumentId } = require('../cloudfunctions/manageDishes/initializer')

function createTransactionDatabase(options = {}) {
  const documents = new Map(options.initialDocuments || [])
  let transactionQueue = Promise.resolve()
  let writeCount = 0

  return {
    documents,
    get writeCount() { return writeCount },
    runTransaction(work) {
      const result = transactionQueue.then(async () => {
        const staged = new Map(documents)
        const transaction = {
          collection() {
            return {
              limit() {
                return { get: async () => ({ data: [...staged.values()].slice(0, 1) }) }
              },
              doc(id) {
                return {
                  set: async ({ data }) => {
                    if (options.failOnId === id) throw new Error('模拟写入失败')
                    staged.set(id, data)
                    writeCount += 1
                  }
                }
              }
            }
          }
        }
        const value = await work(transaction)
        documents.clear()
        staged.forEach((data, id) => documents.set(id, data))
        return value
      })
      transactionQueue = result.catch(() => {})
      return result
    }
  }
}

const dishes = Array.from({ length: 20 }, (_, index) => ({ id: index + 1, name: `菜谱${index + 1}` }))

test('并发空库初始化只写入一套固定 ID 菜谱', async () => {
  const database = createTransactionDatabase()
  const results = await Promise.all(Array.from({ length: 8 }, () => ensureDishesInitialized(database, dishes)))

  assert.equal(database.documents.size, 20)
  assert.equal(database.writeCount, 20)
  assert.equal(results.filter(result => result.initialized).length, 1)
  dishes.forEach(dish => assert.deepEqual(database.documents.get(getSeedDocumentId(dish.id)), dish))
})

test('已有菜谱时不执行任何初始化写入', async () => {
  const database = createTransactionDatabase({ initialDocuments: [['existing', { id: 99 }]] })
  const result = await ensureDishesInitialized(database, dishes)

  assert.deepEqual(result, { initialized: false, count: 1 })
  assert.equal(database.writeCount, 0)
  assert.equal(database.documents.size, 1)
})

test('初始化写入失败时事务不留下部分菜谱', async () => {
  const database = createTransactionDatabase({ failOnId: getSeedDocumentId(10) })

  await assert.rejects(() => ensureDishesInitialized(database, dishes), /模拟写入失败/)
  assert.equal(database.documents.size, 0)
})

test('固定种子文档 ID 对同一菜谱始终一致', () => {
  assert.equal(getSeedDocumentId(1), 'seed-dish-001')
  assert.equal(getSeedDocumentId(20), 'seed-dish-020')
})
