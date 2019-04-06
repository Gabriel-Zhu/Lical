const app = getApp()

const ACTIVITY_DESC_MAP = {
  'sleep': 'went to sleep',
  'get_up': 'went up',
}

const ACTIVITY_DEFAULT_CONTENT_MAP = {
  'sleep': 'Good night! 😴',
  'get_up': 'Good morning! 🌞',
}

Page({
  data: {
    tabs: [
      {
        name: 'Watched',
        isActive: true,
      },
      {
        name: 'Only Me',
        isActive: false,
      },
    ],
    postButtonsShown: false,
    activityDescMap: ACTIVITY_DESC_MAP,
    activityDefaultContentMap: ACTIVITY_DEFAULT_CONTENT_MAP,
    activityListMap: {},
    userMap: {},
  },

  onSwitchTab: function(e) {
    this.setData({
      tabs: this.data.tabs.map(tab => ({
        ...tab,
        isActive: tab.name === e.currentTarget.dataset.tabName,
      })),
    })

    this.onGetActivityList()
  },

  onLoad: function () {
    wx.showShareMenu()

    this.onGetActivityList()
  },

  onButtonsToggle: function() {
    this.setData({ postButtonsShown: !this.data.postButtonsShown })
  },

  onGetActivityList: function () {
    const db = wx.cloud.database()
    const _ = db.command
    const filter = {
      created_at: _.gt(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
    }

    if (this.data.tabs[1].isActive) {
      filter._openid = app.globalData.openid
    }

    db.collection('activities')
      .where(filter)
      .orderBy('created_at', 'desc')
      .get({
        success: res => {
          const activities = res.data
          const userIds = []
  
          const activityListMap = {}

          activities.forEach(item => {
            const activity = {
              ...item,
              formated_created_at: this.formatDate(item.created_at),
            }

            const { date } = activity.formated_created_at

            if (activityListMap[date]) {
              activityListMap[date] = [
                ...activityListMap[date],
                activity,
              ]
            } else {
              activityListMap[date] = [activity]
            }

            userIds.push(activity.lical_id)
          })

          this.onGetUserList(userIds)

          this.setData({ activityListMap })
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
          title: 'Post successfully!',
        })

        this.onGetActivityList()
      },
      fail: error => {
        console.log(error)
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
    const y = time.getFullYear()
    const m = time.getMonth() + 1
    const d = time.getDate()
    const h = time.getHours()
    const mm = time.getMinutes()
    const s = time.getSeconds()
    return {
      date: `${y}-${add0(m)}-${add0(d)}`,
      time: `${add0(h)}:${add0(mm)}`,
    }
  },
})