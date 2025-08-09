# 小说阅读器 - AI缩写中国网络小说

一个基于 React Native (Expo) + Supabase 的移动阅读应用，专门用于阅读AI缩写的中国网络小说。

## 功能特性

- 📚 **书架管理** - 个人书架，跟踪阅读进度
- 🌟 **智能推荐** - 发现新的优质小说
- 📖 **分类浏览** - 按类型浏览小说（玄幻、仙侠、都市等）
- 💰 **付费阅读** - 前25%免费，后续章节需付费解锁
- 🔐 **用户认证** - 安全的登录注册系统
- 📱 **移动优化** - 专为移动设备优化的阅读体验

## 技术栈

- **前端**: React Native + Expo
- **后端**: Supabase (PostgreSQL + Auth + API)
- **导航**: React Navigation 6
- **状态管理**: React Hooks
- **UI组件**: React Native内置组件 + Expo Vector Icons

## 项目结构

```
chop_fiction/
├── components/
│   └── navigation/
│       └── MainTabs.tsx          # 底部导航
├── screens/
│   ├── AuthScreen.tsx            # 登录注册页面
│   ├── BookshelfScreen.tsx       # 书架页面
│   ├── RecommendationsScreen.tsx # 推荐页面
│   ├── CategoriesScreen.tsx      # 分类页面
│   ├── ProfileScreen.tsx         # 个人中心
│   ├── NovelDetailScreen.tsx     # 小说详情页
│   └── ReaderScreen.tsx          # 阅读器页面
├── lib/
│   └── supabase.ts               # Supabase客户端配置
├── types/
│   └── index.ts                  # TypeScript类型定义
├── supabase-setup.sql            # 数据库初始化脚本
└── App.tsx                       # 主应用入口
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在 Supabase SQL Editor 中运行 `supabase-setup.sql` 脚本
3. 在 Supabase 项目设置中找到你的 URL 和 anon key
4. 更新 `lib/supabase.ts` 中的配置：

```typescript
const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseAnonKey = 'your-anon-key-here'
```

**注意**: 在配置 Supabase 之前，应用会显示"未登录"状态，这是正常的。

### 3. 启用完整应用

当你配置好 Supabase 后，将 `App.full.tsx` 重命名为 `App.tsx` 来启用完整功能：

```bash
mv App.tsx App.simple.tsx
mv App.full.tsx App.tsx
```

### 4. 运行应用

```bash
# 启动开发服务器
npm start

# 或者直接指定平台
npm run ios     # iOS 模拟器
npm run android # Android 模拟器
npm run web     # 浏览器（可能需要额外配置）
```

## 数据库结构

### 主要表格

- **profiles** - 用户资料
- **novels** - 小说信息
- **chapters** - 章节内容
- **user_purchases** - 用户购买记录
- **user_bookshelf** - 用户书架

### 安全策略

- 启用行级安全策略 (RLS)
- 用户只能访问自己的私人数据
- 所有人都可以查看小说和章节内容
- 自动处理用户注册和资料创建

## 核心功能实现

### 免费阅读限制

- 每本小说前25%章节免费
- 超出免费章节需要购买
- 购买后解锁全部章节

### 阅读进度跟踪

- 自动保存最后阅读章节
- 书架显示阅读进度
- 支持从上次位置继续阅读

### 付费系统

- 简化的一次性购买模式
- 购买后永久拥有
- 支持购买状态检查

## 开发计划

- [ ] 支付集成（支付宝/微信支付）
- [ ] 离线阅读功能
- [ ] 夜间模式
- [ ] 字体大小调节
- [ ] 书签功能
- [ ] 评论系统
- [ ] AI缩写质量评分

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License 
