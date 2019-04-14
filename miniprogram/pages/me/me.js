const app = getApp()

// pages/me/me.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isEverAvailable: false,
    authorizeFields: [
      {
        scope: 'scope.userInfo',
        desc: '允许获取用户信息',
        isAvailable: false,
        isEverAvailable: true,
      },
      {
        scope: 'scope.userLocation',
        desc: '允许获取当前位置',
        isAvailable: false,
        isEverAvailable: true,
      },
    ],
    currentUser: {},
  },

  onShow: function () {
    this.initializePage()
  },

  initializePage: function() {
    app.initializeApp()

    this.initializeAuthorizeFields()
  },

  initializeAuthorizeFields: function() {
    wx.getSetting({
      success: res => {
        const newAuthorizeFields = this.data.authorizeFields.map(
          authorizeField => ({
            ...authorizeField,
            isAvailable: res.authSetting[authorizeField.scope],
            isEverAvailable: [false, true].includes(
              res.authSetting[authorizeField.scope]
            ),
          })
        )

        const isEverAvailable = newAuthorizeFields
          .map(f => f.isEverAvailable)
          .includes(true)

        this.setData({
          isEverAvailable,
          authorizeFields: newAuthorizeFields,
          currentUser: app.globalData.licalUserInfo,
        })
      },
    })
  },

  onSwitchTheme: function(e) {
    const updateFields = {}

    updateFields.theme = e.detail.value ? 'dark' : 'light'

    wx.showLoading({
      title: '主题切换中...',
    })

    wx.cloud.callFunction({
      name: 'updateUser',
      data: {
        query: {
          _id: this.data.currentUser._id,
        }, 
        body: updateFields,
      },
      success: () => {
        app.globalData.licalUserInfo.theme = updateFields.theme

        this.initializePage()

        wx.hideLoading({
          success: () => {
            wx.showToast({
              icon: 'success',
              title: `当前为${
                updateFields.theme === 'dark' ? '深色' : '默认'
              }主题`,
            })
          },
        })
      },
    })
  },

  onSwitchAuthInfoAvailable(e) {
    const { scope } = e.currentTarget.dataset

    wx.authorize({
      scope,
      success: () => {
        this.initializePage()
      },
      fail: console.log,
    })
  },
})