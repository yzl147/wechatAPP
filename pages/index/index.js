const cartUtil = require('../../utils/cart')

Page({
  data: {
    searchText: '',
    currentCategory: '全部',
    categories: ['全部', '荤菜', '素菜', '海鲜', '主食'],
    filteredList: [],
    cartCount: 0,
    loading: true
  },

  // 全量菜品数据（用于筛选）
  _allDishes: [],

  onLoad() {
    this.loadDishes()
    this.updateCartBadge()
  },

  onShow() {
    this.updateCartBadge()
  },

  // 从云端加载菜品
  async loadDishes() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'manageDishes',
        data: { action: 'list' }
      })
      const dishes = res.result.data || []
      this._allDishes = dishes
      this.setData({ filteredList: dishes, loading: false })
    } catch (e) {
      console.error('加载菜品失败', e)
      this.setData({ loading: false })
    }
  },

  async updateCartBadge() {
    try {
      const info = await cartUtil.getCartTotal()
      this.setData({ cartCount: info.count })
    } catch (e) {
      console.error('获取购物车统计失败', e)
    }
  },

  // 搜索输入
  onSearchInput(e) {
    const searchText = e.detail.value.trim()
    this.setData({ searchText })
    this.filterFoods()
  },

  // 分类切换
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ currentCategory: category })
    this.filterFoods()
  },

  // 过滤美食列表
  filterFoods() {
    let list = [...this._allDishes]
    const { searchText, currentCategory } = this.data

    if (currentCategory !== '全部') {
      list = list.filter(item => item.category === currentCategory)
    }

    if (searchText) {
      const keyword = searchText.toLowerCase()
      list = list.filter(item =>
        item.name.toLowerCase().includes(keyword) ||
        item.brief.toLowerCase().includes(keyword)
      )
    }

    this.setData({ filteredList: list })
  },

  // 点击查看详情
  onFoodTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 预览菜品图片
  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    const allUrls = this.data.filteredList
      .map(item => item.image)
      .filter(Boolean)
    wx.previewImage({
      current: url,
      urls: allUrls
    })
  },

  // 加入购物车（从列表）
  async onAddToCart(e) {
    const food = e.currentTarget.dataset.food
    try {
      const result = await cartUtil.addToCart(food)
      this.setData({ cartCount: result.count })
      wx.showToast({
        title: `${food.name} 已加入今日清单`,
        icon: 'none'
      })
    } catch (e) {
      console.error('加入今日清单失败', e)
    }
  }
})
