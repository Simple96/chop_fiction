# Stripe 订阅支付集成设置指南

## 概述
本应用已集成 Stripe 订阅支付系统，实现了"前3章免费，订阅后无限制阅读"的付费模式。

## 功能特性
- ✅ 前3章免费阅读
- ✅ 订阅后无限制访问所有章节
- ✅ 月度和年度订阅选项
- ✅ 订阅管理（取消、更新支付方式等）
- ✅ 支付状态实时同步
- ✅ 用户友好的订阅界面

## 设置步骤

### 1. Stripe 账户设置
1. 注册 [Stripe 账户](https://stripe.com)
2. 获取测试环境的 API 密钥：
   - 可发布密钥 (Publishable Key)
   - 密钥 (Secret Key)

### 2. 创建产品和价格
在 Stripe Dashboard 中创建以下产品：

**月度订阅产品**
- 产品名称: "Novica Monthly Subscription"
- 价格: $9.99 USD
- 计费周期: 月度
- 记录价格 ID (例如: `price_1QcqjhKbr7MrxLXg8xLVZQn`)

**年度订阅产品**
- 产品名称: "Novica Yearly Subscription"
- 价格: $99.99 USD
- 计费周期: 年度
- 记录价格 ID (例如: `price_1QcqjhKbr7MrxLXg8xLVZQn2`)

### 3. 更新配置文件
编辑 `js/config.js` 文件，更新以下配置：

```javascript
// Stripe 配置
STRIPE_PUBLISHABLE_KEY: 'pk_test_your_actual_publishable_key_here',
STRIPE_MONTHLY_PRICE_ID: 'price_your_actual_monthly_price_id',
STRIPE_YEARLY_PRICE_ID: 'price_your_actual_yearly_price_id',
```

### 4. 数据库架构
需要在 Supabase 中创建以下表：

**user_subscriptions 表**
```sql
CREATE TABLE user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT NOT NULL, -- active, canceled, past_due, etc.
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    interval TEXT, -- month, year
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'usd',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
```

### 5. 后端 API 设置（重要）
当前实现包含了模拟 API (`api-simulation.js`)，但在生产环境中需要实现真实的后端 API：

**需要实现的 API 端点：**

1. **POST /api/create-checkout-session**
   - 创建 Stripe Checkout Session
   - 需要用户认证
   - 返回 session ID

2. **POST /api/cancel-subscription**
   - 取消用户订阅
   - 需要用户认证

3. **POST /api/create-portal-session**
   - 创建客户门户会话
   - 用于订阅管理
   - 需要用户认证

4. **POST /api/webhook/stripe**
   - 处理 Stripe Webhooks
   - 同步订阅状态到数据库

### 6. Webhook 设置
在 Stripe Dashboard 中设置 Webhook：

**Webhook URL:** `https://your-domain.com/api/webhook/stripe`

**需要监听的事件：**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 7. 环境变量设置
在后端设置以下环境变量：

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 使用说明

### 用户体验流程
1. **免费阅读**: 用户可以免费阅读任何小说的前3章
2. **订阅提示**: 尝试阅读第4章时，显示订阅提示
3. **选择方案**: 用户可以选择月度或年度订阅
4. **支付处理**: 重定向到 Stripe Checkout 完成支付
5. **激活订阅**: 支付成功后自动激活订阅，用户可无限制阅读

### 订阅管理
- 用户可在个人中心查看订阅状态
- 点击"管理订阅"跳转到 Stripe 客户门户
- 可以更新支付方式、查看账单历史、取消订阅等

## 测试

### 测试用卡号
使用 Stripe 提供的测试卡号：
- **成功支付**: 4242 4242 4242 4242
- **支付失败**: 4000 0000 0000 0002
- **需要验证**: 4000 0025 0000 3155

### 测试流程
1. 使用测试卡号完成订阅
2. 验证订阅状态在个人中心正确显示
3. 测试章节访问权限
4. 测试订阅管理功能

## 生产部署注意事项

1. **替换测试密钥**: 将所有 `pk_test_` 和 `sk_test_` 密钥替换为生产密钥
2. **HTTPS**: 确保网站使用 HTTPS
3. **Webhook 安全**: 验证 Webhook 签名
4. **错误处理**: 完善支付失败的处理流程
5. **日志记录**: 记录所有支付相关的操作
6. **备份策略**: 定期备份订阅数据

## 故障排除

### 常见问题
1. **支付失败**: 检查 Stripe 密钥是否正确
2. **订阅状态未同步**: 检查 Webhook 是否正常工作
3. **章节访问问题**: 检查订阅状态判断逻辑

### 调试工具
- Stripe Dashboard 的事件日志
- 浏览器开发者工具控制台
- Supabase Dashboard 的实时日志

## 支持

如有问题，请查看：
- [Stripe 文档](https://stripe.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- 项目 GitHub Issues

---

**注意**: 当前版本包含模拟 API，仅用于演示。生产环境请务必实现真实的后端 API。
