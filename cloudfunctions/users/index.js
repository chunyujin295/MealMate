const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'update': {
      const { data } = event;
      delete data._id;
      delete data._openid;
      data.updatedAt = Date.now();

      const { data: users } = await db.collection('users')
        .where({ _openid: OPENID })
        .get();

      if (users.length === 0) {
        return { errCode: 1, errMsg: '用户不存在' };
      }

      await db.collection('users').doc(users[0]._id).update({ data });
      return { success: true };
    }

    default:
      return { errCode: 2, errMsg: `未知操作: ${action}` };
  }
};
