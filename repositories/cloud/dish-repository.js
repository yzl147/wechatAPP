const cloudClient = require('../../utils/cloud')

function createDishRepository(client) {
  return {
    async listDishes() {
      const result = await client.callFunction('manageDishes', { action: 'list' })
      return Array.isArray(result.data) ? result.data : []
    },

    async getDishDetail(id) {
      const result = await client.callFunction('manageDishes', { action: 'detail', id })
      return result.data || null
    }
  }
}

module.exports = {
  ...createDishRepository(cloudClient),
  createDishRepository
}
