const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    // 创建群组
    case 'create': {
      const { name, description, isPrivate = true } = event;
      if (!name || !name.trim()) {
        return { errCode: 1, errMsg: '群组名称不能为空' };
      }

      const group = {
        name: name.trim(),
        description: description || '',
        ownerId: OPENID,
        isPrivate,
        memberCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const { _id } = await db.collection('groups').add({ data: group });

      // 创建人自动加入群成员
      await db.collection('group_members').add({
        data: {
          groupId: _id,
          _openid: OPENID,
          isAdmin: true,
          joinedAt: Date.now()
        }
      });

      return { group: { ...group, _id } };
    }

    // 我的群组列表
    case 'myGroups': {
      const { data: memberships } = await db.collection('group_members')
        .where({ _openid: OPENID })
        .get();

      if (memberships.length === 0) return { groups: [] };

      const groupIds = memberships.map(m => m.groupId);
      const { data: groups } = await db.collection('groups')
        .where({ _id: _.in(groupIds) })
        .get();

      return { groups };
    }

    // 获取群组详情
    case 'getDetail': {
      const { groupId } = event;
      const { data: groups } = await db.collection('groups')
        .where({ _id: groupId })
        .get();

      if (groups.length === 0) {
        return { errCode: 2, errMsg: '群组不存在' };
      }

      // 验证用户是否在该群组中
      const { data: memberships } = await db.collection('group_members')
        .where({ groupId, _openid: OPENID })
        .get();

      if (memberships.length === 0) {
        return { errCode: 3, errMsg: '你不是该群组成员' };
      }

      // 获取成员列表
      const { data: members } = await db.collection('group_members')
        .where({ groupId })
        .get();

      return {
        group: groups[0],
        members,
        isAdmin: memberships[0].isAdmin
      };
    }

    // 加入群组
    case 'join': {
      const { groupId } = event;
      if (!groupId) {
        return { errCode: 1, errMsg: '群组ID不能为空' };
      }

      const { data: groups } = await db.collection('groups')
        .where({ _id: groupId })
        .get();

      if (groups.length === 0) {
        return { errCode: 2, errMsg: '群组不存在' };
      }

      // 检查是否已在群组中
      const { data: existing } = await db.collection('group_members')
        .where({ groupId, _openid: OPENID })
        .get();

      if (existing.length > 0) {
        return { success: true, alreadyJoined: true };
      }

      await db.collection('group_members').add({
        data: {
          groupId,
          _openid: OPENID,
          isAdmin: false,
          joinedAt: Date.now()
        }
      });

      await db.collection('groups').doc(groupId).update({
        data: { memberCount: _.inc(1), updatedAt: Date.now() }
      });

      return { success: true };
    }

    // 退出群组
    case 'leave': {
      const { groupId } = event;

      const { data: memberships } = await db.collection('group_members')
        .where({ groupId, _openid: OPENID })
        .get();

      if (memberships.length === 0) {
        return { errCode: 3, errMsg: '你不是该群组成员' };
      }

      await db.collection('group_members').doc(memberships[0]._id).remove();
      await db.collection('groups').doc(groupId).update({
        data: { memberCount: _.inc(-1), updatedAt: Date.now() }
      });

      return { success: true };
    }

    // 移除成员（仅群主）
    case 'removeMember': {
      const { groupId, memberId } = event;

      // 验证是否为群主
      const { data: adminCheck } = await db.collection('group_members')
        .where({ groupId, _openid: OPENID, isAdmin: true })
        .get();

      if (adminCheck.length === 0) {
        return { errCode: 4, errMsg: '仅群主可移除成员' };
      }

      const { data: targetMembers } = await db.collection('group_members')
        .where({ groupId, _openid: memberId })
        .get();

      if (targetMembers.length === 0) {
        return { errCode: 5, errMsg: '目标成员不在该群组中' };
      }

      await db.collection('group_members').doc(targetMembers[0]._id).remove();
      await db.collection('groups').doc(groupId).update({
        data: { memberCount: _.inc(-1), updatedAt: Date.now() }
      });

      return { success: true };
    }

    // 群组动态流
    case 'feed': {
      const { groupId, page = 1, pageSize = 20 } = event;

      // 验证用户是否在该群组中
      const { data: memberships } = await db.collection('group_members')
        .where({ groupId, _openid: OPENID })
        .get();

      if (memberships.length === 0) {
        return { errCode: 3, errMsg: '你不是该群组成员' };
      }

      const { data: members } = await db.collection('group_members')
        .where({ groupId })
        .get();

      const memberOpenIds = members.map(m => m._openid);

      // 查询群组成员的公开记录（visibility 为 public 或包含该 groupId）
      const { data: records } = await db.collection('food_records')
        .where({
          _openid: _.in(memberOpenIds),
          isDeleted: false,
          visibility: _.neq('private')
        })
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      return { records };
    }

    default:
      return { errCode: 5, errMsg: `未知操作: ${action}` };
  }
};
