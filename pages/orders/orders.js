const orderUtil = require('../../utils/order')
const lifeListUtil = require('../../utils/life-list')
const cloudUtil = require('../../utils/cloud')

Page({
  data: {
    allOrders: [], monthOrders: [], displayOrders: [],
    viewMode: 'calendar', selectedDate: '', selectedDateTitle: '', today: '',
    monthTitle: '', isCurrentMonth: true, calendarDays: [],
    weekDays: ['日', '一', '二', '三', '四', '五', '六'], selectedLifeRecords: [],
    loadStatus: 'loading', nextCursor: null, hasMore: true, loadingMore: false,
    selectMode: false, selectedIds: [], isAllSelected: false, selectedMap: {}, batchPending: false
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
    this.loadOrders(true)
    this.syncLifeAndLoadCalendar()
  },

  onReachBottom() {
    if (this.data.viewMode === 'list' && !this.data.selectMode) this.loadOrders(false)
  },

  async syncLifeAndLoadCalendar() {
    try {
      await lifeListUtil.syncLifeData()
    } catch (error) {
      wx.showToast({ title: '生活清单同步失败，显示本地缓存', icon: 'none' })
    }
    this.loadCalendarMonth()
  },

  async loadOrders(reset = true) {
    if (this.data.loadingMore || (!reset && !this.data.hasMore)) return
    const hasData = this.data.allOrders.length > 0
    if (reset && !hasData) this.setData({ loadStatus: 'loading' })
    if (!reset) this.setData({ loadingMore: true })
    try {
      const page = await orderUtil.getOrderPage({ cursor: reset ? null : this.data.nextCursor, limit: 20 })
      const list = reset ? page.items : mergeOrders(this.data.allOrders, page.items)
      this.setData({
        allOrders: list,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        loadingMore: false,
        loadStatus: 'success'
      })
      this.filterOrders()
    } catch (error) {
      console.error('加载饮食记录失败', error && error.code, error && error.requestId)
      this.setData({ loadingMore: false })
      if (!hasData) this.setData({ loadStatus: 'error' })
      else wx.showToast({ title: cloudUtil.getErrorMessage(error, '刷新失败，请重试'), icon: 'none' })
    }
  },

  onRetryLoad() {
    this.loadOrders(true)
    this.loadCalendarMonth()
  },

  async loadCalendarMonth() {
    const queryYear = this.calendarYear
    const queryMonth = this.calendarMonth
    const { startTime, endTime } = getMonthRange(queryYear, queryMonth)
    try {
      const orders = await orderUtil.getOrdersInRange(startTime, endTime)
      if (queryYear !== this.calendarYear || queryMonth !== this.calendarMonth) return
      this.setData({ monthOrders: orders })
      this.buildCalendar()
      this.filterOrders()
    } catch (error) {
      console.error('加载月历记录失败', error && error.code, error && error.requestId)
      wx.showToast({ title: cloudUtil.getErrorMessage(error, '月历加载失败，请重试'), icon: 'none' })
    }
  },

  filterOrders() {
    const { allOrders, monthOrders, selectedDate, viewMode, selectedMap } = this.data
    const list = viewMode === 'calendar'
      ? (selectedDate ? monthOrders.filter(item => formatDate(item.orderTime) === selectedDate) : [])
      : allOrders
    const displayOrders = list.map(item => ({
      ...item,
      mealType: item.mealType || 'cook',
      mealTypeText: getMealTypeText(item.mealType),
      mealTypeMark: getMealTypeMark(item.mealType),
      _titleText: getOrderTitle(item),
      _itemsText: getOrderItemsText(item),
      _selected: !!selectedMap[item.orderId],
      _timeText: viewMode === 'calendar'
        ? orderUtil.formatTime(item.orderTime).slice(11)
        : orderUtil.formatTime(item.orderTime),
      _totalCount: getOrderCount(item)
    }))
    this.setData({ displayOrders })
    if (this.data.selectMode) this.updateSelectAllState(displayOrders)
  },

  onViewModeTap(e) {
    const viewMode = e.currentTarget.dataset.mode
    if (!viewMode || viewMode === this.data.viewMode) return
    if (this.data.selectMode) this.clearSelection()
    const selectedDate = viewMode === 'calendar' && this.isViewingCurrentMonth() ? this.data.today : ''
    this.setData({ viewMode, selectedDate })
    this.buildCalendar()
    this.filterOrders()
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
    this.setData({ selectedDate: '', monthOrders: [], displayOrders: [] })
    this.buildCalendar()
    this.loadCalendarMonth()
  },

  onGoToday() {
    const now = new Date()
    this.calendarYear = now.getFullYear()
    this.calendarMonth = now.getMonth()
    this.setData({ selectedDate: this.data.today, monthOrders: [], displayOrders: [] })
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
    this.filterOrders()
  },

  onLifeRecordTap(e) {
    wx.navigateTo({ url: `/pages/life-completion-detail/life-completion-detail?id=${e.currentTarget.dataset.id}` })
  },

  goToMealRecord() {
    wx.navigateTo({ url: '/pages/meal-record/meal-record' })
  },

  buildCalendar() {
    if (this.calendarYear === undefined) return
    const recordDates = new Set(this.data.monthOrders.map(item => formatDate(item.orderTime)))
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
    if (this.data.displayOrders.length > 0) this.setData({ selectMode: true })
  },

  onToggleItem(e) {
    const id = e.currentTarget.dataset.id
    const selectedMap = { ...this.data.selectedMap }
    let selectedIds = [...this.data.selectedIds]
    if (selectedMap[id]) {
      delete selectedMap[id]
      selectedIds = selectedIds.filter(item => item !== id)
    } else {
      selectedMap[id] = true
      selectedIds.push(id)
    }
    this.setData({ selectedIds, selectedMap })
    this.refreshSelectedState()
    this.updateSelectAllState(this.data.displayOrders)
  },

  onToggleSelectAll() {
    if (this.data.isAllSelected) {
      this.setData({ selectedIds: [], selectedMap: {}, isAllSelected: false })
    } else {
      const selectedMap = {}
      const selectedIds = this.data.displayOrders.map(item => {
        selectedMap[item.orderId] = true
        return item.orderId
      })
      this.setData({ selectedIds, selectedMap, isAllSelected: true })
    }
    this.refreshSelectedState()
  },

  updateSelectAllState(displayOrders) {
    const { selectedMap } = this.data
    this.setData({ isAllSelected: displayOrders.length > 0 && displayOrders.every(item => selectedMap[item.orderId]) })
  },

  refreshSelectedState() {
    this.setData({
      displayOrders: this.data.displayOrders.map(item => ({ ...item, _selected: !!this.data.selectedMap[item.orderId] }))
    })
  },

  clearSelection() {
    this.setData({
      selectMode: false, selectedIds: [], selectedMap: {}, isAllSelected: false, batchPending: false
    })
    this.refreshSelectedState()
  },

  onCancelSelect() {
    this.clearSelection()
  },

  onOrderTap(e) {
    if (this.data.selectMode) return
    wx.navigateTo({ url: `/pages/order-detail/order-detail?orderId=${e.currentTarget.dataset.id}&fromHistory=true` })
  },

  onBatchDelete() {
    const { selectedIds, batchPending } = this.data
    const count = selectedIds.length
    if (!count || batchPending) return
    wx.showModal({
      title: '删除饮食记录',
      content: `确定删除选中的 ${count} 条记录吗？删除后无法恢复。`,
      confirmColor: '#c43d38',
      success: async (result) => {
        if (!result.confirm) return
        this.setData({ batchPending: true })
        try {
          await orderUtil.batchDelete(selectedIds)
          wx.showToast({ title: `已删除 ${count} 条记录`, icon: 'none' })
          this.clearSelection()
          this.loadOrders(true)
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

function getOrderTitle(order) {
  if (order.venue) return order.venue
  const names = Array.isArray(order.items) ? order.items.map(item => item.name).filter(Boolean) : []
  return names.slice(0, 3).join('、') || '饮食记录'
}

function getOrderItemsText(order) {
  if (!Array.isArray(order.items)) return ''
  return order.items
    .filter(item => item && item.name)
    .map(item => `${item.name} ×${Number(item.quantity) || 1}`)
    .join('、')
}

function getOrderCount(order) {
  if (Number.isFinite(order.totalCount)) return order.totalCount
  if (!Array.isArray(order.items)) return 0
  return order.items.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
}

function getMonthRange(year, month) {
  return { startTime: new Date(year, month, 1).getTime(), endTime: new Date(year, month + 1, 1).getTime() }
}

function mergeOrders(existing, incoming) {
  const seen = new Set(existing.map(item => item._id || item.orderId))
  return existing.concat(incoming.filter(item => {
    const id = item._id || item.orderId
    if (seen.has(id)) return false
    seen.add(id)
    return true
  }))
}
