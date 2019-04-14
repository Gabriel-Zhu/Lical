const app = getApp()

Page({
  data: {
    defaultAvatarUrl: './user-unlogin.png',
    isLogging: false,
    isAuthorized: false,
    licalIdInput: '',
    logged: false,
    wxUserInfo: {},
  },

  onLoad: function () {
    wx.showShareMenu({ withShareTicket: true })
  },

  onShow: function() {
    this.initilizePage()
  },

  initilizePage: function() {
    if (app.globalData.isLogged) {
      wx.switchTab({
        url: '/pages/home/home',
      })
    } else {
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              success: res => {
                this.setData({
                  isAuthorized: true,
                  wxUserInfo: res.userInfo,
                })
              },
              fail: () => {
                this.setData({
                  isAuthorized: false,
                })
              },
            })
          } else {
            this.setData({
              isAuthorizing: false,
            })
          }
        }
      })
    }
  },

  onIdInput: function (e) {
    this.setData({
      licalIdInput: e.detail.value,
    })
  },

  addLicalUser: function () {
    if (!/^[0-9a-zA-Z_]{4,16}$/.test(this.data.licalIdInput)) {
      wx.showToast({
        icon: 'none',
        title: 'Lical ID 只能是 4 至 16 位数字字母以及下划线的组合！',
      })
      return
    }

    this.setData({ isLogging: true })

    wx.cloud.callFunction({
      name: 'addUser',
      data: {
        body: {
          ...this.data.wxUserInfo,
          lical_id: this.data.licalIdInput,
        },
      },
      success: res => {
        console.log(res)
        app.globalData = {
          ...app.globalData,
          licalUserInfo: res.result,
          isLogged: true,
        }

        this.initilizePage()
      },
      fail: console.log,
    })
  },

  onGetWxUserInfo: function (e) {
    if (e.detail.userInfo) {
      this.setData({
        isAuthorized: true,
        wxUserInfo: e.detail.userInfo,
      })

      this.addLicalUser()
    }
  },
})
