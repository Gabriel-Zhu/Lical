// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const {
    query = {},
    options: {
      requireUnreadCount,
      skip = 0,
      limit,
      deadline = new Date().getTime(),
    },
  } = event

  if (Array.isArray(query.to)) {
    query.to = _.in(query.to)
  }

  if (query.toLicalId) {
    query.toLicalId = query.toLicalId
    query.from = _.neq(query.toLicalId)
  }

  if (deadline) {
    query.createdAt = _.lt(deadline)
  }

  const result = {}
  let getListRes = null
  let queryListCommand = db.collection('activity_praises')
    .orderBy('createdAt', 'desc')

  const unreadCountRes = await queryListCommand.where({
    ...query,
    isRead: false,
  }).count()

  result.unreadPraisesCount = unreadCountRes.total

  return result
}