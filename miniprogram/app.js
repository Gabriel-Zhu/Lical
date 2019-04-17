import utils from './utils/index'
import { THEME_CONFIG } from './constants/index'

App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }

    this.globalData = {}
  },

  initializeApp: function() {
    const pages = getCurrentPages()
    const curPage = pages[pages.length - 1]
    curPage.setData({ currentUser: this.globalData.licalUserInfo })

    this.updateAppTheme()
  },

  updateAppTheme: function() {
    const { licalUserInfo } = this.globalData

    if (licalUserInfo && licalUserInfo.theme) {
      const {
        fontColor,
        textStyle,
        infoFontColor,
        appBackgroundColor,
        pageBackgroundColor,
      } = THEME_CONFIG[licalUserInfo.theme]

      wx.setNavigationBarColor({
        frontColor: fontColor,
        backgroundColor: pageBackgroundColor,
      })
      wx.setBackgroundTextStyle({
        textStyle,
      })
      wx.setBackgroundColor({
        backgroundColor: appBackgroundColor,
      })
      wx.setTabBarStyle({
        borderStyle: 'black',
        backgroundColor: pageBackgroundColor,
        color: infoFontColor,
        selectedColor: fontColor,
      })
    }
  },
})
