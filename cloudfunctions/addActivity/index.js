// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

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
  const { result: lastActivity } = await cloud.callFunction({
    name: 'getLastActivity',
    data: {
      query: {
        _openid,
      }, 
    },
  })

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
    await cloud.callFunction({
      name: 'updateActivity',
      data: {
        query: {
          _id: lastActivity._id,
        },
        body: {
          related_activity_id: addItemRes._id,
          is_completed: true,
        },
      },
    })
  }

  return {
    ...activity,
    _id: addItemRes._id,
  }
}