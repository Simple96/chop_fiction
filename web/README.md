# 小说阅读器 - 网页版

AI缩写中国网络小说的网页阅读应用。

## 功能特性

- 📚 **书架管理** - 个人书架，跟踪阅读进度
- 🌟 **智能推荐** - 发现新的优质小说
- 📖 **分类浏览** - 按类型浏览小说（玄幻、仙侠、都市等）
- 💰 **付费阅读** - 前25%免费，后续章节需付费解锁
- 🔐 **用户认证** - 安全的登录注册系统
- 💻 **响应式设计** - 完美适配桌面端、平板和手机
- ⚡ **快速加载** - 优化的性能和用户体验
- 🎨 **现代UI** - 美观的界面设计

## 技术栈

- **前端**: 纯HTML/CSS/JavaScript (ES6+)
- **后端**: Supabase (PostgreSQL + Auth + API)
- **样式**: CSS3 + Flexbox + Grid
- **图标**: Font Awesome 6
- **部署**: 静态文件服务器

## 项目结构

```
web/
├── index.html              # 主页面
├── styles/
│   └── main.css           # 主样式文件
├── js/
│   ├── config.js          # 应用配置
│   ├── supabase.js        # Supabase客户端
│   ├── auth.js            # 认证管理
│   ├── navigation.js      # 导航管理
│   ├── bookshelf.js       # 书架功能
│   ├── recommendations.js # 推荐功能
│   ├── categories.js      # 分类功能
│   ├── profile.js         # 个人中心
│   ├── novel-detail.js    # 小说详情
│   ├── reader.js          # 阅读器
│   ├── modal.js           # 模态框管理
│   └── app.js             # 应用主入口
├── package.json           # 项目配置
└── README.md             # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
cd web
npm install
```

### 2. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在 Supabase SQL Editor 中运行 `../supabase-setup.sql` 脚本
3. 在 `js/config.js` 中更新 Supabase 配置：

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://your-project-id.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here',
    // ...
};
```

### 3. 启动开发服务器

```bash
# 开发模式（自动刷新）
npm run dev

# 或者标准模式
npm start
```

访问 http://localhost:3000 查看应用。

## 开发指南

### 可用脚本

```bash
# 启动开发服务器
npm run dev

# 启动生产服务器
npm start

# 构建优化版本
npm run build

# 代码检查
npm run lint

# 自动修复代码格式
npm run lint:fix

# 格式化代码
npm run format

# 启动简单服务器
npm run serve
```

### 代码结构

#### 配置文件 (config.js)
- 应用配置常量
- Supabase连接信息
- 分类映射和图标
- 工具函数

#### 管理器模式
每个功能模块都有对应的管理器类：
- `AuthManager` - 处理用户认证
- `NavigationManager` - 管理页面导航
- `BookshelfManager` - 管理用户书架
- `RecommendationsManager` - 处理推荐内容
- `CategoriesManager` - 管理分类浏览
- `ProfileManager` - 用户资料管理
- `NovelDetailManager` - 小说详情页
- `ReaderManager` - 阅读器功能
- `ModalManager` - 模态框管理

#### 事件系统
使用自定义事件进行组件间通信：
- `authStateChange` - 认证状态变化
- `userStateChange` - 用户状态变化
- `screenChange` - 页面切换
- `appInitialized` - 应用初始化完成

### 样式指南

#### CSS 组织
- 全局样式和重置
- 组件样式
- 响应式断点
- 动画和过渡效果

#### 响应式断点
- 桌面端: > 768px
- 平板端: 481px - 768px
- 手机端: < 480px

#### 颜色主题
- 主色调: #C0392B (红色)
- 辅助色: #2C3E50 (深蓝灰)
- 文字色: #2C3E50
- 背景色: #F4F4F4

### API 集成

#### Supabase 表结构
- `profiles` - 用户资料
- `novels` - 小说信息
- `chapters` - 章节内容
- `user_purchases` - 购买记录
- `user_bookshelf` - 用户书架

#### 数据流
1. 用户操作触发管理器方法
2. 管理器调用 Supabase 客户端
3. 数据获取后更新 UI
4. 触发相关事件通知其他组件

## 部署

### 静态文件服务器部署

1. 构建优化版本：
```bash
npm run build
```

2. 将 `web` 目录上传到任何静态文件服务器：
   - Netlify
   - Vercel
   - GitHub Pages
   - Apache/Nginx

### 环境配置

生产环境需要更新 `js/config.js` 中的配置：
- Supabase URL 和密钥
- 应用域名设置
- 错误追踪配置

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 性能优化

### 已实现优化
- CSS 和 JS 压缩
- 图片懒加载
- 虚拟滚动（长列表）
- 缓存策略
- 代码分割

### 性能监控
- 页面加载时间监控
- 内存使用监控
- 错误追踪
- 用户行为分析

## 调试工具

在开发环境下，控制台提供调试工具：

```javascript
// 检查应用健康状态
debug.health()

// 重启应用
debug.restart()

// 清空本地存储
debug.clearStorage()

// 访问管理器实例
debug.managers.auth()
debug.managers.bookshelf()
```

## 安全考虑

- 所有用户输入都经过验证和清理
- 使用 Supabase RLS (行级安全策略)
- HTTPS 强制使用
- XSS 防护
- CSRF 防护

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 代码规范
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 JavaScript Standard Style
- 添加适当的注释和文档

## 常见问题

### Q: 页面加载缓慢怎么办？
A: 检查网络连接，清除浏览器缓存，或尝试刷新页面。

### Q: 登录后页面空白？
A: 检查 Supabase 配置是否正确，确保数据库表已正确创建。

### Q: 阅读进度没有保存？
A: 确保已登录，并且网络连接正常。

### Q: 图片无法显示？
A: 检查图片 URL 是否有效，或者网络是否允许加载外部图片。

## 更新日志

### v1.0.0 (2024-01-20)
- 初始版本发布
- 完整的阅读功能
- 用户认证系统
- 响应式设计
- 书架管理
- 付费阅读支持

## 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 联系我们

如有问题或建议，请通过以下方式联系：
- 创建 GitHub Issue
- 发送邮件至 support@chopfiction.com

---

感谢使用小说阅读器网页版！
