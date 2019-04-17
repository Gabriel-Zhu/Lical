import { dateToJson } from '../../utils/index'

const app = getApp()

const ENTITY_TYPE_MAP = {
  sleep: '睡眠记录',
  travel: '签到',
  exercise: '运动记录',
}

Page({
  data: {
    isFetchingPaiseLsit: false,
    paiseLsit: [],
    tabs: {
      praises: {
        name: '收到的赞',
        isActive: true,
      },
    },
    deadline: new Date().getTime(),
    entityTypeMap: ENTITY_TYPE_MAP,
  },

  onShow() {
    app.initializeApp()
    this.initializePage()
  },

  initializePage() {
    this.getPraiseList(true).then(() => {
      if (app.globalData.unreadPraisesCount) {
        this.readPraises().then(() => {
          wx.removeTabBarBadge({ index: 2 })
        })
      }
    })
  },

  getPraiseList(isRefresh) {
    const { deadline } = this.data

    wx.showLoading({
      title: '正在加载通知',
    })

    if (isRefresh) {
      this.setData({
        deadline: new Date().getTime(),
      })
    }

    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getPraiseList',
        data: {
          query: {
            toLicalId: app.globalData.licalUserInfo.lical_id,
          },
          options: {
            deadline,
            skip: 0,
            limit: 100,
          },
        },
        success: res => {
          wx.hideLoading()
          this.setData({
            praiseList: res.result.list.map(
              item => ({
                ...item,
                jsonCreatedAt: dateToJson(item.createdAt),
              })
            ),
          })
          resolve()
        },
        fail: e => {
          console.log(e)
          reject()
        },
      })
    })
  },

  readPraises() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'updatePraise',
        data: {
          query: {
            toLicalId: app.globalData.licalUserInfo.lical_id,
          },
          options: {
            dealine: this.data.deadline,
          },
        },
        success: resolve,
        fail: reject,
      })
    })
  },
})