const app = getApp()

Page({
  data: {
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
  },
})