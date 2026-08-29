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

    async deleteRecord(recordId) {
      const result = await callLegacyProtocol('delete', { orderId: recordId })
      const data = result.data || {}
      return {
        recordId: data.recordId || recordId,
        recoverable: data.recoverable === true
      }
    },

    async restoreRecord(recordId) {
      const result = await callLegacyProtocol('restore', { orderId: recordId })
      const data = result.data || {}
      return { recordId: data.recordId || recordId, restored: data.restored === true }
    },

    deleteRecords(recordIds) {
      return callLegacyProtocol('batchDelete', { orderIds: recordIds })
    }
  }
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object') return null
  const normalized = {
    ...record,
    recordId: record.recordId || record.orderId || record._id || '',
    recordedAt: Number(record.recordedAt || record.orderTime) || 0,
    items: Array.isArray(record.items) ? record.items.map(item => ({
      ...item,
      dishId: item.dishId || item.id || null
    })) : []
  }
  delete normalized.orderId
  delete normalized.orderTime
  delete normalized.status
  delete normalized.completedTime
  delete normalized.totalPrice
  delete normalized.deletedAt
  normalized.items.forEach(item => {
    delete item.foodId
    delete item.price
    delete item.subtotal
  })
  return normalized
}

module.exports = {
  ...createMealRecordRepository(cloudClient),
  createMealRecordRepository,
  normalizeRecord
}
