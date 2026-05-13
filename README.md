# MealMate · 吃了么

微信小程序饮食记录助手，支持 AI 拍照识食、营养统计和群组分享。

## 功能

- **饮食记录** — 按早餐/午餐/晚餐/加餐记录每餐饮食，支持图片和文字备注
- **AI 拍照识食** — 调用百度 AI 图像识别，拍照自动识别食物并估算营养成分
- **营养统计** — 按日/周/月统计热量、碳水、蛋白质、脂肪等摄入量
- **群组功能** — 创建或加入群组，与家人朋友共享饮食记录
- **隐私控制** — 每条记录可设为公开或私密

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生框架 |
| 后端 | 微信云开发（云函数 + 云数据库 + 云存储） |
| AI | 百度 AI 菜品识别 API |
| 基础库 | ≥ 3.6.0 |

## 项目结构

```
├── cloudfunctions/        # 云函数
│   ├── login/             # 自动登录
│   ├── users/             # 用户管理
│   ├── records/           # 饮食记录 CRUD + 统计
│   ├── groups/            # 群组管理
│   ├── aiRecognition/     # 百度 AI 菜品识别
│   └── initDB/            # 数据库初始化
├── miniprogram/           # 小程序前端
│   ├── app.js             # 入口（云环境初始化）
│   ├── components/        # 公共组件
│   ├── pages/             # 页面
│   │   ├── index/         # 首页（按日查看/添加记录）
│   │   ├── record/        # 新增/编辑记录
│   │   ├── detail/        # 记录详情
│   │   ├── history/       # 历史记录
│   │   ├── nutrition/     # 营养统计
│   │   ├── profile/       # 个人中心
│   │   ├── groups/        # 群组列表
│   │   ├── group-create/  # 创建群组
│   │   └── group-detail/  # 群组详情
│   └── utils/             # 工具函数 & 云调用封装
├── project.config.json    # 小程序项目配置
└── .gitignore
```

## 快速开始

### 1. 环境准备

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 微信小程序 AppID（在 [mp.weixin.qq.com](https://mp.weixin.qq.com) 注册）

### 2. 云开发配置

1. 在微信开发者工具中打开项目，填入 AppID
2. 点击「云开发」按钮开通云环境，记录环境 ID
3. 将 `miniprogram/app.js` 中的 `env` 替换为你的环境 ID：
   ```js
   wx.cloud.init({
     env: 'your-env-id',
     traceUser: true
   });
   ```

### 3. 部署云函数

1. 右键 `cloudfunctions` 目录 →「当前环境」→ 选择你的云环境
2. 右键每个云函数目录 →「上传并部署：云端安装依赖」
3. 在云开发控制台 → 云函数 → 找到 `initDB` → 点击「测试」初始化数据库集合

### 4. AI 识别（可选）

如需使用 AI 拍照识食功能，需配置百度 AI API 密钥：

1. 前往 [百度智能云](https://console.bce.baidu.com) 开通「菜品识别」服务
2. 在云开发控制台 → 云函数 → `aiRecognition` → 编辑环境变量：
   - `BAIDU_API_KEY`
   - `BAIDU_SECRET_KEY`

## 数据库集合

| 集合名 | 说明 |
|--------|------|
| `users` | 用户信息 |
| `food_records` | 饮食记录 |
| `groups` | 群组信息 |
| `group_members` | 群成员关系 |
| `group_interact` | 群组互动 |
