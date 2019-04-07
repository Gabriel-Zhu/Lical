const app = getApp()

const ACTIVITY_DESC_MAP = {
  'sleep': 'went to sleep',
  'get_up': 'went up',
}

const ACTIVITY_DEFAULT_CONTENT_MAP = {
  'sleep': '晚安！😴',
  'get_up': '早安！🌞',
}

const ACTIVITY_TIP_MAP = {
  'sleep': {
    'danger': '晚睡猝死警告',
  },
  'get_up': {
    'danger': '晚起毁一天警告',
  },
}

const getInitialActivityListQuery = () => ({
  skip: 0,
  limit: 10,
})

Page({
  data: {
    pageTimestamp: new Date().getTime(),
    activityTipMap: ACTIVITY_TIP_MAP,
    scrollTop: 0,
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
    postButtonsShown: false,
    activityDescMap: ACTIVITY_DESC_MAP,
    activityDefaultContentMap: ACTIVITY_DEFAULT_CONTENT_MAP,
    activityList: [],
    userMap: {},
    activityListQuery: getInitialActivityListQuery(),
  },

  onSwitchTab: function(e) {
    this.setData({
      tabs: this.data.tabs.map(tab => ({
        ...tab,
        isActive: tab.name === e.currentTarget.dataset.tabName,
      })),
    })

    this.onGetActivityList(true)
  },

  onLoad: function () {
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

        this.onGetActivityList(true)
        clearInterval(timer)
      }
       
    }, 500)
  },

  onButtonsToggle: function() {
    this.setData({ postButtonsShown: !this.data.postButtonsShown })
  },

  onScrollToTop: function() {
    this.setData({ scrollTop: 0 })
  },

  onScrollToBottom: function() {
    this.onGetActivityList()
  },

  onScroll: function(e) {
    this.setData({ scrollTop: e.detail.scrollTop })
  },

  onGetActivityList: function(isRefresh = false) {
    if (isRefresh) {
      this.setData({
        pageTimestamp: new Date().getTime(),
        activityList: [],
        userMap: {},
        activityListQuery: getInitialActivityListQuery(),
      })
    }

    const db = wx.cloud.database()
    const _ = db.command
    const { activityListQuery: { skip, limit } } = this.data
    const filter = {
      created_at: _.gt(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
        .and(_.lt(this.data.pageTimestamp)),
    }

    if (this.data.tabs[1].isActive) {
      filter._openid = app.globalData.openid
    }

    db.collection('activities')
      .where(filter)
      .orderBy('created_at', 'desc')
      .skip(skip)
      .limit(limit)
      .get({
        success: res => {
          const userIds = []
          const newActivities = res.data.map(activity => {
            const { type, lical_id, created_at } = activity
            const finalActivity = {
              ...activity,
              formated_created_at: this.formatDate(created_at),
            }
            const {
              formated_created_at: { hours },
            } = finalActivity

            if (type === 'get_up' && hours >= 9 && hours < 12) {
              finalActivity.tip = {
                type: 'danger',
              }
            } else if (type === 'sleep' && hours >= 0 && hours <= 11) {
              finalActivity.tip = {
                type: 'danger',
              }
            }

            userIds.push(lical_id)

            return finalActivity
          })

          this.onGetUserList(userIds)
          this.setData({
            activityList: [
              ...this.data.activityList,
              ...newActivities,
            ],
            activityListQuery: {
              skip: skip + limit,
              limit,
            }, 
          })
        },
      })
  },

  onGetUserList: function(licalIds) {
    const db = wx.cloud.database()
    const _ = db.command

    db.collection('users')
      .where({ lical_id: _.in(licalIds) })
      .get({
        success: res => {
          this.setData({
            userMap: res.data.reduce((result, item) => ({
              ...result,
              [item.lical_id]: item,
            }), this.data.userMap),
          })
        },
      })
  },

  onPost: function(type) {
    const db = wx.cloud.database()
    const { licalUserInfo: { lical_id } } = app.globalData

    db.collection('activities').add({
      data: {
        type,
        lical_id,
        created_at: new Date().getTime(),
      },
      success: () => {
        wx.showToast({
          icon: 'success',
          title: '打卡成功！',
        })

        this.onGetActivityList(true)
      },
    })
  },

  onSleep: function() {
    this.onPost('sleep')
  },

  onGetUp: function () {
    this.onPost('get_up')
  },

  formatDate: function(timestamp) {
    const add0 = m => m < 10 ? '0' + m : m
    //timestamp是整数，否则要parseInt转换
    const time = new Date(timestamp)
    const years = time.getFullYear()
    const months = time.getMonth() + 1
    const days = time.getDate()
    const hours = time.getHours()
    const minutes = time.getMinutes()
    const seconds = time.getSeconds()
    return {
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      date: `${years}-${add0(months)}-${add0(days)}`,
      time: `${add0(hours)}:${add0(minutes)}`,
    }
  },
})