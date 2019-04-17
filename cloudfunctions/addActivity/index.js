const getLastActivity = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const queryListRes = await db.collection('activities')
    .where({
      _openid: wxContext.OPENID,
      ...(event.query || {}),
    })
    .orderBy('created_at', 'desc')
    .skip(0)
    .limit(1)
    .get()

  return queryListRes.data && queryListRes.data[0] || {}
}

const updateActivity = async (event, context) => {
  const body = {}

  Object.keys(event.body).forEach(key => {
    body[key] = _.set(event.body[key])
  })

  return await db.collection('activities')
    .doc(event.query._id)
    .update({
      data: body,
    })
}

const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const { command: _  } = db

const isAfternoon = timestamp => {
  const hours = new Date(timestamp + 28800000).getHours()
  return hours >= 12 && hours <= 23
}

const SINGLE_MINUTE = 60 * 1000
const SINGLE_HOUR = 60 * SINGLE_MINUTE

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const activity = {
    _openid: wxContext.OPENID,
    ...event.body,
  }

  const { _openid, type, action, created_at } = activity

  const lastActivity = await getLastActivity({
    query: {
      type,
      _openid,
    },
  }, context)

  if (
    type === lastActivity.type
      && action === 'end'
      && lastActivity.action === 'start'
  ) {
    const duration = created_at - lastActivity.created_at

    activity.related_activity_id = lastActivity._id
    activity.duration = duration

    if (type === 'sleep') {      
      activity.is_afternoon = isAfternoon(lastActivity.created_at)
        && isAfternoon(created_at)

      activity.is_invalid = duration > 12 * SINGLE_HOUR
        || duration < 10 * SINGLE_MINUTE
    }

    if (type === 'exercise') {
      activity.is_invalid = duration > 3 * SINGLE_HOUR
        || duration < 10 * SINGLE_MINUTE
    }
  }

  const addItemRes = await db.collection('activities').add({
    data: activity,
  })

  if (
    type === lastActivity.type
      && action === 'end'
      && lastActivity.action === 'start'
  ) {
    await updateActivity({
      query: {
        _id: lastActivity._id,
      },
      body: {
        related_activity_id: addItemRes._id,
        is_completed: true,
      },
    }, context)
  }

  return {
    ...activity,
    _id: addItemRes._id,
  }
}