import { dateToJson } from '../../utils/index'

const app = getApp()

Page({
  data: {
    isUpdatingPraise: false,
    activity: null,
    onPraisingActivityIds: [],
  },

  onLoad() {
    app.initializeApp()

    this.timer = setInterval(() => {
      const { activity } = this.data
      if (activity && activity.action === 'start') {
        this.setData({ currentTime: new Date().getTime() })
      }
    }, 1000)
  },

  onShow() {
    this.initializePage()
  },

  onUnload() {
    clearInterval(this.timer)
  },

  initializePage() {
    this.getActivity()
  },

  getActivity() {
    wx.cloud.callFunction({
      name: 'getActivity',
      data: {
        query: {
          _id: this.options._id,
        },
        options: {
          licalId: app.globalData.licalUserInfo.lical_id,
          deadline: new Date().getTime(),
        },
      },
      success: res => {
        const { result: activity } = res

        const finalActivity = {
          ...activity,
          json_created_at: dateToJson(activity.created_at),
        }

        if (finalActivity.related_activity) {
          finalActivity.related_activity = {
            ...finalActivity.related_activity,
            json_created_at: dateToJson(finalActivity.related_activity.created_at),
          }
        }

        this.setData({
          activity: finalActivity,
        })
      },
    })
  },

  handlePositionOpen(e) {
    const { position: { location } } = e.currentTarget.dataset

    wx.openLocation({
      latitude: location.lat,
      longitude: location.lng,
    })
  },

  handlePraiseTap(event) {
    const { activity } = event.currentTarget.dataset
    const { isUpdatingPraise } = this.data

    if (isUpdatingPraise) {
      return
    }

    const currentIsPraised = activity.isPraised ? 0 : 1

    this.setData({  
      isUpdatingPraise: true,
      activity: {
        ...activity,
        isPraised: currentIsPraised,
        praisesCount: currentIsPraised
          ? (activity.praisesCount || 0) + 1
          : activity.praisesCount - 1,
      },
    })

    wx.cloud.callFunction({
      name: 'addPraise',
      data: {
        body: {
          type: activity.type,
          from: app.globalData.licalUserInfo.lical_id,
          to: activity._id,
          status: currentIsPraised,
          toLicalId: activity.lical_id,
        },
      },
      success: console.log,
      fail: console.log,
      complete: () => {
        this.setData({ isUpdatingPraise: false })
      },
    })
  },
})