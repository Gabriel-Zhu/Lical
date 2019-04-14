const app = getApp()

Page({
  data: {
    currentUser: {},
    tabs: {
      friends: {
        name: '好友',
        isActive: true,
      },
    },
  },

  onShow: function() {
    this.initalizePage()
  },

  initalizePage: function() {
    app.initializeApp()

    this.setData({
      currentUser: app.globalData.licalUserInfo,
    })
  },
})