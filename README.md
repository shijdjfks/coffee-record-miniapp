# Brewlog - 个人咖啡记录小程序

☕ 一个美观简约的咖啡手帐小程序，帮你记录每一杯咖啡的美好时光。

## 功能特性

### 年视图
- 12个月份网格布局
- 每月显示咖啡杯数和店铺数
- 点击月份进入月视图
- 年份切换功能

### 月视图
- 完整日历展示
- 有记录的日子显示咖啡杯图标
- 点击日期查看当天详细记录
- **趣味功能**: 拍照即生成小图标
- 快速添加记录

### 周视图 (独立Tab)
- 以周为维度的展示
- 每天的咖啡记录清晰可见
- 快速添加本周记录
- 上周/下周导航

## 视觉设计

- 咖色手帐本风格
- 不同深浅的棕色/咖色配色
- 圆润舒适的UI元素
- 简洁干净的排版 "This Month X brews / This Week X brews"

## 技术栈

- 微信小程序
- 小程序云开发 (Cloud Base)
- WXML / WXSS / JavaScript

## 快速开始

### 1. 创建云开发环境

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入小程序管理后台
3. 开通云开发能力
4. 记录云开发环境 ID

### 2. 配置项目

1. 打开 `app.js`，修改 `env` 为你的云开发环境 ID:
```javascript
wx.cloud.init({
  env: '你的环境ID',
  traceUser: true,
});
```

2. 打开 `project.config.json`，修改 `appid` 为你的小程序 AppID

### 3. 部署云函数

1. 在微信开发者工具中，右键点击 `cloudfunctions/initDb` 文件夹
2. 选择 "上传并部署: 云端安装依赖"
3. 重复步骤 1-2，部署其他云函数（如果需要）

### 4. 初始化数据库

1. 在小程序首页自动调用初始化
2. 或者在开发者工具中运行云函数 `initDb`

### 5. 添加Tab Bar图标 (可选)

在 `images/` 目录下添加以下图标:
- `icon-year.png` - 年视图未选中
- `icon-year-active.png` - 年视图选中
- `icon-week.png` - 周视图未选中
- `icon-week-active.png` - 周视图选中

图标尺寸建议: 81x81 像素

然后在 `app.json` 中取消注释 iconPath 相关配置。

## 数据结构

### coffee_logs 集合

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| date | string | 日期 YYYY-MM-DD |
| shop | string | 咖啡店名称 |
| cups | number | 杯数 |
| size | string | 杯型 (小杯/中杯/大杯/超大杯) |
| icon | string | 咖啡图标 |
| notes | string | 备注 |
| photo | string | 照片云存储路径 |
| createdAt | date | 创建时间 |

## 页面结构

```
pages/
├── index/          # 年视图
├── month/          # 月视图
├── week/           # 周视图
├── detail/         # 记录详情
└── add/            # 添加/编辑记录
```

## 注意事项

1. 首次使用需要授予相机和相册权限
2. 照片会自动上传到云存储
3. 数据保存在云数据库中，自动同步

## 后续迭代建议

- [ ] 添加数据导出功能
- [ ] 咖啡店收藏夹
- [ ] 统计数据可视化
- [ ] 分享到社交媒体
- [ ] 主题皮肤切换
