const mealRecordRepository = require('../repositories/cloud/meal-record-repository')

function createMealRecordService(repository) {
  return {
    getPage(options) { return repository.listPage(options) },
    getRange(startTime, endTime) { return repository.listRange(startTime, endTime) },
    getRecord(recordId) { return repository.getRecord(recordId) },
    saveCookedMeal(mealList, remark = '') { return repository.createCookedRecord(mealList, remark) },
    saveExternalMeal(input) { return repository.createExternalRecord(input) },
    deleteRecord(recordId) { return repository.deleteRecord(recordId) },
    restoreRecord(recordId) { return repository.restoreRecord(recordId) },
    deleteRecords(recordIds) { return repository.deleteRecords(recordIds) },
    formatTime
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

module.exports = {
  ...createMealRecordService(mealRecordRepository),
  createMealRecordService,
  formatTime
}
