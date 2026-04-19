const orderUtil = require('../../utils/order')

Page({
  data: {
    order: null,
    showPush: true,
    fromHistory: false
  },

  onLoad(options) {
    if (options.orderId) {
      const orders = orderUtil.getOrders()
      const order = orders.find(o => o.orderId === options.orderId)
      if (order) {
        // 预计算价格格式化字段
        const items = order.items.map(item => ({
          ...item,
          subtotalText: (item.price * item.quantity).toFixed(2)
        }))
        const orderData = {
          ...order,
          items,
          priceText: order.totalPrice.toFixed(2),
          _timeText: orderUtil.formatTime(order.orderTime)
        }
        this.setData({ order: orderData })
        wx.setNavigationBarTitle({ title: '订单详情' })

        // 如果是刚下单，自动显示推送消息弹窗
        this.showPushNotification()
      }
    }
    if (options.fromHistory === 'true') {
      this.setData({ fromHistory: true })
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    return orderUtil.formatTime(timestamp)
  },

  // 显示推送通知（模拟）
  showPushNotification() {
    setTimeout(() => {
      // 推送消息已展示在页面上
    }, 500)
  },

  // 关闭推送提示
  onClosePush() {
    this.setData({ showPush: false })
  },

  // 标记订单为已完成
  onCompleteOrder() {
    const order = this.data.order
    wx.showModal({
      title: '确认完成',
      content: '确定将此订单标记为已完成吗？',
      success: (res) => {
        if (res.confirm) {
          const updatedOrder = orderUtil.updateOrderStatus(order.orderId, 'completed')
          this.setData({
            order: {
              ...this.data.order,
              status: 'completed',
              completedTime: updatedOrder.completedTime
            }
          })
          wx.showToast({ title: '已标记完成', icon: 'success' })
        }
      }
    })
  },

  // 查看订单历史
  onViewOrders() {
    wx.switchTab({
      url: '/pages/orders/orders'
    })
  },

  // 删除当前订单
  onDeleteOrder() {
    const order = this.data.order
    const dishNames = (order && order.items) ? order.items.map(i => i.name).join('、') : ''
    wx.showModal({
      title: '确认删除',
      content: `确定要删除订单 ${order.orderId} 吗？\n（${dishNames}）`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          orderUtil.deleteOrder(order.orderId)
          wx.showToast({ title: '已删除', icon: 'none' })
          setTimeout(() => {
            wx.switchTab({ url: '/pages/orders/orders' })
          }, 800)
        }
      }
    })
  },

  // 继续点餐
  goToIndex() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
