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
    selectedMap: {}
  },

  onShow() {
    this.loadOrders()
  },

  async loadOrders() {
    try {
      const orders = await orderUtil.getOrders()
      const list = orders.map(order => ({
        ...order,
        priceText: order.totalPrice.toFixed(2)
      }))
      const summary = await orderUtil.getOrderSummary()
      this.setData({
        allOrders: list,
        displayOrders: list,
        summary
      })
      this.filterOrders()
    } catch (e) {
      console.error('加载饮食记录失败', e)
    }
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

  // 批量完成
  onBatchComplete() {
    const { selectedIds } = this.data
    const count = selectedIds.length
    wx.showModal({
      title: '批量完成',
      content: `确定将选中的 ${count} 个订单标记为已完成吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderUtil.batchComplete(selectedIds)
            wx.showToast({ title: `已批量完成 ${count} 个订单`, icon: 'success' })
            this.onCancelSelect()
            this.loadOrders()
          } catch (e) {
            console.error('批量完成失败', e)
          }
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
      content: `确定要删除选中的 ${count} 条记录吗？此操作不可撤销。`,
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderUtil.batchDelete(selectedIds)
            wx.showToast({ title: `已删除 ${count} 条记录`, icon: 'none' })
            this.onCancelSelect()
            this.loadOrders()
          } catch (e) {
            console.error('批量删除失败', e)
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
            this.loadOrders()
            wx.showToast({ title: '已删除', icon: 'none' })
          } catch (e) {
            console.error('删除订单失败', e)
          }
        }
      }
    })
  }
})
