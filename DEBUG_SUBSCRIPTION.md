# 订阅问题调试指南

## 当前问题
支付成功后没有创建user_subscription记录，出现406错误。

## 已修复的问题
1. ✅ 修复了RLS策略（添加了UPDATE和DELETE策略）
2. ✅ 修复了PGRST116错误（使用maybeSingle()替代single()）
3. ✅ 添加了详细的调试日志

## 调试步骤

### 1. 使用调试脚本
在浏览器控制台中运行以下命令：

```javascript
// 完整调试
debugSubscription()

// 测试支付成功事件
testPaymentSuccess()

// 检查待处理订阅
checkPendingSubscription()

// 清理测试数据
cleanupTestData()
```

### 2. 使用测试页面
访问以下测试页面：
- `web/simple-test.html` - 简单测试
- `web/test-subscription.html` - 完整测试
- `web/test-database.html` - 数据库测试

### 3. 检查控制台日志
查看以下关键信息：
- 用户认证状态
- Supabase客户端初始化
- 订阅管理器初始化
- 数据库查询结果
- 错误信息

## 可能的问题原因

### 1. 用户未登录
- 确保用户已登录
- 检查auth.uid()是否正确返回

### 2. 订阅管理器未初始化
- 检查subscription-manager.js是否正确加载
- 确认window.subscriptionManager存在

### 3. 事件监听器问题
- 确认subscriptionPaymentSuccess事件被正确触发
- 检查事件监听器是否正确绑定

### 4. 数据库权限问题
- 确认RLS策略已正确应用
- 检查用户是否有正确的权限

## 验证步骤

1. **登录用户**
2. **运行调试脚本**：`debugSubscription()`
3. **检查输出**：确认所有步骤都成功
4. **测试支付流程**：进行实际支付测试
5. **验证结果**：确认订阅记录被创建

## 常见错误及解决方案

### PGRST116错误
- **原因**：查询返回0行
- **解决**：使用maybeSingle()替代single()

### 406 Not Acceptable错误
- **原因**：RLS策略问题
- **解决**：运行fix-subscription-policies.sql

### 订阅管理器未加载
- **原因**：脚本加载顺序问题
- **解决**：确保subscription-manager.js在auth.js之前加载

## 文件清单

- `debug-subscription.js` - 调试脚本
- `fix-subscription-policies.sql` - 数据库修复脚本
- `web/simple-test.html` - 简单测试页面
- `web/test-subscription.html` - 完整测试页面
- `web/test-database.html` - 数据库测试页面

## 下一步

如果问题仍然存在，请：
1. 运行`debugSubscription()`并分享完整的控制台输出
2. 检查Network标签页中的Supabase请求
3. 确认数据库RLS策略已正确应用
