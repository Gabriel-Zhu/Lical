// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const body = {}

  Object.keys(event.body).forEach(key => {
    body[key] = _.set(event.body[key])
  })

  return await db.collection('users').doc(event.query._id).update({
    data: body,
  })
}