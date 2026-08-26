const cartUtil = require('../../utils/cart')
const orderUtil = require('../../utils/order')
const cloudUtil = require('../../utils/cloud')

Page({
  data: {
    cartList: [],
    totalCount: 0,
    totalPrice: 0,
    loadStatus: 'loading'
  },

  onShow() {
    this.loadCart()
  },

  async loadCart() {
    const hasData = this.data.cartList.length > 0
    if (!hasData) this.setData({ loadStatus: 'loading' })
    try {
      const info = await cartUtil.getCartInfo()
      const list = info.list.map(item => ({
        ...item,
        subtotal: (item.price * item.quantity).toFixed(2),
        // 购物车项用 foodId 或 id 作为标识
        itemId: item.foodId || item.id
      }))
      this.setData({
        cartList: list,
        totalCount: info.count,
        totalPrice: info.total,
        loadStatus: 'success'
      })
    } catch (e) {
      console.error('加载今日清单失败', e && e.code, e && e.requestId)
      if (!hasData) this.setData({ loadStatus: 'error' })
      else this.showError(e, '刷新失败，请重试')
    }
  },

  onRetryLoad() { this.loadCart() },

  showError(error, fallback) {
    wx.showToast({ title: cloudUtil.getErrorMessage(error, fallback), icon: 'none' })
  },

  // 增加数量
  async onIncrease(e) {
    const id = e.currentTarget.dataset.id
    try {
      await cartUtil.increaseQuantity(id)
      this.loadCart()
    } catch (e) {
      this.showError(e, '增加数量失败，请重试')
    }
  },

  // 减少数量
  async onDecrease(e) {
    const id = e.currentTarget.dataset.id
    try {
      await cartUtil.decreaseQuantity(id)
      this.loadCart()
    } catch (e) {
      this.showError(e, '减少数量失败，请重试')
    }
  },

  // 删除商品
  onDeleteItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定要删除这个商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cartUtil.removeFromCart(id)
            this.loadCart()
          } catch (e) {
            this.showError(e, '删除失败，请重试')
          }
        }
      }
    })
  },

  // 清空今日清单
  onClearCart() {
    if (this.data.cartList.length === 0) return
    wx.showModal({
      title: '提示',
      content: '确定清空今日清单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cartUtil.clearCart()
            this.setData({ cartList: [], totalCount: 0, totalPrice: 0 })
            wx.showToast({ title: '今日清单已清空', icon: 'none' })
          } catch (e) {
            this.showError(e, '清空失败，请重试')
          }
        }
      }
    })
  },

  // 去结算
  onCheckout() {
    if (this.data.cartList.length === 0) {
      wx.showToast({ title: '清单还是空的', icon: 'none' })
      return
    }
    this.submitOrder()
  },

  goToShoppingList() {
    if (this.data.cartList.length === 0) {
      wx.showToast({ title: '先添加想做的菜吧', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/shopping-list/shopping-list' })
  },

  // 提交订单
  async submitOrder() {
    const { cartList } = this.data
    wx.showLoading({ title: '保存中...' })
    try {
      const order = await orderUtil.createOrder(cartList)
      await cartUtil.clearCart()
      wx.hideLoading()
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?orderId=${order.orderId}`
      })
    } catch (e) {
      wx.hideLoading()
      this.showError(e, '保存失败，请重试')
    }
  },

  // 去选菜
  goToIndex() {
    wx.navigateTo({
      url: '/pages/index/index'
    })
  },

  // 预览菜品图片
  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    const allUrls = this.data.cartList
      .map(item => item.image)
      .filter(Boolean)
    wx.previewImage({
      current: url,
      urls: allUrls
    })
  }
})
