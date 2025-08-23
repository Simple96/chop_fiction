# 订阅问题修复指南

## 问题描述
支付成功后没有创建user_subscription记录，用户profile页面显示"Free Account"状态。

## 问题原因
1. **RLS策略不完整**：user_subscriptions表缺少UPDATE和DELETE策略
2. **406 Not Acceptable错误**：数据库查询失败导致无法创建或查询订阅记录

## 修复步骤

### 1. 修复数据库RLS策略

在Supabase SQL编辑器中运行以下SQL脚本：

```sql
-- 修复 user_subscriptions 表的 RLS 策略
-- 这个脚本修复了 406 Not Acceptable 错误

-- 首先删除现有的策略
DROP POLICY IF EXISTS "用户可以新增或更新自己的订阅" ON user_subscriptions;

-- 创建正确的策略
CREATE POLICY "用户可以新增自己的订阅" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的订阅" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的订阅" ON user_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- 确保表存在并且有正确的结构
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  interval TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 确保 RLS 已启用
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
```

### 2. 测试数据库连接

访问 `web/test-database.html` 页面，测试：
- 数据库连接
- user_subscriptions表访问
- 插入和查询操作

### 3. 测试订阅流程

访问 `web/test-subscription.html` 页面，测试：
- 用户状态
- 订阅状态
- 创建测试订阅

### 4. 调试步骤

1. **检查控制台日志**：
   - 打开浏览器开发者工具
   - 查看Console标签页
   - 寻找错误信息和调试日志

2. **检查网络请求**：
   - 查看Network标签页
   - 检查Supabase API请求
   - 确认请求状态码

3. **验证用户认证**：
   - 确保用户已登录
   - 检查auth.uid()是否正确返回

## 代码改进

### 1. 改进了错误处理
- 添加了详细的调试日志
- 改进了错误消息
- 添加了用户状态检查

### 2. 改进了订阅管理器
- 添加了页面加载时检查待处理订阅
- 改进了支付成功事件处理
- 添加了重复订阅检查

### 3. 添加了调试工具
- Profile页面调试按钮
- 测试页面
- 详细的日志输出

## 常见问题

### Q: 仍然出现406错误怎么办？
A: 检查RLS策略是否正确应用，确保用户已登录且auth.uid()正确返回。

### Q: 支付成功但没有创建订阅记录？
A: 检查订阅管理器是否正确触发，查看控制台日志确认事件处理。

### Q: Profile页面显示Free Account？
A: 检查getUserSubscription方法是否正确返回数据，确认订阅状态检查逻辑。

## 验证修复

1. 进行测试支付
2. 检查控制台日志
3. 验证订阅记录是否创建
4. 确认Profile页面显示正确状态

## 文件清单

- `fix-subscription-policies.sql` - 数据库修复脚本
- `web/test-database.html` - 数据库测试页面
- `web/test-subscription.html` - 订阅测试页面
- `web/js/subscription-manager.js` - 改进的订阅管理器
- `web/js/supabase.js` - 改进的Supabase客户端
- `web/js/profile.js` - 改进的Profile页面
- `web/js/app.js` - 改进的应用逻辑
