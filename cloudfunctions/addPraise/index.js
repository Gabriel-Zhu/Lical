// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const getListRes = await cloud.callFunction({
    name: 'getPraiseList',
    data: {
      query: {
        from: event.body.licalId,
        to: event.body.to,
      },
      options: {
        skip: 0,
        limit: 1,
      },
    },
  })

  const existPraise = getListRes
    && getListRes.result
    && getListRes.result.list
    && getListRes.result.list[0]
    || {}

  if (existPraise._id) {
    if (event.body.status) {
      return {
        message: '该项目已点赞',
        status: event.body.status,
      }
    }

    const removeItemRes = await db.collection('activity_praises').doc(existPraise._id).remove()

    if (removeItemRes && removeItemRes.stats && removeItemRes.stats.removed) {
      await db.collection('activities').doc(event.body.to).update({
        data: {
          praisesCount: _.inc(-1),
        },
      })

      return {
        message: '取消点赞成功',
        status: 0,
      }
    }

    return {
      message: '取消点赞成功（移除点赞记录失败）',
      status: 0,
    }
  } else if (event.body.status) {
    const addItemRes = await db.collection('activity_praises').add({
      data: {
        ...event.body,
        createdAt: new Date().getTime(),
        isRead: false,
      },
    })

    if (addItemRes && addItemRes._id) {
      await db.collection('activities').doc(event.body.to).update({
        data: {
          praisesCount: _.inc(1),
        },
      })

      return {
        message: '点赞成功',
        status: event.body.status,
      }
    }

    return {
      message: '点赞成功（添加点赞记录失败）',
      status: event.body.status,
    }
  }

  return {
    message: '该条目已取消点赞',
    status: 0,
  }
}