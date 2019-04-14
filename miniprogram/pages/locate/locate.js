const app = getApp()

const TCMap = require('../../libs/qqmap-wx-jssdk.min')
const tcMapSDK = new TCMap({
  key: '3P4BZ-QOBWD-GO24H-PJCB5-J4TOH-XGFI4',
})

Page({
  data: {
    currentUser: {},
    positions: [],
  },

  onShow() {
    app.initializeApp()
    this.initializePage()
  },

  initializePage() {
    this.setData({ currentUser: app.globalData.licalUserInfo })
    this.getLocation().then(positions => {
      this.setData({ positions })
    })
  },

  getLocation() {
    wx.showLoading({
      title: '正在获取定位',
    })
    return new Promise((resolve, reject) => {
      tcMapSDK.reverseGeocoder({
        poi_options: 'policy=4;page_size=10;page_index=1',
        get_poi: '1',
        success: res => {
          wx.hideLoading({
            success: () => {
              resolve(res.result.pois)
            },
          })
        },
        fail: reject,
      })
    })
  },

  onPositionChange(e) {
    const { position } = e.currentTarget.dataset
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    const { callback } = this.options

    if (callback) {
      wx.navigateBack({
        delta: 1,
      })
      prevPage[callback](position)
    }
  }
})