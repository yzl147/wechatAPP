function createCookedItemSnapshot(dish, quantity) {
  return {
    id: dish.id,
    name: dish.name,
    icon: dish.icon || '',
    image: dish.image || '',
    bgStyle: dish.bgStyle || '',
    brief: dish.brief || '',
    category: dish.category || '',
    ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
    quantity
  }
}

function createExternalItemSnapshot(dishes, recordedAt) {
  return {
    id: `meal-${recordedAt}`,
    name: dishes.trim(),
    quantity: 1,
    image: ''
  }
}

function createMealRecordDocument({ orderId, openid, orderTime, items, remark, mealType, venue }) {
  return {
    orderId,
    _openid: openid,
    orderTime,
    items,
    totalCount: items.reduce((count, item) => count + (Number(item.quantity) || 0), 0),
    remark: (remark || '').trim(),
    mealType: mealType || 'cook',
    venue: (venue || '').trim()
  }
}

// 旧版小程序仍会读取价格和订单状态；这些默认值只存在于响应中。
function toLegacyCompatibleRecord(record) {
  if (!record) return null

  const items = Array.isArray(record.items)
    ? record.items.map(item => {
      const price = Number(item.price)
      const safePrice = Number.isFinite(price) ? price : 0
      const subtotal = Number(item.subtotal)
      return {
        ...item,
        price: safePrice,
        subtotal: Number.isFinite(subtotal)
          ? subtotal
          : parseFloat((safePrice * (Number(item.quantity) || 0)).toFixed(2))
      }
    })
    : []
  const totalPrice = Number(record.totalPrice)

  return {
    ...record,
    status: record.status || 'completed',
    items,
    totalPrice: Number.isFinite(totalPrice) ? totalPrice : 0
  }
}

module.exports = {
  createCookedItemSnapshot,
  createExternalItemSnapshot,
  createMealRecordDocument,
  toLegacyCompatibleRecord
}
