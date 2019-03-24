//index.js
const app = getApp()

Page({
  data: {
    logoUrl: './logo.jpeg',
    authorized: false,
    userInfo: {},
    licalUserInfo: {},
    licalIdInput: '',
    logged: false,
  },

  onLoad: function() {
    if (!wx.cloud) {
      wx.showToast({
        icon: 'none',
        title: 'Unable to connect to the network!',
      })
      return
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.setData({
                authorized: true,
                userInfo: res.userInfo,
              })

              this.onGetOpenid()
            }
          })
        }
      }
    })
  },

  onIdInput: function(e) {
    this.setData({
      licalIdInput: e.detail.value,
    })
  },

  onAddLicalUser: function() {
    const db = wx.cloud.database()

    if (!/^[0-9a-zA-Z_]{1,}$/.test(this.data.licalIdInput)) {
      wx.showToast({
        icon: 'none',
        title: 'Input format error!',
      })
      return
    }

    if (this.data.logged) {
      wx.navigateTo({ url: '/pages/home/home' })
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

        wx.navigateTo({ url: '/pages/home/home' })
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
              logged: true,
              licalIdInput: licalUserInfo.lical_id,
            })

            wx.navigateTo({ url: '/pages/home/home' })
          }
        }
      })
  },

  onGetUserInfo: function(e) {
    if (!this.authorized && e.detail.userInfo) {
      this.setData({
        authorized: true,
        userInfo: e.detail.userInfo,
      })
    }
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

})
