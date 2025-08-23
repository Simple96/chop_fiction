# Webhook问题解决方案

## 问题描述
Stripe支付成功后没有创建user_subscription记录，导致用户profile页面显示"Free Account"。

## 根本原因
Webhook没有正确处理支付成功事件，可能的原因：
1. Webhook没有正确部署
2. 环境变量没有配置
3. Stripe webhook端点没有设置
4. 前端支付成功处理逻辑有问题

## 解决方案

### 方案1：修复Webhook（推荐）

#### 1. 部署Webhook Function
```bash
# 检查functions状态
npx supabase functions list

# 部署webhook function
npx supabase functions deploy stripe-webhook
```

#### 2. 配置环境变量
在Supabase Dashboard中设置：
- `STRIPE_SECRET_KEY` - 你的Stripe密钥
- `STRIPE_WEBHOOK_SECRET` - Webhook签名密钥

#### 3. 配置Stripe Webhook
在Stripe Dashboard中：
1. 进入Developers > Webhooks
2. 添加端点：`https://bbohqxwziavcqiwmcitw.supabase.co/functions/v1/stripe-webhook`
3. 选择事件：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`

### 方案2：前端临时解决方案（已实现）

我已经改进了前端代码，添加了备用处理机制：

#### 改进的功能：
1. **备用创建方法**：如果主要方法失败，会尝试备用方法
2. **更好的错误处理**：详细的错误日志和用户提示
3. **自动重试机制**：支付成功事件会被缓存，等待用户登录后处理

#### 测试步骤：
1. 访问 `web/test-webhook.html` 测试webhook端点
2. 访问 `web/simple-test.html` 测试订阅创建
3. 在控制台运行 `debugSubscription()` 进行完整调试

### 方案3：手动创建订阅（临时）

如果webhook和前端都失败，可以手动创建订阅记录：

```sql
-- 在Supabase SQL编辑器中运行
INSERT INTO user_subscriptions (
    user_id,
    stripe_subscription_id,
    stripe_customer_id,
    status,
    current_period_start,
    current_period_end,
    interval,
    amount,
    currency
) VALUES (
    '用户ID', -- 替换为实际用户ID
    'manual_sub_' || extract(epoch from now()),
    'manual_cus_' || extract(epoch from now()),
    'active',
    now(),
    now() + interval '30 days',
    'month',
    9.99,
    'usd'
);
```

## 验证步骤

### 1. 测试Webhook
```bash
curl -X POST https://bbohqxwziavcqiwmcitw.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test","data":{"object":{"id":"test"}}}'
```

### 2. 测试前端
1. 登录用户
2. 进行支付测试
3. 检查控制台日志
4. 验证订阅记录是否创建

### 3. 检查数据库
```sql
-- 查询用户订阅
SELECT * FROM user_subscriptions WHERE user_id = '用户ID';
```

## 调试工具

### 1. 测试页面
- `web/test-webhook.html` - Webhook测试
- `web/simple-test.html` - 简单订阅测试
- `web/test-subscription.html` - 完整订阅测试

### 2. 调试脚本
在浏览器控制台运行：
```javascript
// 完整调试
debugSubscription()

// 测试支付成功
testPaymentSuccess()

// 检查待处理订阅
checkPendingSubscription()
```

### 3. 日志检查
- 浏览器控制台日志
- Supabase Functions日志
- Stripe Dashboard webhook事件

## 常见问题

### Q: Webhook返回404
A: 检查function是否正确部署

### Q: Webhook返回401
A: 检查环境变量是否正确设置

### Q: 前端创建失败
A: 检查RLS策略和用户权限

### Q: 支付成功但没有创建记录
A: 检查webhook是否被触发，前端事件是否正确处理

## 下一步

1. **优先修复webhook**：确保webhook正确部署和配置
2. **测试前端备用方案**：验证前端处理逻辑
3. **监控日志**：观察支付流程中的错误
4. **用户测试**：进行完整的支付流程测试

如果问题仍然存在，请：
1. 分享webhook测试结果
2. 提供控制台错误日志
3. 检查Stripe Dashboard中的webhook事件历史
