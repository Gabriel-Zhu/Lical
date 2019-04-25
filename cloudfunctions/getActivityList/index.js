const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const {
    options: {
      completedActivityOnly = true,
      deadline = new Date().getTime(),
      skip = 0,
      limit,
      licalId,
    } = {},
    query = {},
  } = event

  if (deadline) {
    query.created_at = _.lt(deadline)
  }

  let finalQuery = {
    ...query,
    is_invalid: _.neq(true),
  }

  if (completedActivityOnly) {
    finalQuery = _.or([
      {
        ...finalQuery,
        action: _.neq('start'),
      },
      {
        ...finalQuery,
        action: _.eq('start'),
        is_completed: _.in([false, undefined]),
      },
    ])
  }

  let queryListCommand = db.collection('activities')
    .where(finalQuery)
    .orderBy('created_at', 'desc')

  if (skip) {
    queryListCommand = queryListCommand.skip(skip)
  }

  if (limit) {
    queryListCommand = queryListCommand.limit(limit)
  }

  const queryListRes = await queryListCommand.get()

  const { data: activityList = [] } = queryListRes
  const activityIds = []
  const relatedActivityIds = []

  activityList.forEach((item, index) => {
    const { _id, related_activity_id, action } = item

    activityIds.push(_id)

    if (action === 'end' && related_activity_id) {
      relatedActivityIds.push(related_activity_id)
    }
  })

  let praiseMap = {}
  if (licalId) {
    const praiseListRes = await db.collection('activity_praises').where({
      from: licalId,
      to: _.in(activityIds),
      status: 1,
      createdAt: _.lt(deadline),
    }).get()

    const { data: praiseList = [] } = praiseListRes
    praiseMap = praiseList.reduce((result, praise) => ({
      ...result,
      [praise.to]: praise.status ? true : false,
    }), {})
  }

  let relatedActivityMap = {}
  if (relatedActivityIds && relatedActivityIds.length) {
    const relatedActivitiesRes = await db.collection('activities')
      .where({ _id: _.in(relatedActivityIds) })
      .get()

    const { data: relatedActivities = [] } = relatedActivitiesRes
    relatedActivityMap = relatedActivities.reduce((result, relatedActivity) => ({
      ...result,
      [relatedActivity.related_activity_id]: relatedActivity,
    }), {})
  }

  const licalIds = Array.from(new Set(activityList.map(activity => activity.lical_id)))
  const userListRes = await db.collection('users').where({
    lical_id: _.in(licalIds),
  }).get()

  const { data: users = [] } = userListRes
  const userMap = users.reduce((result, user) => ({
    ...result,
    [user.lical_id]: user,
  }), {})

  return {
    list: activityList.map((item, index) => ({
      ...item,
      related_activity: relatedActivityMap[item._id],
      isPraised: praiseMap[item._id] || false,
      user: userMap[item.lical_id],
    })),
  }
}