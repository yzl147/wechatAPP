const cartUtil = require('../../utils/cart')

Page({
  data: {
    cartList: [],
    totalCount: 0,
    totalPrice: 0
  },

  onShow() {
    this.loadCart()
  },

  loadCart() {
    const info = cartUtil.getCartInfo()
    // 预计算每项小计
    const list = info.list.map(item => ({
      ...item,
      subtotal: (item.price * item.quantity).toFixed(2)
    }))
    this.setData({
      cartList: list,
      totalCount: info.count,
      totalPrice: info.total
    })
  },

  // 增加数量
  onIncrease(e) {
    const id = e.currentTarget.dataset.id
    const result = cartUtil.increaseQuantity(id)
    this.setData({
      totalCount: result.count,
      totalPrice: result.total
    })
    // 刷新完整列表（因为引用变了）
    this.loadCart()
  },

  // 减少数量
  onDecrease(e) {
    const id = e.currentTarget.dataset.id
    const result = cartUtil.decreaseQuantity(id)
    this.loadCart()
  },

  // 删除商品
  onDeleteItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定要删除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          const result = cartUtil.removeFromCart(id)
          this.setData({
            totalCount: result.count,
            totalPrice: result.total
          })
          this.loadCart()
        }
      }
    })
  },

  // 清空购物车
  onClearCart() {
    if (this.data.cartList.length === 0) return
    wx.showModal({
      title: '提示',
      content: '确定清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          cartUtil.clearCart()
          this.setData({ cartList: [], totalCount: 0, totalPrice: 0 })
          wx.showToast({ title: '已清空', icon: 'none' })
        }
      }
    })
  },

  // 去结算
  onCheckout() {
    if (this.data.cartList.length === 0) {
      wx.showToast({ title: '购物车是空的', icon: 'none' })
      return
    }

    // 跳转到订单确认页（直接下单）
    this.submitOrder()
  },

  // 提交订单
  submitOrder() {
    const orderUtil = require('../../utils/order')
    const { cartList } = this.data

    // 创建订单
    const order = orderUtil.createOrder(cartList)

    // 清空购物车
    cartUtil.clearCart()

    // 跳转到订单详情（带消息推送）
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${order.orderId}`
    })
  },

  // 返回首页
  goToIndex() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
