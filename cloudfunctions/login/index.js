const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const getUserRes = await cloud.callFunction({
    name: 'getUser',
    data: {
      query: {
        _openid: wxContext.OPENID,
      },
    },
  })

  return {
    isLogged: Boolean(getUserRes.result.lical_id),
    licalUserInfo: getUserRes.result,
    openid: wxContext.OPENID,
  }
}
