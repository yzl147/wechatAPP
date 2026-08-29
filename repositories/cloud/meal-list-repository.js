const cloudClient = require('../../utils/cloud')

function createMealListRepository(client) {
  function callLegacyProtocol(action, data = {}) {
    return client.callFunction('manageCart', { action, ...data })
  }

  return {
    async listItems() {
      const result = await callLegacyProtocol('get')
      const items = Array.isArray(result.data) ? result.data : []
      return items.map(normalizeItem)
    },

    async getSummary() {
      const result = await callLegacyProtocol('summary')
      return { count: Number(result.data && result.data.count) || 0 }
    },

    addDish(dishId, quantity) {
      return callLegacyProtocol('add', { dishId, quantity })
    },

    increaseDish(dishId) {
      return callLegacyProtocol('increase', { foodId: dishId })
    },

    decreaseDish(dishId) {
      return callLegacyProtocol('decrease', { foodId: dishId })
    },

    removeDish(dishId) {
      return callLegacyProtocol('remove', { foodId: dishId })
    },

    clear() {
      return callLegacyProtocol('clear')
    }
  }
}

function normalizeItem(item) {
  const normalized = {
    ...item,
    dishId: Number(item.dishId || item.foodId || item.id)
  }
  delete normalized.foodId
  delete normalized.price
  return normalized
}

module.exports = {
  ...createMealListRepository(cloudClient),
  createMealListRepository,
  normalizeItem
}
