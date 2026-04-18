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
    }
  },

  onShow() {
    this.loadOrders()
  },

  loadOrders() {
    const orders = orderUtil.getOrders()
    // 预计算每单价格格式化
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

  // 过滤订单
  filterOrders() {
    let list = this.data.allOrders
    if (this.data.currentTab !== 'all') {
      list = list.filter(o => o.status === this.data.currentTab)
    }
    this.setData({ displayOrders: list })
  },

  // 格式化时间
  formatTime(timestamp) {
    return orderUtil.formatTime(timestamp)
  },

  // 点击订单详情
  onOrderTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${id}&fromHistory=true`
    })
  },

  // 删除订单
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
