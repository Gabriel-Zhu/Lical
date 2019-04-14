// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database();
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { lical_ids, openids } = event
  const query = {}

  if (lical_ids) {
    query.lical_id = _.in(lical_ids)
  }

  if (openids) {
    query._openid = _.in(openids)
  }

  const queryListRes = await db.collection('users')
    .where(query)
    .get()

  return {
    list: queryListRes.data,
  }
}