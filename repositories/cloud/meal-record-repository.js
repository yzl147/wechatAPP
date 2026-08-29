const cloudClient = require('../../utils/cloud')

function createMealRecordRepository(client) {
  function callLegacyProtocol(action, data = {}) {
    return client.callFunction('manageOrders', { action, ...data })
  }

  return {
    async listPage({ cursor = null, limit = 20 } = {}) {
      const result = await callLegacyProtocol('list', { cursor, limit })
      const page = result.data || {}
      return {
        items: Array.isArray(page.items) ? page.items.map(normalizeRecord) : [],
        nextCursor: page.nextCursor || null,
        hasMore: !!page.hasMore
      }
    },

    async listRange(startTime, endTime) {
      const result = await callLegacyProtocol('range', { startTime, endTime })
      return Array.isArray(result.data) ? result.data.map(normalizeRecord) : []
    },

    async getRecord(recordId) {
      const result = await callLegacyProtocol('detail', { orderId: recordId })
      return normalizeRecord(result.data)
    },

    async createCookedRecord(mealList, remark = '') {
      const items = mealList.map(item => ({
        dishId: item.dishId || item.foodId || item.id,
        quantity: item.quantity
      }))
      const result = await callLegacyProtocol('create', { items, remark, mealType: 'cook' })
      return normalizeRecord(result.data)
    },

    async createExternalRecord({ mealType, venue, dishes, remark = '' }) {
      const result = await callLegacyProtocol('create', {
        remark,
        mealType,
        venue: venue.trim(),
        dishes: dishes.trim()
      })
      return normalizeRecord(result.data)
    },

    deleteRecord(recordId) {
      return callLegacyProtocol('delete', { orderId: recordId })
    },

    deleteRecords(recordIds) {
      return callLegacyProtocol('batchDelete', { orderIds: recordIds })
    }
  }
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object') return null
  return {
    ...record,
    recordId: record.recordId || record.orderId || record._id || '',
    recordedAt: Number(record.recordedAt || record.orderTime) || 0,
    items: Array.isArray(record.items) ? record.items.map(item => ({
      ...item,
      dishId: item.dishId || item.id || null
    })) : []
  }
}

module.exports = {
  ...createMealRecordRepository(cloudClient),
  createMealRecordRepository,
  normalizeRecord
}
