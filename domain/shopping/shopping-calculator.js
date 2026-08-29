const { parseAmount, normalizeUnit, formatNumber } = require('./ingredient-parser')

function createShoppingItems(mealList, inventory, checkedMap) {
  const groupedItems = {}
  const uncountableItems = []

  mealList.forEach(dish => {
    const servings = dish.quantity || 1
    ;(dish.ingredients || []).forEach((ingredient, index) => {
      const parsed = parseAmount(ingredient.amount)
      const sourceText = servings > 1 ? `${dish.name} · ${servings} 份` : dish.name
      if (!parsed) {
        const key = `${dish.dishId || dish.foodId || dish.id}-${ingredient.name}-${index}`
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

  const countedItems = Object.values(groupedItems).map(item => createCountedItem(item, inventory, checkedMap))
  return countedItems.concat(uncountableItems)
}

function createCountedItem(item, inventory, checkedMap) {
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
}

module.exports = { createShoppingItems }
