//index.js
const app = getApp()

Page({
  data: {
    isAuthorizing: true,
    isLogging: true,
    isCreating: false,
    logoUrl: './logo.jpeg',
    authorized: false,
    userInfo: {},
    licalIdInput: '',
    logged: false,
  },

  onLoad: function() {
    if (!wx.cloud) {
      wx.showToast({
        icon: 'none',
        title: '无法连接到网络！',
      })
      return
    }

    wx.showShareMenu()

    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.setData({
                isAuthorizing: false,
                authorized: true,
                userInfo: res.userInfo,
              })

              this.onGetOpenid()
            },
            fail: () => {
              this.setData({
                isAuthorizing: false,
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
  },

  onNavigateToHome: function() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  onIdInput: function(e) {
    this.setData({
      licalIdInput: e.detail.value,
    })
  },

  onAddLicalUser: function() {
    const db = wx.cloud.database()

    console.log(this.data.licalIdInput)
    if (!/^[0-9a-zA-Z_]{4,16}$/.test(this.data.licalIdInput)) {
      wx.showToast({
        icon: 'none',
        title: 'Lical ID 只能是 4 至 16 位数字字母以及下划线的组合！',
      })
      return
    }

    if (this.data.logged) {
      this.onNavigateToHome()
      return
    }

    db.collection('users').add({
      data: {
        ...this.data.userInfo,
        lical_id: this.data.licalIdInput,
      },
      success: res => {
        app.globalData.licalUserInfo = {
          ...this.data.userInfo,
          lical_id: this.data.licalIdInput,
          _id: res._id,
        }

        this.setData({ logged: true })

        this.onNavigateToHome()
      },
      fail: error => {
        console.log(error)
      }
    })  
  },

  onGetLicalUser: function () {
    const db = wx.cloud.database()
    db.collection('users').where(db.command.or({
      _openid: app.globalData.openid,
    }, {
      lical_id: this.data.licalIdInput,
    })).get({
      success: res => {
        const licalUserInfo = res.data && res.data[0] || {}

        if (licalUserInfo._openid === app.globalData.openid) {
          app.globalData.licalUserInfo = licalUserInfo

          this.setData({
            isLogging: false,
            logged: true,
            licalIdInput: licalUserInfo.lical_id,
          })

          this.onNavigateToHome()
        } else {
          this.setData({
            logged: false,
            isLogging: false,
          })
        }
      },
      fail: function() {
        this.setData({
          isLogging: false,
        })
      },
    })
  },

  onGetUserInfo: function(e) {
    if (!this.authorized && e.detail.userInfo) {
      this.setData({
        authorized: true,
        userInfo: e.detail.userInfo,
      })

      this.onGetOpenid()
    }

    this.setData({ isAuthorizing: false })
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.openid = res.result.openid

        this.onGetLicalUser()
      }
    })
  },

  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        
        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            
            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },

  getLicalUserInfo: function() {
    return app.globalData.licalUserInfo || {}
  },

})
