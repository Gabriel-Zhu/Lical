// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const queryListRes = await db.collection('activities')
    .where({
      _openid: wxContext.OPENID,
      ...(event.query || {}),
    })
    .orderBy('created_at', 'desc')
    .skip(0)
    .limit(1)
    .get()

  return queryListRes.data && queryListRes.data[0] || {}
}