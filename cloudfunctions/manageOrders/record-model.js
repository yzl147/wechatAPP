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

// 历史文档原样保留在数据库中，当前响应不再暴露点餐金额和订单状态。
function toCurrentRecord(record) {
  if (!record) return null
  const currentRecord = { ...record }
  delete currentRecord.status
  delete currentRecord.completedTime
  delete currentRecord.totalPrice
  currentRecord.items = Array.isArray(record.items)
    ? record.items.map(item => {
      const currentItem = { ...item }
      delete currentItem.price
      delete currentItem.subtotal
      return currentItem
    })
    : []
  return currentRecord
}

module.exports = {
  createCookedItemSnapshot,
  createExternalItemSnapshot,
  createMealRecordDocument,
  toCurrentRecord
}
