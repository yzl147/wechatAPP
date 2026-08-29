const mealRecordService = require('../../services/meal-record-service')
const lifeListUtil = require('../../utils/life-list')
const cloudUtil = require('../../utils/cloud')

Page({
  data: {
    allRecords: [], monthRecords: [], displayRecords: [],
    viewMode: 'calendar', selectedDate: '', selectedDateTitle: '', today: '',
    monthTitle: '', isCurrentMonth: true, calendarDays: [],
    weekDays: ['日', '一', '二', '三', '四', '五', '六'], selectedLifeRecords: [],
    loadStatus: 'loading', nextCursor: null, hasMore: true, loadingMore: false,
    selectMode: false, selectedRecordIds: [], isAllSelected: false, selectedMap: {}, batchPending: false
  },

  onLoad() {
    const now = new Date()
    const today = formatDate(now.getTime())
    this.calendarYear = now.getFullYear()
    this.calendarMonth = now.getMonth()
    this.setData({ today, selectedDate: today })
    this.buildCalendar()
  },

  onShow() {
    this.loadRecords(true)
    this.syncLifeAndLoadCalendar()
  },

  onReachBottom() {
    if (this.data.viewMode === 'list' && !this.data.selectMode) this.loadRecords(false)
  },

  async syncLifeAndLoadCalendar() {
    try {
      await lifeListUtil.syncLifeData()
    } catch (error) {
      wx.showToast({ title: '生活清单同步失败，显示本地缓存', icon: 'none' })
    }
    this.loadCalendarMonth()
  },

  async loadRecords(reset = true) {
    if (this.data.loadingMore || (!reset && !this.data.hasMore)) return
    const hasData = this.data.allRecords.length > 0
    if (reset && !hasData) this.setData({ loadStatus: 'loading' })
    if (!reset) this.setData({ loadingMore: true })
    try {
      const page = await mealRecordService.getPage({ cursor: reset ? null : this.data.nextCursor, limit: 20 })
      const list = reset ? page.items : mergeRecords(this.data.allRecords, page.items)
      this.setData({
        allRecords: list,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        loadingMore: false,
        loadStatus: 'success'
      })
      this.filterRecords()
    } catch (error) {
      console.error('加载饮食记录失败', error && error.code, error && error.requestId)
      this.setData({ loadingMore: false })
      if (!hasData) this.setData({ loadStatus: 'error' })
      else wx.showToast({ title: cloudUtil.getErrorMessage(error, '刷新失败，请重试'), icon: 'none' })
    }
  },

  onRetryLoad() {
    this.loadRecords(true)
    this.loadCalendarMonth()
  },

  async loadCalendarMonth() {
    const queryYear = this.calendarYear
    const queryMonth = this.calendarMonth
    const { startTime, endTime } = getMonthRange(queryYear, queryMonth)
    try {
      const records = await mealRecordService.getRange(startTime, endTime)
      if (queryYear !== this.calendarYear || queryMonth !== this.calendarMonth) return
      this.setData({ monthRecords: records })
      this.buildCalendar()
      this.filterRecords()
    } catch (error) {
      console.error('加载月历记录失败', error && error.code, error && error.requestId)
      wx.showToast({ title: cloudUtil.getErrorMessage(error, '月历加载失败，请重试'), icon: 'none' })
    }
  },

  filterRecords() {
    const { allRecords, monthRecords, selectedDate, viewMode, selectedMap } = this.data
    const list = viewMode === 'calendar'
      ? (selectedDate ? monthRecords.filter(item => formatDate(item.recordedAt) === selectedDate) : [])
      : allRecords
    const displayRecords = list.map(item => ({
      ...item,
      mealType: item.mealType || 'cook',
      mealTypeText: getMealTypeText(item.mealType),
      mealTypeMark: getMealTypeMark(item.mealType),
      _titleText: getRecordTitle(item),
      _itemsText: getRecordItemsText(item),
      _selected: !!selectedMap[item.recordId],
      _timeText: viewMode === 'calendar'
        ? mealRecordService.formatTime(item.recordedAt).slice(11)
        : mealRecordService.formatTime(item.recordedAt),
      _totalCount: getRecordCount(item)
    }))
    this.setData({ displayRecords })
    if (this.data.selectMode) this.updateSelectAllState(displayRecords)
  },

  onViewModeTap(e) {
    const viewMode = e.currentTarget.dataset.mode
    if (!viewMode || viewMode === this.data.viewMode) return
    if (this.data.selectMode) this.clearSelection()
    const selectedDate = viewMode === 'calendar' && this.isViewingCurrentMonth() ? this.data.today : ''
    this.setData({ viewMode, selectedDate })
    this.buildCalendar()
    this.filterRecords()
  },

  onPreviousMonth() {
    this.calendarMonth -= 1
    if (this.calendarMonth < 0) {
      this.calendarMonth = 11
      this.calendarYear -= 1
    }
    this.prepareMonthChange()
  },

  onNextMonth() {
    if (this.isViewingCurrentMonth()) return
    this.calendarMonth += 1
    if (this.calendarMonth > 11) {
      this.calendarMonth = 0
      this.calendarYear += 1
    }
    this.prepareMonthChange()
  },

  prepareMonthChange() {
    this.setData({ selectedDate: '', monthRecords: [], displayRecords: [] })
    this.buildCalendar()
    this.loadCalendarMonth()
  },

  onGoToday() {
    const now = new Date()
    this.calendarYear = now.getFullYear()
    this.calendarMonth = now.getMonth()
    this.setData({ selectedDate: this.data.today, monthRecords: [], displayRecords: [] })
    this.buildCalendar()
    this.loadCalendarMonth()
  },

  isViewingCurrentMonth() {
    const now = new Date()
    return this.calendarYear === now.getFullYear() && this.calendarMonth === now.getMonth()
  },

  onCalendarDateTap(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return
    this.setData({ selectedDate: date })
    this.buildCalendar()
    this.filterRecords()
  },

  onLifeRecordTap(e) {
    wx.navigateTo({ url: `/pages/life-completion-detail/life-completion-detail?id=${e.currentTarget.dataset.id}` })
  },

  goToMealRecord() {
    wx.navigateTo({ url: '/pages/meal-record/meal-record' })
  },

  buildCalendar() {
    if (this.calendarYear === undefined) return
    const recordDates = new Set(this.data.monthRecords.map(item => formatDate(item.recordedAt)))
    const lifeHistory = lifeListUtil.getCompletionHistory()
    const lifeRecordDates = new Set(lifeHistory.map(item => formatDate(item.completedAt)))
    const firstDay = new Date(this.calendarYear, this.calendarMonth, 1).getDay()
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate()
    const calendarDays = []
    for (let index = 0; index < firstDay + daysInMonth; index += 1) {
      if (index < firstDay) {
        calendarDays.push({ key: `empty-${index}`, day: '', date: '' })
        continue
      }
      const day = index - firstDay + 1
      const date = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      calendarDays.push({
        key: date, day, date,
        hasRecord: recordDates.has(date), hasLifeRecord: lifeRecordDates.has(date),
        isToday: date === this.data.today, isSelected: date === this.data.selectedDate
      })
    }
    const selectedLifeRecords = this.data.selectedDate
      ? lifeHistory.filter(item => formatDate(item.completedAt) === this.data.selectedDate)
        .map(item => ({ ...item, _itemCount: Array.isArray(item.items) ? item.items.length : 0 }))
      : []
    this.setData({
      monthTitle: `${this.calendarYear}年${this.calendarMonth + 1}月`,
      isCurrentMonth: this.isViewingCurrentMonth(),
      calendarDays,
      selectedDateTitle: this.data.selectedDate ? formatDateTitle(this.data.selectedDate) : '',
      selectedLifeRecords
    })
  },

  onEnterManage() {
    if (this.data.displayRecords.length > 0) this.setData({ selectMode: true })
  },

  onToggleItem(e) {
    const id = e.currentTarget.dataset.id
    const selectedMap = { ...this.data.selectedMap }
    let selectedRecordIds = [...this.data.selectedRecordIds]
    if (selectedMap[id]) {
      delete selectedMap[id]
      selectedRecordIds = selectedRecordIds.filter(item => item !== id)
    } else {
      selectedMap[id] = true
      selectedRecordIds.push(id)
    }
    this.setData({ selectedRecordIds, selectedMap })
    this.refreshSelectedState()
    this.updateSelectAllState(this.data.displayRecords)
  },

  onToggleSelectAll() {
    if (this.data.isAllSelected) {
      this.setData({ selectedRecordIds: [], selectedMap: {}, isAllSelected: false })
    } else {
      const selectedMap = {}
      const selectedRecordIds = this.data.displayRecords.map(item => {
        selectedMap[item.recordId] = true
        return item.recordId
      })
      this.setData({ selectedRecordIds, selectedMap, isAllSelected: true })
    }
    this.refreshSelectedState()
  },

  updateSelectAllState(displayRecords) {
    const { selectedMap } = this.data
    this.setData({ isAllSelected: displayRecords.length > 0 && displayRecords.every(item => selectedMap[item.recordId]) })
  },

  refreshSelectedState() {
    this.setData({
      displayRecords: this.data.displayRecords.map(item => ({ ...item, _selected: !!this.data.selectedMap[item.recordId] }))
    })
  },

  clearSelection() {
    this.setData({
      selectMode: false, selectedRecordIds: [], selectedMap: {}, isAllSelected: false, batchPending: false
    })
    this.refreshSelectedState()
  },

  onCancelSelect() {
    this.clearSelection()
  },

  onMealRecordTap(e) {
    if (this.data.selectMode) return
    wx.navigateTo({ url: `/pages/order-detail/order-detail?recordId=${e.currentTarget.dataset.id}&fromHistory=true` })
  },

  onBatchDelete() {
    const { selectedRecordIds, batchPending } = this.data
    const count = selectedRecordIds.length
    if (!count || batchPending) return
    wx.showModal({
      title: '删除饮食记录',
      content: `确定删除选中的 ${count} 条记录吗？批量删除后暂时无法在页面撤销。`,
      confirmColor: '#c43d38',
      success: async (result) => {
        if (!result.confirm) return
        this.setData({ batchPending: true })
        try {
          await mealRecordService.deleteRecords(selectedRecordIds)
          wx.showToast({ title: `已删除 ${count} 条记录`, icon: 'none' })
          this.clearSelection()
          this.loadRecords(true)
          this.loadCalendarMonth()
        } catch (error) {
          this.setData({ batchPending: false })
          wx.showToast({ title: cloudUtil.getErrorMessage(error, '删除失败，请重试'), icon: 'none' })
        }
      }
    })
  }
})

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateTitle(dateText) {
  const [year, month, day] = dateText.split('-').map(Number)
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(year, month - 1, day).getDay()]
  return `${month}月${day}日 ${weekDay}`
}

function getMealTypeText(type) {
  return { dine_out: '外出吃', takeout: '点外卖' }[type] || '自己做'
}

function getMealTypeMark(type) {
  return { dine_out: '外', takeout: '送' }[type] || '做'
}

function getRecordTitle(record) {
  if (record.venue) return record.venue
  const names = Array.isArray(record.items) ? record.items.map(item => item.name).filter(Boolean) : []
  return names.slice(0, 3).join('、') || '饮食记录'
}

function getRecordItemsText(record) {
  if (!Array.isArray(record.items)) return ''
  return record.items
    .filter(item => item && item.name)
    .map(item => `${item.name} ×${Number(item.quantity) || 1}`)
    .join('、')
}

function getRecordCount(record) {
  if (Number.isFinite(record.totalCount)) return record.totalCount
  if (!Array.isArray(record.items)) return 0
  return record.items.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
}

function getMonthRange(year, month) {
  return { startTime: new Date(year, month, 1).getTime(), endTime: new Date(year, month + 1, 1).getTime() }
}

function mergeRecords(existing, incoming) {
  const seen = new Set(existing.map(item => item._id || item.recordId))
  return existing.concat(incoming.filter(item => {
    const id = item._id || item.recordId
    if (seen.has(id)) return false
    seen.add(id)
    return true
  }))
}
