const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();

  const { data: users } = await db.collection('users')
    .where({ _openid: OPENID })
    .get();

  if (users.length > 0) {
    const user = users[0];
    if (!user.updatedAt || Date.now() - user.updatedAt > 24 * 60 * 60 * 1000) {
      await db.collection('users').doc(user._id).update({
        data: { updatedAt: Date.now() }
      });
    }
    return { userInfo: user };
  }

  const newUser = {
    _openid: OPENID,
    nickName: '',
    avatarUrl: '',
    privacy: 'private',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const { _id } = await db.collection('users').add({ data: newUser });
  newUser._id = _id;

  return { userInfo: newUser };
};
