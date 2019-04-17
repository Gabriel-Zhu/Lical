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

  if (requireUnreadCount) {
    const unreadCountRes = await queryListCommand.where({
      ...query,
      isRead: false,
    }).count()

    result.unreadCount = unreadCountRes.total

    return result
  }

  queryListCommand = queryListCommand.where(query)

  if (skip) {
    queryListCommand = queryListCommand.skip(skip)
  } 
  
  if (limit) {
    queryListCommand = queryListCommand.limit(limit)
  }
  
  getListRes = await queryListCommand.get()
  const { data: list = [] } = getListRes

  const licalIds = Array.from(new Set(list.map(item => item.from)))
  const userListRes = await db.collection('users').where({
    lical_id: _.in(licalIds),
  }).get()

  const { data: users = [] } = userListRes
  const userMap = users.reduce((result, user) => ({
    ...result,
    [user.lical_id]: user,
  }), {})

  return {
    ...result,
    list: list.map(item => ({
      ...item,
      fromUser: userMap[item.from], 
    })),
  }
}