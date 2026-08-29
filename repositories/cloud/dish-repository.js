const cloudClient = require('../../utils/cloud')

function createDishRepository(client) {
  return {
    async listDishes() {
      const result = await client.callFunction('manageDishes', { action: 'list' })
      return Array.isArray(result.data) ? result.data.map(toCurrentDish) : []
    },

    async getDishDetail(id) {
      const result = await client.callFunction('manageDishes', { action: 'detail', id })
      return toCurrentDish(result.data || null)
    }
  }
}

function toCurrentDish(dish) {
  if (!dish || typeof dish !== 'object') return null
  const currentDish = { ...dish }
  delete currentDish.price
  return currentDish
}

module.exports = {
  ...createDishRepository(cloudClient),
  createDishRepository,
  toCurrentDish
}
