const { getToday, formatDate, showToast, showLoading, hideLoading, chooseAndCompressImage, uploadToCloud } = require('../../utils/util');
const { createRecord, updateRecord, deleteRecord, fetchRecordById, recognizeFood } = require('../../utils/cloud');
const { NUTRITION_FIELDS, MAX_IMAGES } = require('../../utils/constants');

Page({
  data: {
    isEditing: false,
    recordId: null,
    mealType: 'breakfast',
    recordDate: getToday(),
    content: '',
    images: [],
    imageFileIDs: [],
    nutrition: { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sodium: 0 },
    nutritionFields: NUTRITION_FIELDS,
    nutritionModified: false,
    visibility: 'private',
    aiResults: [],
    aiRecognized: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEditing: true, recordId: options.id });
      this.loadRecord(options.id);
    }
    if (options.mealType) this.setData({ mealType: options.mealType });
    if (options.date) this.setData({ recordDate: options.date });
  },

  async loadRecord(id) {
    try {
      const { record } = await fetchRecordById(id);
      this.setData({
        mealType: record.mealType,
        recordDate: record.date,
        content: record.content || '',
        images: record.images || [],
        imageFileIDs: record.imageFileIDs || [],
        nutrition: record.nutrition || this.data.nutrition,
        visibility: record.visibility || 'private'
      });
    } catch (err) {
      showToast('加载记录失败');
    }
  },

  onMealChange(e) {
    this.setData({ mealType: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ recordDate: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  async addImage() {
    const count = MAX_IMAGES - this.data.images.length;
    if (count <= 0) return;

    try {
      const paths = await chooseAndCompressImage(count);
      showLoading('上传中...');
      const uploadPromises = paths.map((path, i) => {
        const cloudPath = `food-images/${Date.now()}_${i}.jpg`;
        return uploadToCloud(path, cloudPath);
      });
      const fileIDs = await Promise.all(uploadPromises);

      this.setData({
        images: [...this.data.images, ...paths],
        imageFileIDs: [...this.data.imageFileIDs, ...fileIDs],
        aiRecognized: false,
        aiResults: []
      });
      hideLoading();
    } catch (err) {
      hideLoading();
      if (err.errMsg && !err.errMsg.includes('cancel')) {
        showToast('图片上传失败');
      }
    }
  },

  removeImage(e) {
    const { index } = e.currentTarget.dataset;
    const images = [...this.data.images];
    const imageFileIDs = [...this.data.imageFileIDs];
    images.splice(index, 1);
    imageFileIDs.splice(index, 1);
    this.setData({ images, imageFileIDs, aiRecognized: false, aiResults: [] });
  },

  async startAIRecognition() {
    if (this.data.imageFileIDs.length === 0) {
      showToast('请先上传图片');
      return;
    }

    showLoading('AI识别中...');
    try {
      const allResults = [];
      for (const fileID of this.data.imageFileIDs) {
        const { results } = await recognizeFood(fileID);
        allResults.push(...results);
      }
      this.setData({ aiResults: allResults, aiRecognized: true });
      hideLoading();

      if (allResults.length === 0) {
        showToast('未能识别出食物，请手动填写');
      } else {
        // 自动应用第一个识别结果
        this.applyAIResult({ currentTarget: { dataset: { index: 0 } } });
        showToast('识别完成');
      }
    } catch (err) {
      hideLoading();
      showToast('AI识别失败，请重试');
    }
  },

  applyAIResult(e) {
    const { index } = e.currentTarget.dataset;
    const result = this.data.aiResults[index];
    if (!result || !result.nutrition) return;

    this.setData({
      nutrition: { ...result.nutrition },
      content: this.data.content || result.name,
      nutritionModified: false
    });
  },

  clearAIResults() {
    this.setData({ aiResults: [], aiRecognized: false });
  },

  onNutritionInput(e) {
    const { key } = e.currentTarget.dataset;
    const value = parseFloat(e.detail.value) || 0;
    this.setData({
      nutrition: { ...this.data.nutrition, [key]: value },
      nutritionModified: true
    });
  },

  setVisibility(e) {
    this.setData({ visibility: e.currentTarget.dataset.value });
  },

  async handleSave() {
    const { recordDate, mealType, content, imageFileIDs, nutrition, visibility } = this.data;

    const data = {
      date: recordDate,
      mealType,
      content: content.trim(),
      images: imageFileIDs,
      nutrition,
      visibility
    };

    showLoading('保存中...');
    try {
      if (this.data.isEditing) {
        await updateRecord(this.data.recordId, data);
      } else {
        await createRecord(data);
      }
      hideLoading();
      showToast('保存成功', 'success');
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      hideLoading();
      showToast('保存失败，请重试');
    }
  },

  handleDelete() {
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条饮食记录吗？',
      confirmColor: '#f44336',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteRecord(this.data.recordId);
            showToast('已删除', 'success');
            setTimeout(() => wx.navigateBack(), 1500);
          } catch (err) {
            showToast('删除失败');
          }
        }
      }
    });
  }
});
