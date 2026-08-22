const STORAGE_KEY = 'meal_shopping_checked_items'

function getCheckedMap() {
  const value = wx.getStorageSync(STORAGE_KEY)
  return value && typeof value === 'object' ? value : {}
}

function setItemChecked(key, checked) {
  const checkedMap = getCheckedMap()
  if (checked) {
    checkedMap[key] = true
  } else {
    delete checkedMap[key]
  }
  wx.setStorageSync(STORAGE_KEY, checkedMap)
}

function createShoppingItems(cartList) {
  const checkedMap = getCheckedMap()
  return cartList.reduce((items, food) => {
    const foodItems = (food.ingredients || []).map((ingredient, index) => {
      const key = `${food.foodId || food.id}-${ingredient.name}-${index}`
      const quantity = food.quantity || 1
      return {
        key,
        name: ingredient.name,
        amount: ingredient.amount || '适量',
        sourceText: quantity > 1 ? `用于 ${food.name} · ${quantity} 份` : `用于 ${food.name}`,
        isInStock: !!checkedMap[key]
      }
    })
    return items.concat(foodItems)
  }, [])
}

module.exports = { createShoppingItems, setItemChecked }
