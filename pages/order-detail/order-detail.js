const orderUtil = require('../../utils/order')
const cartUtil = require('../../utils/cart')
const cloudUtil = require('../../utils/cloud')

Page({
  data: {
    order: null,
    orderId: '',
    loadStatus: 'loading',
    showPush: true,
    fromHistory: false
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({ orderId: options.orderId })
      this.loadOrderDetail(options.orderId)
    } else {
      this.setData({ loadStatus: 'empty' })
    }
    if (options.fromHistory === 'true') {
      this.setData({ fromHistory: true })
    }
  },

  // 从云端加载订单详情
  async loadOrderDetail(orderId) {
    this.setData({ loadStatus: 'loading' })
    try {
      const result = await cloudUtil.callFunction('manageOrders', { action: 'detail', orderId })
      const order = result.data
      if (order) {
        const items = order.items.map(item => ({
          ...item,
          subtotalText: (item.price * item.quantity).toFixed(2)
        }))
        const orderData = {
          ...order,
          mealType: order.mealType || 'cook',
          mealTypeText: getMealTypeText(order.mealType),
          isCook: !order.mealType || order.mealType === 'cook',
          items,
          priceText: order.totalPrice.toFixed(2),
          _timeText: orderUtil.formatTime(order.orderTime)
        }
        this.setData({ order: orderData, loadStatus: 'success' })
        wx.setNavigationBarTitle({ title: '饮食记录' })
      } else {
        this.setData({ order: null, loadStatus: 'empty' })
      }
    } catch (e) {
      console.error('加载饮食记录详情失败', e && e.code, e && e.requestId)
      this.setData({ loadStatus: 'error' })
    }
  },

  onRetryLoad() { this.loadOrderDetail(this.data.orderId) },

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
            wx.showToast({ title: cloudUtil.getErrorMessage(e, '操作失败，请重试'), icon: 'none' })
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

  // 按原份数将这餐菜品重新加入今日清单
  async onReuseMeal() {
    const { order } = this.data
    if (!order || !order.items || order.items.length === 0) return
    wx.showLoading({ title: '加入清单中...' })
    try {
      for (const item of order.items) {
        await cartUtil.addToCart(item, item.quantity || 1)
      }
      wx.hideLoading()
      wx.showToast({ title: '已加入今日清单', icon: 'success' })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: cloudUtil.getErrorMessage(e, '加入失败，请重试'), icon: 'none' })
    }
  },

  // 删除当前订单
  onDeleteOrder() {
    const order = this.data.order
    const dishNames = (order && order.items) ? order.items.map(i => i.name).join('、') : ''
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条饮食记录吗？\n（${dishNames}）`,
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
            wx.showToast({ title: cloudUtil.getErrorMessage(e, '删除失败，请重试'), icon: 'none' })
          }
        }
      }
    })
  },

  // 继续选菜
  goToIndex() {
    wx.navigateTo({
      url: '/pages/index/index'
    })
  }
})

function getMealTypeText(type) {
  return { dine_out: '外出吃', takeout: '外卖' }[type] || '自己做'
}
