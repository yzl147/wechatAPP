const orderUtil = require('../../utils/order')

Page({
  data: {
    order: null,
    showPush: true,
    fromHistory: false
  },

  onLoad(options) {
    if (options.orderId) {
      this.loadOrderDetail(options.orderId)
    }
    if (options.fromHistory === 'true') {
      this.setData({ fromHistory: true })
    }
  },

  // 从云端加载订单详情
  async loadOrderDetail(orderId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'manageOrders',
        data: { action: 'detail', orderId }
      })
      const order = res.result.data
      if (order) {
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
      }
    } catch (e) {
      console.error('加载订单详情失败', e)
    }
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
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderUtil.updateOrderStatus(order.orderId, 'completed')
            this.setData({
              order: {
                ...this.data.order,
                status: 'completed',
                completedTime: Date.now()
              }
            })
            wx.showToast({ title: '已标记完成', icon: 'success' })
          } catch (e) {
            console.error('标记完成失败', e)
          }
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
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderUtil.deleteOrder(order.orderId)
            wx.showToast({ title: '已删除', icon: 'none' })
            setTimeout(() => {
              wx.switchTab({ url: '/pages/orders/orders' })
            }, 800)
          } catch (e) {
            console.error('删除订单失败', e)
          }
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
