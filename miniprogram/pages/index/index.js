//index.js
const app = getApp()

Page({
  data: {
    logoUrl: './logo.jpeg',
  },

  onLoad: function() {
    this.login()
  },

  login: function () {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        const { isLogged, licalUserInfo } = res.result

        app.globalData = {
          ...res.result,
        }

        if (isLogged) {
          app.globalData.licalUserInfo = licalUserInfo
          app.initializeApp()
          wx.switchTab({
            url: '/pages/home/home',
          })
        } else {
          wx.navigateTo({
            url: '/pages/register/register',
          })
        }
      },
      fail: () => {
        wx.showToast({
          icon: 'none',
          title: '登录失败',
        })
      },
    })
  },
})
