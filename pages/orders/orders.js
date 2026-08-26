const orderUtil = require('../../utils/order')
const lifeListUtil = require('../../utils/life-list')
const cloudUtil = require('../../utils/cloud')

Page({
  data: {
    allOrders: [],
    monthOrders: [],
    displayOrders: [],
    selectedDate: '',
    today: '',
    monthTitle: '',
    calendarDays: [],
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    selectedLifeRecords: [],
    loadStatus: 'loading',
    nextCursor: null,
    hasMore: true,
    loadingMore: false,
    summary: {
      total: 0,
      pendingCount: 0,
      completedCount: 0,
      totalAmount: 0
    },
    // 选择模式
    selectMode: false,
    selectedIds: [],
    isAllSelected: false,
    selectedMap: {}
  },

  onLoad() {
    const now = new Date()
    this.calendarYear = now.getFullYear()
    this.calendarMonth = now.getMonth()
    this.setData({ today: formatDate(Date.now()) })
    this.buildCalendar()
  },

  onShow() {
    this.loadOrders(true)
    this.loadCalendarMonth()
  },

  async loadOrders(reset = true) {
    if (this.data.loadingMore || (!reset && !this.data.hasMore)) return
    const hasData = this.data.allOrders.length > 0
    if (reset && !hasData) this.setData({ loadStatus: 'loading' })
    if (!reset) this.setData({ loadingMore: true })
    try {
      const pagePromise = orderUtil.getOrderPage({
        cursor: reset ? null : this.data.nextCursor,
        limit: 20
      })
      const [page, summary] = reset
        ? await Promise.all([pagePromise, orderUtil.getOrderSummary()])
        : [await pagePromise, null]
      const incoming = page.items.map(order => ({
        ...order,
        priceText: order.totalPrice.toFixed(2)
      }))
      const list = reset ? incoming : mergeOrders(this.data.allOrders, incoming)
      this.setData({
        allOrders: list,
        displayOrders: list,
        ...(summary ? { summary } : {}),
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        loadingMore: false,
        loadStatus: 'success'
      })
      this.filterOrders()
    } catch (e) {
      console.error('加载饮食记录失败', e && e.code, e && e.requestId)
      this.setData({ loadingMore: false })
      if (!hasData) this.setData({ loadStatus: 'error' })
      else wx.showToast({ title: cloudUtil.getErrorMessage(e, '刷新失败，请重试'), icon: 'none' })
    }
  },

  onRetryLoad() { this.loadOrders(true) },
  onLoadMore() { if (!this.data.selectedDate) this.loadOrders(false) },

  async loadCalendarMonth() {
    const queryYear = this.calendarYear
    const queryMonth = this.calendarMonth
    const { startTime, endTime } = getMonthRange(queryYear, queryMonth)
    try {
      const orders = await orderUtil.getOrdersInRange(startTime, endTime)
      if (queryYear !== this.calendarYear || queryMonth !== this.calendarMonth) return
      this.setData({ monthOrders: orders })
      this.buildCalendar()
      if (this.data.selectedDate) this.filterOrders()
    } catch (e) {
      console.error('加载月历记录失败', e && e.code, e && e.requestId)
      wx.showToast({ title: cloudUtil.getErrorMessage(e, '月历加载失败，请重试'), icon: 'none' })
    }
  },

  // 预计算选中状态
  filterOrders() {
    const { allOrders, monthOrders, selectedDate } = this.data
    const list = selectedDate
      ? monthOrders.filter(item => formatDate(item.orderTime) === selectedDate)
      : allOrders
    const displayList = list.map(item => ({
      ...item,
      mealType: item.mealType || 'cook',
      mealTypeText: getMealTypeText(item.mealType),
      mealTypeIcon: getMealTypeIcon(item.mealType),
      _selected: !!this.data.selectedMap[item.orderId],
      _timeText: orderUtil.formatTime(item.orderTime)
    }))
    this.setData({ displayOrders: displayList })
    if (this.data.selectMode) {
      this.updateSelectAllState(displayList)
    }
  },

  onDateChange(e) {
    this.setData({ selectedDate: e.detail.value })
    this.filterOrders()
  },

  onClearDate() {
    this.setData({ selectedDate: '' })
    this.filterOrders()
    this.buildCalendar()
  },

  onPreviousMonth() {
    this.calendarMonth -= 1
    if (this.calendarMonth < 0) {
      this.calendarMonth = 11
      this.calendarYear -= 1
    }
    this.loadCalendarMonth()
  },

  onNextMonth() {
    const now = new Date()
    if (this.calendarYear === now.getFullYear() && this.calendarMonth === now.getMonth()) return
    this.calendarMonth += 1
    if (this.calendarMonth > 11) {
      this.calendarMonth = 0
      this.calendarYear += 1
    }
    this.loadCalendarMonth()
  },

  onCalendarDateTap(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return
    this.setData({ selectedDate: date })
    this.filterOrders()
    this.buildCalendar()
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
    const today = formatDate(Date.now())
    const calendarDays = []
    for (let index = 0; index < firstDay + daysInMonth; index += 1) {
      if (index < firstDay) {
        calendarDays.push({ key: `empty-${index}`, day: '', date: '' })
        continue
      }
      const day = index - firstDay + 1
      const date = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      calendarDays.push({
        key: date,
        day,
        date,
        hasRecord: recordDates.has(date),
        hasLifeRecord: lifeRecordDates.has(date),
        isToday: date === today,
        isSelected: date === this.data.selectedDate
      })
    }
    this.setData({
      monthTitle: `${this.calendarYear}年${this.calendarMonth + 1}月`,
      calendarDays,
      calendarHint: this.data.selectedDate ? `正在查看 ${this.data.selectedDate}` : '橙色表示饮食记录，蓝框表示完成生活清单',
      selectedLifeRecords: this.data.selectedDate
        ? lifeHistory.filter(item => formatDate(item.completedAt) === this.data.selectedDate)
        : []
    })
  },

  // 刷新选中状态
  refreshSelectedState() {
    const displayList = this.data.displayOrders.map(item => ({
      ...item,
      _selected: !!this.data.selectedMap[item.orderId]
    }))
    this.setData({ displayOrders: displayList })
  },

  // ===== 选择模式相关 =====

  onLongPressCard(e) {
    const id = e.currentTarget.dataset.id
    if (!this.data.selectMode) {
      const map = {}
      map[id] = true
      this.setData({
        selectMode: true,
        selectedIds: [id],
        selectedMap: map
      })
      wx.vibrateShort && wx.vibrateShort({ type: 'medium' })
      this.updateSelectAllState(this.data.displayOrders)
    }
  },

  onToggleItem(e) {
    const id = e.currentTarget.dataset.id || e.currentTarget.dataset.orderId
    const map = { ...this.data.selectedMap }
    let selected = [...this.data.selectedIds]

    if (map[id]) {
      delete map[id]
      selected = selected.filter(sid => sid !== id)
    } else {
      map[id] = true
      selected.push(id)
    }

    this.setData({
      selectedIds: selected,
      selectedMap: map
    })
    this.refreshSelectedState()
    this.updateSelectAllState(this.data.displayOrders)
    wx.vibrateShort && wx.vibrateShort({ type: 'light' })
  },

  onToggleSelectAll() {
    const displayList = this.data.displayOrders
    if (this.data.isAllSelected) {
      this.setData({
        selectedIds: [],
        selectedMap: {},
        isAllSelected: false
      })
    } else {
      const map = {}
      const ids = []
      displayList.forEach(item => {
        map[item.orderId] = true
        ids.push(item.orderId)
      })
      this.setData({
        selectedIds: ids,
        selectedMap: map,
        isAllSelected: true
      })
    }
    this.refreshSelectedState()
  },

  updateSelectAllState(displayList) {
    const map = this.data.selectedMap
    const allSelected = displayList.length > 0 &&
      displayList.every(item => map[item.orderId])
    this.setData({ isAllSelected: allSelected })
  },

  onCancelSelect() {
    this.setData({
      selectMode: false,
      selectedIds: [],
      selectedMap: {},
      isAllSelected: false
    })
    this.refreshSelectedState()
  },

  onOrderTap(e) {
    if (this.data.selectMode) return
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${id}&fromHistory=true`
    })
  },

  // 批量删除
  onBatchDelete() {
    const { selectedIds } = this.data
    const count = selectedIds.length
    wx.showModal({
      title: '批量删除',
      content: `确定要删除选中的 ${count} 条记录吗？此操作不可撤销。`,
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderUtil.batchDelete(selectedIds)
            wx.showToast({ title: `已删除 ${count} 条记录`, icon: 'none' })
            this.onCancelSelect()
            this.loadOrders(true)
            this.loadCalendarMonth()
          } catch (e) {
            wx.showToast({ title: cloudUtil.getErrorMessage(e, '删除失败，请重试'), icon: 'none' })
          }
        }
      }
    })
  },

  // 单个删除订单
  onDeleteOrder(e) {
    const orderId = e.currentTarget.dataset.id
    const order = this.data.allOrders.find(o => o.orderId === orderId)
    const dishNames = (order && order.items) ? order.items.map(i => i.name).join('、') : ''
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条饮食记录吗？\n（${dishNames}）`,
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderUtil.deleteOrder(orderId)
            this.loadOrders(true)
            this.loadCalendarMonth()
            wx.showToast({ title: '已删除', icon: 'none' })
          } catch (e) {
            wx.showToast({ title: cloudUtil.getErrorMessage(e, '删除失败，请重试'), icon: 'none' })
          }
        }
      }
    })
  }
})

function formatDate(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMealTypeText(type) {
  return { dine_out: '外出吃', takeout: '外卖' }[type] || '自己做'
}

function getMealTypeIcon(type) {
  return { dine_out: '🍜', takeout: '🛵' }[type] || '🍳'
}

function getMonthRange(year, month) {
  return {
    startTime: new Date(year, month, 1).getTime(),
    endTime: new Date(year, month + 1, 1).getTime()
  }
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
