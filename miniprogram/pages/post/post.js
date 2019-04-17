const TCMap = require('../../libs/qqmap-wx-jssdk.min')
const tcMapSDK = new TCMap({
  key: '3P4BZ-QOBWD-GO24H-PJCB5-J4TOH-XGFI4',
})

const app = getApp()

const getInitialCards = () => [
  {
    type: 'sleep',
    icon: '😴',
    name: '睡眠',
    tips: [
      {
        type: 'warn',
        content: '建议 23 点之前入睡',
      },
      {
        type: 'warn',
        content: '建议 9 点之前起床',
      },
      {
        type: 'warn',
        content: '建议夜间睡觉时长满 8 小时',
      },
      {
        type: 'warn',
        content: '睡觉时长不足 10 分钟或者超过 12 小时将被标记为无效记录',
      },
    ],
    button: {
      action: 'start',
      name: '开始睡眠',
      disabled: true,
    },
  },
  {
    type: 'exercise',
    icon: '🏃',
    name: '运动',
    tips: [
      {
        type: 'warn',
        content: '建议晚上 9 点之前开始运动',
      },
      {
        type: 'warn',
        content: '建议一次运动时长满 45 分钟',
      },
      {
        type: 'warn',
        content: '运动时长不足 10 分钟或者超过 3 小时将被标记为无效记录',
      },
    ],
    button: {
      action: 'start',
      name: '开始运动',
      disabled: true,
    },
  },
  {
    type: 'travel',
    icon: '✈️',
    name: '旅行',
    tips: [
      {
        type: 'warn',
        content: '发现更大的世界',
      },
    ],
    button: {
      name: '签到',
      disabled: true,
    },
  },
]

Page({
  data: {
    isInitializingCard: false,
    cards: [],
    position: null,
  },

  onLoad() {
    this.getPosition()
  },

  onShow() {
    this.initilizePage()
  },

  initilizePage: function() {
    app.initializeApp()

    const { licalUserInfo } = app.globalData

    this.setData({ cards: getInitialCards() })

    this.getCards()
  },

  post: function (type, action) {
    this.setData({ cards: getInitialCards() })

    const db = wx.cloud.database()
    const { licalUserInfo: { lical_id } } = app.globalData

    this.addActivity({
      type,
      action,
      lical_id,
      created_at: new Date().getTime(),
      position: this.data.position,
    })
  },

  addTravelActivity: function(position) {
    this.addActivity({
      type: 'travel',
      lical_id: app.globalData.licalUserInfo.lical_id,
      created_at: new Date().getTime(),
      position,
    })
  },


  addActivity: function(body) {
    wx.showLoading({
      title: '正在发布',
    })

    wx.cloud.callFunction({
      name: 'addActivity',
      data: {
        body,
      },
      success: () => {
        wx.hideLoading({
          success: () => {
            wx.showToast({
              icon: 'success',
              title: '发布成功！',
              success: () => {
                const pages = getCurrentPages()
                const prevPage = pages[pages.length - 2]

                wx.navigateBack({
                  delta: 1,
                })

                prevPage.getActivityList(true)
              },
            })
          },
        })
      },
      fail: () => {
        wx.showToast({ title: '发布失败' })
      },
    })
  },

  getPosition() {
    wx.showLoading({
      title: '正在获取定位',
    })
    return new Promise((resolve, reject) => {
      tcMapSDK.reverseGeocoder({
        poi_options: 'policy=4;page_size=1;page_index=1',
        get_poi: '1',
        success: res => {
          wx.hideLoading()
          this.setData({
            position: res && res.result
              && res.result.pois
              && res.result.pois[0]
              || null,
          })
        },
        fail: reject,
      })
    })
  },

  handlePostionTap: function() {
    wx.navigateTo({
      url: '/pages/locate/locate?callback=setPosition',
    })
  },

  setPosition: function(position) {
    this.setData({ position })
  },

  onGetLastActivity: function () {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getLastActivity',
        success: resolve,
        fail: reject,
      })
    })
  },

  getCards: function() {
    this.setData({ isInitializingCard: true })
    this.onGetLastActivity().then(res => {
      this.setData({ isInitializingCard: false })
      this.getPostButtons(res.result)
    })
  },

  getPostButtons: function (lastActivity) {
    const postButtons = []
    const { type: lastType, action: lastAction, is_afternoon } = lastActivity

    const { isInitializingCard, position } = this.data

    this.setData({
      cards: getInitialCards().map(card => ({
        ...card,
        button: {
          action: card.type === lastType && lastAction === 'start'
            ? 'end'
            : card.button.action,
          name: card.type === lastType && lastAction === 'start'
            ? `结束${card.name}`
            : card.button.name,
          disabled: isInitializingCard
            || card.type !== lastType && lastAction === 'start'
            || card.type === 'travel' && (!position || !position.id),
        },
      })),
    })
  },

  handlePostButtonTap: function (event) {
    const { type, action } = event.currentTarget.dataset
    this.post(type, action)
  },
})