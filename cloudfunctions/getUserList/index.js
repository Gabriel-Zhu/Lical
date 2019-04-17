// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database();
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const {
    query = {},
    options: {
      skip = 0,
      limit,
    } = {},
  } = event

  if (Array.isArray(query.lical_id)) {
    query.lical_id = _.in(query.lical_id)
  }

  let queryListCommand = db.collection('users')
    .orderBy('createdAt', 'desc')
    .where(query)

  if (skip) {
    queryListCommand = queryListCommand.skip(skip)
  }

  if (limit) {
    queryListCommand = queryListCommand.limit(limit)
  }

  const queryListRes = await queryListCommand.get()

  return {
    list: queryListRes.data,
  }
}