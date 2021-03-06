const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

const getPureActivity = async (event, context) => {
  const queryListRes = await db.collection('activities')
    .where(event.query)
    .skip(0)
    .limit(1)
    .get()

  const activity = queryListRes && queryListRes.data && queryListRes.data[0] || {}

  return activity
}

const getActivity = async (event, context) => {
  const {
    options: {
      licalId,
    } = {},
  } = event

  const activity = await getPureActivity(event, context)

  if (licalId && activity._id) {
    const praiseListRes = await db.collection('activity_praises').where({
      from: licalId,
      to: activity._id,
      status: 1,
    })
      .skip(0)
      .limit(1)
      .get()

    const praise = praiseListRes
      && praiseListRes.data
      && praiseListRes.data[0]
      || {}
    activity.isPraised = Boolean(praise.status)
  }

  if (activity.action === 'end' && activity.related_activity_id) {
    activity.related_activity = await getPureActivity({
      options: { licalId },
      query: { _id: activity.related_activity_id },
    }, context)
  }



  if (activity.lical_id) {
    const userListRes = await db.collection('users').where({
      lical_id: activity.lical_id,
    })
      .skip(0)
      .limit(1)
      .get()

    activity.user = userListRes
      && userListRes.data
      && userListRes.data[0]
      || null
  }


  return activity
}


exports.main = getActivity