const mealListService = require('../../services/meal-list-service')
const cloudUtil = require('../../utils/cloud')
const dishService = require('../../services/dish-service')

Page({
  data: {
    searchText: '',
    currentCategory: '全部',
    categories: ['全部', '收藏', '荤菜', '素菜', '海鲜', '主食'],
    filteredList: [],
    favoriteIds: [],
    mealListCount: 0,
    loadStatus: 'loading',
    addingDishId: null,
    resultText: '',
    emptyTitle: '没有找到相关菜谱',
    emptyDescription: '可以换个关键词或分类试试'
  },

  // 全量菜品数据（用于筛选）
  _allDishes: [],

  onLoad() {
    this.loadDishes()
    this.updateMealListBadge()
  },

  onShow() {
    this.loadFavorites()
    this.updateMealListBadge()
  },

  // 从云端加载菜品
  async loadDishes() {
    this.setData({ loadStatus: 'loading' })
    try {
      const result = await dishService.loadCatalog()
      this._allDishes = result.dishes
      this.setData({ favoriteIds: result.favoriteIds, loadStatus: 'success' })
      if (result.syncError) console.warn('同步收藏菜谱失败，菜单页继续使用本地缓存', result.syncError.code)
      this.filterDishes()
    } catch (e) {
      console.error('加载菜品失败', e && e.code, e && e.requestId)
      this.setData({ loadStatus: 'error' })
    }
  },

  onRetryLoad() { this.loadDishes() },

  async loadFavorites() {
    try {
      const result = await dishService.loadFavoriteIds()
      this.setData({ favoriteIds: result.favoriteIds })
      this.filterDishes()
      if (result.syncError) console.warn('同步收藏菜谱失败，菜单页继续使用本地缓存', result.syncError.code)
    } catch (error) {
      console.error('读取收藏菜谱缓存失败', error)
    }
  },

  async updateMealListBadge() {
    try {
      const summary = await mealListService.getSummary()
      this.setData({ mealListCount: summary.count })
    } catch (e) {
      console.error('获取饮食清单统计失败', e)
    }
  },

  // 搜索输入
  onSearchInput(e) {
    const searchText = e.detail.value.trim()
    this.setData({ searchText })
    this.filterDishes()
  },

  onClearSearch() {
    this.setData({ searchText: '' })
    this.filterDishes()
  },

  // 分类切换
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ currentCategory: category })
    this.filterDishes()
  },

  // 过滤美食列表
  filterDishes() {
    let list = [...this._allDishes]
    const { searchText, currentCategory, favoriteIds } = this.data
    const favoriteIdSet = new Set(favoriteIds)

    if (currentCategory === '收藏') {
      list = list.filter(item => favoriteIdSet.has(Number(item.id)))
    } else if (currentCategory !== '全部') {
      list = list.filter(item => item.category === currentCategory)
    }

    if (searchText) {
      const keyword = searchText.toLowerCase()
      list = list.filter(item =>
        String(item.name || '').toLowerCase().includes(keyword) ||
        String(item.brief || '').toLowerCase().includes(keyword)
      )
    }

    this.setData({
      filteredList: list.map(item => ({ ...item, isFavorite: favoriteIdSet.has(Number(item.id)) })),
      resultText: `共 ${list.length} 道菜谱`,
      emptyTitle: currentCategory === '收藏' && !searchText ? '还没有收藏菜谱' : '没有找到相关菜谱',
      emptyDescription: currentCategory === '收藏' && !searchText
        ? '打开菜谱详情，把常做的菜收藏起来'
        : '可以换个关键词或分类试试'
    })
  },

  onResetFilters() {
    this.setData({ searchText: '', currentCategory: '全部' })
    this.filterDishes()
  },

  // 点击查看详情
  onDishTap(e) {
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

  // 从菜谱列表加入今日饮食清单
  async onAddToMealList(e) {
    const dish = e.currentTarget.dataset.dish
    if (!dish || this.data.addingDishId !== null) return
    this.setData({ addingDishId: dish.id })
    try {
      const result = await mealListService.addDish(dish)
      this.setData({ mealListCount: result.count })
      wx.showToast({
        title: `${dish.name} 已加入今日清单`,
        icon: 'none'
      })
    } catch (e) {
      wx.showToast({ title: cloudUtil.getErrorMessage(e, '加入失败，请重试'), icon: 'none' })
    } finally {
      this.setData({ addingDishId: null })
    }
  },

  goToMealList() {
    wx.switchTab({ url: '/pages/cart/cart' })
  }
})
