function getSeedDocumentId(dishId) {
  return `seed-dish-${String(dishId).padStart(3, '0')}`
}

async function ensureDishesInitialized(database, dishes) {
  if (!database || typeof database.runTransaction !== 'function') {
    throw new TypeError('数据库不支持事务初始化')
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    throw new TypeError('初始化菜谱不能为空')
  }

  return database.runTransaction(async transaction => {
    const { data } = await transaction.collection('dishes').limit(1).get()
    if (data.length > 0) {
      return { initialized: false, count: data.length }
    }

    await Promise.all(dishes.map(dish =>
      transaction.collection('dishes').doc(getSeedDocumentId(dish.id)).set({ data: dish })
    ))
    return { initialized: true, count: dishes.length }
  })
}

module.exports = { ensureDishesInitialized, getSeedDocumentId }
