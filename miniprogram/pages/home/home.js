import { dateToJson } from '../../utils/index'

const app = getApp()

const getInitialActivityListQuery = () => ({
  skip: 0,
  limit: 10,
})

Page({
  data: {
    isFetchingActivityList: false,
    currentTime: new Date().getTime(),
    deadline: new Date().getTime(),
    tabs: [
      {
        name: '关注',
        isActive: true,
      },
      {
        name: '我的',
        isActive: false,
      },
    ],
    includesOngoingActivity: false,
    onPraisingActivityIds: [],
    activityList: [],
    activityListQuery: getInitialActivityListQuery(),
  },

  onLoad() {
    this.timer = setInterval(() => {
      if (this.data.includesOngoingActivity) {
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

  onPullDownRefresh: function() {
    this.getActivityList(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  initializePage: function() {
    app.initializeApp()

    if (!wx.cloud) {
      wx.showToast({
        icon: 'none',
        title: '无法连接到网络！',
      })
      return
    }

    if (
      !app.globalData.licalUserInfo
      || !app.globalData.licalUserInfo.lical_id
    ) {
      wx.navigateTo({
        url: '/pages/index/index',
      })
    }

    const timer = setInterval(() => {
      if (
        app.globalData.licalUserInfo
        && app.globalData.licalUserInfo.lical_id
      ) {
        wx.showShareMenu()

        this.getActivityList()
        clearInterval(timer)
      }

    }, 500)
  },

  onSwitchTab: function (e) {
    const { tabName } = e.currentTarget.dataset
    const { tabs, isFetchingActivityList } = this.data
    if (
      !isFetchingActivityList
      && !tabs.find(tab => tab.name === tabName).isActive
    ) {
      this.setData({
        tabs: tabs.map(tab => ({
          ...tab,
          isActive: tab.name === tabName,
        })),
      })

      this.getActivityList(true)
    }
  },

  onButtonsToggle: function() {
    const { postButtonsShown, postButtons } = this.data
    if (postButtonsShown) {
      this.setData({ postButtonsShown: false })
    } else {
      this.onGetLastActivity().then(({ result: lastActivity }) => {
        this.setData({
          postButtonsShown: true,
          postButtons: this.getPostButtons(lastActivity),
        })
      })
    }
  },

  onReachBottom: function() {
    this.getActivityList()
  },

  getActivityList: function(isRefresh = false) {
    if (this.data.isFetchingActivityList) {
      return Promise.reject()
    }

    if (isRefresh) {
      wx.showLoading({
        title: '正在刷新',
      })
    }

    this.setData({
      isFetchingActivityList: true,
      ...(isRefresh ? {
        deadline: new Date().getTime(),
        activityListQuery: getInitialActivityListQuery(),
      } : {}),
      includesOngoingActivity: isRefresh ? false : this.data.includesOngoingActivity,
    })

    const db = wx.cloud.database()
    const _ = db.command
    const { activityListQuery: { skip, limit } } = this.data
    const query = {}

    if (this.data.tabs[1].isActive) {
      query._openid = app.globalData.openid
    }

    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getActivityList',
        data: {
          query,
          options: {
            deadline: this.data.deadline,
            skip,
            limit,
            licalId: app.globalData.licalUserInfo.lical_id,
          },
        },
        success: res => {
          let { includesOngoingActivity } = this.data

          const newActivityList = res.result.list.map(activity => {  
            const { type, lical_id, created_at } = activity

            if (activity.action === 'start') {
              includesOngoingActivity = true
            }

            const finalActivity = {
              ...activity,
              json_created_at: dateToJson(created_at),
              related_activity: activity.related_activity ? {
                ...activity.related_activity,
                json_created_at: dateToJson(activity.related_activity.created_at)
              } : undefined,
            }

            return finalActivity
          })

          this.setData({
            includesOngoingActivity,
            isFetchingActivityList: false,
            activityList: [
              ...(isRefresh ? [] : this.data.activityList),
              ...newActivityList,
            ],
            activityListQuery: {
              skip: skip + limit,
              limit,
            },
          })

          if (isRefresh) {
            wx.hideLoading()
            resolve()
            return
          }
          resolve()
        },
        fail: reject,
      })
    })
  },

  onGetLastActivity: function() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getLastActivity',
        data: {
          query: { _openid: app.globalData.openid }
        },
        success: resolve,
        fail: reject,
      })
    })
  },

  onPost: function(event) {
    wx.navigateTo({
      url: 'pages/post/post',
    })
  },

  getActivityTips: function(activity = {}) {
    const {
      is_invalid,
      type,
      action,
      is_afternoon,
      related_activity,
      created_at,
      json_created_at: { hours } = {},
    } = activity
    const tips = []

    if (type === undefined || hours === undefined) {
      return null
    }

    if (is_invalid) {
      tips.push({
        type: 'danger',
        content: '该记录无效',
      })
    }

    const duration = related_activity
      ? created_at - related_activity.created_at
      : (
        created_at > 1554689082873
          ? new Date().getTime() - created_at
          : undefined
      )

    if (action !== 'start') {
      switch (type) {
        case 'sleep': {
          if (hours >= 9 && hours < 12) {
            tips.push({
              type: 'warn',
              content: '建议 9 点之前起床',
            })
          }

          if (duration !== undefined) {
            tips.push({
              type: hours < 12 && duration < 8 * 60 * 60 * 1000
                ? 'warn'
                : 'normal',
              content: `本次${
                is_afternoon ? '午睡' : '睡眠'
                }时长${
                this.formatDuration(duration)
                }`,
            })
          }

          break
        }
        case 'exercise': {
          tips.push({
            type: 'normal',
            content: `本次运动时长${this.formatDuration(duration)}`,
          })
          break
        }
        default:
          break
      }
    }

    return tips
  },

  formatDuration: function(duration = 0) {
    const totalSeconds = parseFloat(duration) / 1000   //先将毫秒转化成秒
    const _days = parseInt(totalSeconds / (24 * 60 * 60), 10)
    const hours = parseInt(totalSeconds % (24 * 60 * 60) / (60 * 60), 10)
    const minutes = parseInt(totalSeconds % (60 * 60) / 60, 10)
    const seconds = parseInt(totalSeconds % 60, 10)
    const dayStr = _days
      ? ` ${_days} 天`
      : ''
    const hourStr = (_days || hours)
      ? ` ${hours} 小时`
      : ''
    const minuteStr = (_days || hours || minutes)
      ? ` ${minutes} 分`
      : ''
    const secondStr = (_days || hours || minutes || seconds)
      ? ` ${seconds} 秒`
      : ''

    return `${dayStr}${hourStr}${minuteStr}${secondStr}`
  },

  handlePositionOpen: function(e) {
    const { position: { location } } = e.currentTarget.dataset

    wx.openLocation({
      latitude: location.lat,
      longitude: location.lng,
    })
  },

  handlePraiseTap(event) {
    const { activity } = event.currentTarget.dataset
    const { onPraisingActivityIds, activityList } = this.data

    if (onPraisingActivityIds.includes(activity._id)) {
      return
    }

    onPraisingActivityIds.push(activity._id)

    const currentIsPraised = activity.isPraised ? 0 : 1 

    this.setData({
      onPraisingActivityIds,
      activityList: activityList.map(
        a => a._id === activity._id ? {
          ...activity,
          isPraised: currentIsPraised,
          praisesCount: currentIsPraised ? (a.praisesCount || 0) + 1 : a.praisesCount - 1,
        } : a
      ),
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
        this.setData({
          onPraisingActivityIds: onPraisingActivityIds.filter(
            id => id !== activity._id
          ),
        })
      },
    })
  },
})