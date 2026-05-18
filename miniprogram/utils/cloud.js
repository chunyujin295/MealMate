const db = wx.cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

function getCollection(name) {
  return db.collection(name);
}

async function callFunction(name, data = {}) {
  try {
    const { result } = await wx.cloud.callFunction({ name, data });
    if (result && result.errCode) {
      throw new Error(result.errMsg || '云函数调用失败');
    }
    return result;
  } catch (err) {
    console.error(`云函数 ${name} 调用失败:`, err);
    throw err;
  }
}

// 用户相关
async function fetchUser() {
  return callFunction('login');
}

async function updateUser(data) {
  return callFunction('users', { action: 'update', data });
}

// 记录相关
async function fetchRecords(params = {}) {
  return callFunction('records', { action: 'list', ...params });
}

async function fetchRecordById(id) {
  return callFunction('records', { action: 'get', id });
}

async function createRecord(data) {
  return callFunction('records', { action: 'create', data });
}

async function updateRecord(id, data) {
  return callFunction('records', { action: 'update', id, data });
}

async function deleteRecord(id) {
  return callFunction('records', { action: 'delete', id });
}

async function fetchNutritionStats(params = {}) {
  return callFunction('records', { action: 'stats', ...params });
}

// AI 识别
async function recognizeFood(imageUrl) {
  return callFunction('aiRecognition', { action: 'recognize', imageUrl });
}

// 群组相关
async function fetchMyGroups() {
  return callFunction('groups', { action: 'myGroups' });
}

async function fetchGroupDetail(groupId) {
  return callFunction('groups', { action: 'getDetail', groupId });
}

async function createGroup(data) {
  return callFunction('groups', { action: 'create', ...data });
}

async function joinGroup(groupId) {
  return callFunction('groups', { action: 'join', groupId });
}

async function leaveGroup(groupId) {
  return callFunction('groups', { action: 'leave', groupId });
}

async function removeMember(groupId, memberId) {
  return callFunction('groups', { action: 'removeMember', groupId, memberId });
}

async function fetchGroupFeed(groupId, params = {}) {
  return callFunction('groups', { action: 'feed', groupId, ...params });
}

module.exports = {
  db,
  _,
  $,
  getCollection,
  callFunction,
  fetchUser,
  updateUser,
  fetchRecords,
  fetchRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  fetchNutritionStats,
  recognizeFood,
  fetchMyGroups,
  fetchGroupDetail,
  createGroup,
  joinGroup,
  leaveGroup,
  removeMember,
  fetchGroupFeed
};
