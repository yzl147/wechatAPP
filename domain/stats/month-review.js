function createMonthDescriptor(year, month) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    throw new TypeError('year and month must describe a valid month')
  }
  return {
    year,
    month,
    key: `${year}-${String(month + 1).padStart(2, '0')}`,
    label: `${year}年${month + 1}月`,
    startTime: new Date(year, month, 1).getTime(),
    endTime: new Date(year, month + 1, 1).getTime()
  }
}

function isCurrentMonth(year, month, now = new Date()) {
  return year === now.getFullYear() && month === now.getMonth()
}

function summarizeMeals(mealRecords = []) {
  const summary = { cookCount: 0, dineOutCount: 0, takeoutCount: 0, totalCount: 0, topDishes: [] }
  const dishCounts = new Map()

  mealRecords.forEach(record => {
    const mealType = record && record.mealType ? record.mealType : 'cook'
    if (mealType === 'dine_out') summary.dineOutCount += 1
    else if (mealType === 'takeout') summary.takeoutCount += 1
    else {
      summary.cookCount += 1
      const items = Array.isArray(record && record.items) ? record.items : []
      items.forEach(item => {
        const name = String(item && item.name || '').trim()
        if (!name) return
        const quantity = Number(item.quantity)
        dishCounts.set(name, (dishCounts.get(name) || 0) + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1))
      })
    }
  })

  summary.totalCount = summary.cookCount + summary.dineOutCount + summary.takeoutCount
  summary.topDishes = Array.from(dishCounts, ([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'zh-CN'))
    .slice(0, 3)
  return summary
}

function selectLifeRecords(records = [], year, month) {
  return records.filter(record => {
    const date = new Date(record && record.completedAt)
    return !Number.isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month
  }).slice().sort((left, right) => right.completedAt - left.completedAt)
}

function formatMonthDayTime(timestamp) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

module.exports = { createMonthDescriptor, isCurrentMonth, summarizeMeals, selectLifeRecords, formatMonthDayTime }
