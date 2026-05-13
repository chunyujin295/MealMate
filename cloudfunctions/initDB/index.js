const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const collections = [
    { name: 'users', desc: '用户信息表' },
    { name: 'food_records', desc: '饮食记录表' },
    { name: 'groups', desc: '群组信息表' },
    { name: 'group_members', desc: '群成员关系表' },
    { name: 'group_interact', desc: '群组互动表' }
  ];

  const results = [];

  for (const col of collections) {
    try {
      await db.createCollection(col.name);
      results.push({ name: col.name, status: 'created' });
    } catch (e) {
      if (e.errCode === -502005) {
        results.push({ name: col.name, status: 'already_exists' });
      } else {
        results.push({ name: col.name, status: 'error', message: e.message });
      }
    }
  }

  return { success: true, results };
};
