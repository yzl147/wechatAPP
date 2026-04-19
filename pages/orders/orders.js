const orderUtil = require('../../utils/order')

Page({
  data: {
    currentTab: 'all',
    allOrders: [],
    displayOrders: [],
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
    selectedMap: {}  // 用对象做快速查找，避免模板中 indexOf
  },

  onShow() {
    this.loadOrders()
  },

  loadOrders() {
    const orders = orderUtil.getOrders()
    const list = orders.map(order => ({
      ...order,
      priceText: order.totalPrice.toFixed(2)
    }))
    const summary = orderUtil.getOrderSummary()
    this.setData({
      allOrders: list,
      displayOrders: list,
      summary
    })
    this.filterOrders()
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.filterOrders()
  },

  // 过滤订单 + 预计算选中状态
  filterOrders() {
    let list = this.data.allOrders
    if (this.data.currentTab !== 'all') {
      list = list.filter(o => o.status === this.data.currentTab)
    }
    // 预计算每项的选中状态和时间格式化，避免在 WXML 中调用方法
    const displayList = list.map(item => ({
      ...item,
      _selected: !!this.data.selectedMap[item.orderId],
      _timeText: orderUtil.formatTime(item.orderTime)
    }))
    this.setData({ displayOrders: displayList })
    if (this.data.selectMode) {
      this.updateSelectAllState(displayList)
    }
  },

  // 刷新选中状态（不重新过滤）
  refreshSelectedState() {
    const displayList = this.data.displayOrders.map(item => ({
      ...item,
      _selected: !!this.data.selectedMap[item.orderId]
    }))
    this.setData({ displayOrders: displayList })
  },

  // ===== 选择模式相关 =====

  // 长按进入选择模式
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

  // 切换单个订单选中状态
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

  // 全选/取消全选
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

  // 更新全选状态
  updateSelectAllState(displayList) {
    const map = this.data.selectedMap
    const allSelected = displayList.length > 0 &&
      displayList.every(item => map[item.orderId])
    this.setData({ isAllSelected: allSelected })
  },

  // 取消选择模式
  onCancelSelect() {
    this.setData({
      selectMode: false,
      selectedIds: [],
      selectedMap: {},
      isAllSelected: false
    })
    this.refreshSelectedState()
  },

  // 点击进入详情（非选择模式下）
  onOrderTap(e) {
    if (this.data.selectMode) return
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${id}&fromHistory=true`
    })
  },

  // 批量完成
  onBatchComplete() {
    const { selectedIds } = this.data
    const count = selectedIds.length
    wx.showModal({
      title: '批量完成',
      content: `确定将选中的 ${count} 个订单标记为已完成吗？`,
      success: (res) => {
        if (res.confirm) {
          selectedIds.forEach(orderId => {
            orderUtil.updateOrderStatus(orderId, 'completed')
          })
          wx.showToast({ title: `已批量完成 ${count} 个订单`, icon: 'success' })
          this.onCancelSelect()
          this.loadOrders()
        }
      }
    })
  },

  // 批量删除
  onBatchDelete() {
    const { selectedIds } = this.data
    const count = selectedIds.length
    wx.showModal({
      title: '批量删除',
      content: `确定要删除选中的 ${count} 个订单吗？此操作不可撤销。`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          selectedIds.forEach(orderId => {
            orderUtil.deleteOrder(orderId)
          })
          wx.showToast({ title: `已删除 ${count} 个订单`, icon: 'none' })
          this.onCancelSelect()
          this.loadOrders()
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
      content: `确定要删除订单 ${orderId} 吗？\n（${dishNames}）`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          orderUtil.deleteOrder(orderId)
          this.loadOrders()
          wx.showToast({ title: '已删除', icon: 'none' })
        }
      }
    })
  }
})