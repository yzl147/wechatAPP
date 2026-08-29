const mealRecordService = require('../../services/meal-record-service')

Page({
  data: { mealType: 'dine_out', venue: '', dishes: '', remark: '' },

  chooseType(e) { this.setData({ mealType: e.currentTarget.dataset.type }) },
  onVenueInput(e) { this.setData({ venue: e.detail.value }) },
  onDishesInput(e) { this.setData({ dishes: e.detail.value }) },
  onRemarkInput(e) { this.setData({ remark: e.detail.value }) },

  async saveMeal() {
    const { mealType, venue, dishes, remark } = this.data
    if (!venue.trim() || !dishes.trim()) {
      wx.showToast({ title: '请填写地点和吃了什么', icon: 'none' })
      return
    }
    wx.showLoading({ title: '保存中...' })
    try {
      const record = await mealRecordService.saveExternalMeal({ mealType, venue, dishes, remark })
      wx.hideLoading()
      wx.redirectTo({ url: `/pages/order-detail/order-detail?recordId=${record.recordId}` })
    } catch (e) {
      wx.hideLoading()
      console.error('保存快速饮食记录失败', e)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  }
})
