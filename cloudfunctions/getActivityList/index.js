const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const {
    options: {
      completedActivityOnly = false,
      deadline,
      skip = 0,
      limit = 10,
    } = {},
    query = {},
  } = event

  if (deadline) {
    query.created_at = _.lt(deadline)
  }

  let finalQuery = null

  if (completedActivityOnly) {
    finalQuery = _.or([
      {
        action: _.neq('start'),
        ...query,
      },
      {
        action: _.eq('start'),
        is_completed: _.in([false, undefined]),
        ...query,
      },
    ])
  } else {
    finalQuery = query
  }

  const queryListRes = await db.collection('activities')
    .where(finalQuery)
    .orderBy('created_at', 'desc')
    .skip(skip)
    .limit(limit)
    .get()

  const { data: list } = queryListRes
  const relatedActivityIds = []

  list.forEach((item, index) => {
    const { related_activity_id } = item
    if (related_activity_id) {
      relatedActivityIds.push(related_activity_id)
    }
  })

  const relatedActivitiesRes = await db.collection('activities')
    .where({ _id: _.in(relatedActivityIds) })
    .get()

  const { data: relatedActivities } = relatedActivitiesRes

  const lical_ids = list.map(activity => activity.lical_id)
  const userListRes = await cloud.callFunction({
    name: 'getUserList',
    data: {
      lical_ids,
    },
  })

  const { result: { list: users } } = userListRes
  const userMap = users.reduce((result, user) => ({
    ...result,
    [user.lical_id]: user,
  }), {})

  return {
    list: list.map((item, index) => {
      const finalItem = {
        ...item,
        user: userMap[item.lical_id],
      }

      const relatedActivityIndex = relatedActivities.findIndex(
        a => a._id === item.related_activity_id
      )
      if (relatedActivityIndex >= 0) {
        finalItem.related_activity = relatedActivities[relatedActivityIndex]
      }

      return finalItem
    }),
  }
}