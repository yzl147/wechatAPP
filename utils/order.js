// 旧模块名仅用于兼容历史引用；新代码统一使用 services/meal-record-service。
const mealRecordService = require('../services/meal-record-service')

function getOrderPage(options) {
  return mealRecordService.getPage(options)
}

function getOrdersInRange(startTime, endTime) {
  return mealRecordService.getRange(startTime, endTime)
}

function createOrder(mealList, remark = '') {
  return mealRecordService.saveCookedMeal(mealList, remark)
}

function createExternalMeal(input) {
  return mealRecordService.saveExternalMeal(input)
}

function deleteOrder(orderId) {
  return mealRecordService.deleteRecord(orderId)
}

function batchDelete(orderIds) {
  return mealRecordService.deleteRecords(orderIds)
}

module.exports = {
  getOrderPage,
  getOrdersInRange,
  createOrder,
  createExternalMeal,
  deleteOrder,
  batchDelete,
  formatTime: mealRecordService.formatTime
}
