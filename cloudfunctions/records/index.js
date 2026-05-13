const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    // 创建记录
    case 'create': {
      const { data } = event;
      const record = {
        ...data,
        _openid: OPENID,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: false
      };
      const { _id } = await db.collection('food_records').add({ data: record });
      return { record: { ...record, _id } };
    }

    // 更新记录
    case 'update': {
      const { id, data } = event;
      const { data: records } = await db.collection('food_records')
        .where({ _id: id, _openid: OPENID })
        .get();

      if (records.length === 0) {
        return { errCode: 1, errMsg: '记录不存在或无权修改' };
      }

      data.updatedAt = Date.now();
      await db.collection('food_records').doc(id).update({ data });
      return { success: true };
    }

    // 删除记录（软删除）
    case 'delete': {
      const { id } = event;
      const { data: records } = await db.collection('food_records')
        .where({ _id: id, _openid: OPENID })
        .get();

      if (records.length === 0) {
        return { errCode: 1, errMsg: '记录不存在或无权删除' };
      }

      await db.collection('food_records').doc(id).update({
        data: { isDeleted: true, updatedAt: Date.now() }
      });
      return { success: true };
    }

    // 获取单条记录
    case 'get': {
      const { id } = event;
      const { data: records } = await db.collection('food_records')
        .where({ _id: id, isDeleted: false })
        .get();

      if (records.length === 0) {
        return { errCode: 2, errMsg: '记录不存在' };
      }
      return { record: records[0] };
    }

    // 查询记录列表
    case 'list': {
      const { date, mealType, page = 1, pageSize = 20 } = event;
      const conditions = { _openid: OPENID, isDeleted: false };

      if (date) conditions.date = date;
      if (mealType) conditions.mealType = mealType;

      const { data: records } = await db.collection('food_records')
        .where(conditions)
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const { total } = await db.collection('food_records')
        .where(conditions)
        .count();

      return { records, total, page, pageSize };
    }

    // 营养统计
    case 'stats': {
      const { startDate, endDate } = event;
      const conditions = {
        _openid: OPENID,
        isDeleted: false
      };

      if (startDate && endDate) {
        conditions.date = _.gte(startDate).and(_.lte(endDate));
      }

      const { data: records } = await db.collection('food_records')
        .where(conditions)
        .get();

      const summary = {
        totalCalories: 0,
        totalCarbs: 0,
        totalProtein: 0,
        totalFat: 0,
        totalFiber: 0,
        totalSodium: 0,
        count: records.length
      };

      records.forEach(r => {
        if (r.nutrition) {
          summary.totalCalories += r.nutrition.calories || 0;
          summary.totalCarbs += r.nutrition.carbs || 0;
          summary.totalProtein += r.nutrition.protein || 0;
          summary.totalFat += r.nutrition.fat || 0;
          summary.totalFiber += r.nutrition.fiber || 0;
          summary.totalSodium += r.nutrition.sodium || 0;
        }
      });

      const dailyData = {};
      records.forEach(r => {
        if (!dailyData[r.date]) {
          dailyData[r.date] = { date: r.date, calories: 0, count: 0 };
        }
        if (r.nutrition) {
          dailyData[r.date].calories += r.nutrition.calories || 0;
        }
        dailyData[r.date].count += 1;
      });

      return {
        summary,
        dailyData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
      };
    }

    default:
      return { errCode: 3, errMsg: `未知操作: ${action}` };
  }
};
