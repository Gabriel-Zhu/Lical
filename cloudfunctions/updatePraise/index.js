const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const {
    options: {
      deadline = new Date().getTime(),
    },
    query,
  } = event

  if (deadline) {
    query.createdAt = _.lt(deadline)
  }

  return await db.collection('activity_praises').where(query).update({
    data: {
      isRead: true,
    },
  })
}