const STORAGE_KEY = 'meal_shopping_checked_items'
const inventoryUtil = require('./inventory')

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
  const inventory = inventoryUtil.getInventory()
  const groupedItems = {}
  const uncountableItems = []

  cartList.forEach(food => {
    const servings = food.quantity || 1
    ;(food.ingredients || []).forEach((ingredient, index) => {
      const parsed = parseAmount(ingredient.amount)
      const sourceText = servings > 1 ? `${food.name} · ${servings} 份` : food.name
      if (!parsed) {
        const key = `${food.foodId || food.id}-${ingredient.name}-${index}`
        uncountableItems.push({
          key,
          name: ingredient.name,
          amount: ingredient.amount || '适量',
          sourceText: `用于 ${sourceText}`,
          isInStock: !!checkedMap[key],
          stockText: '请手动确认',
          stockState: 'manual'
        })
        return
      }

      const key = `${ingredient.name}-${parsed.unit}`
      if (!groupedItems[key]) {
        groupedItems[key] = { key, name: ingredient.name, unit: parsed.unit, required: 0, sources: [] }
      }
      groupedItems[key].required += parsed.quantity * servings
      groupedItems[key].sources.push(sourceText)
    })
  })

  const countedItems = Object.values(groupedItems).map(item => {
    const available = inventory
      .filter(stock => stock.name === item.name && normalizeUnit(stock.unit) === item.unit)
      .reduce((sum, stock) => sum + Number(stock.quantity || 0), 0)
    const required = formatNumber(item.required)
    const missing = Math.max(0, item.required - available)
    const isSufficient = available >= item.required
    const isInStock = isSufficient || !!checkedMap[item.key]
    let stockText = '暂无库存记录'
    let stockState = 'none'
    if (isSufficient) {
      stockText = `家有 ${formatNumber(available)}${item.unit}，库存充足`
      stockState = 'enough'
    } else if (available > 0) {
      stockText = `家有 ${formatNumber(available)}${item.unit}，还差 ${formatNumber(missing)}${item.unit}`
      stockState = 'partial'
    } else if (checkedMap[item.key]) {
      stockText = '已手动标记为家里有'
      stockState = 'manual'
    }
    return {
      key: item.key,
      name: item.name,
      amount: isSufficient ? `需要 ${required}${item.unit}` : `需购 ${formatNumber(missing)}${item.unit}`,
      sourceText: `用于 ${Array.from(new Set(item.sources)).join('、')}`,
      isInStock,
      stockText,
      stockState
    }
  })

  return countedItems.concat(uncountableItems)
}

function parseAmount(amount) {
  const match = String(amount || '').trim().match(/^(\d+(?:\.\d+)?)\s*(kg|g|ml|个|克|毫升|勺|茶匙|把|根|头|块|碗|罐|片|袋|粒)/i)
  if (!match) return null
  return { quantity: Number(match[1]), unit: normalizeUnit(match[2]) }
}

function normalizeUnit(unit) {
  const value = String(unit || '').toLowerCase()
  if (value === 'g') return '克'
  if (value === 'kg') return '千克'
  if (value === 'ml') return '毫升'
  return value
}

function formatNumber(value) {
  return Number.isInteger(value) ? value : Number(value.toFixed(1))
}

module.exports = { createShoppingItems, setItemChecked }
