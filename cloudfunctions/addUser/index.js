// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const user = {
    ...event.body,
    _openid: wxContext.OPENID,
  }

  const addItemRes = await db.collection('users').add({
    data: user,
  })

  return {
    ...user,
    _id: addItemRes._id,
  }
}