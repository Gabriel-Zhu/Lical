// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const queryListRes = await db.collection('users')
    .where(event.query)
    .skip(0)
    .limit(1)
    .get()

  return queryListRes.data && queryListRes.data[0] || {}
}