const foods = require('../../data/foods')

Page({
  data: {
    searchText: '',
    currentCategory: '全部',
    categories: ['全部', '荤菜', '素菜', '海鲜', '主食'],
    filteredList: []
  },

  onLoad() {
    this.setData({
      filteredList: foods
    })
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
    let list = foods
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
  }
})
