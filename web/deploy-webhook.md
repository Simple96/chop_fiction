# Webhook 部署指南

## 问题分析
Stripe支付成功后没有创建user_subscription记录，说明webhook没有正确处理支付成功事件。

## 可能的原因
1. Webhook没有正确部署
2. Webhook环境变量没有配置
3. Stripe webhook端点没有正确设置
4. Webhook签名验证失败

## 部署步骤

### 1. 检查Supabase Functions
```bash
# 检查functions是否部署
npx supabase functions list

# 如果没有部署，需要部署
npx supabase functions deploy stripe-webhook
```

### 2. 设置环境变量
在Supabase Dashboard中设置以下环境变量：
- `STRIPE_SECRET_KEY` - Stripe密钥
- `STRIPE_WEBHOOK_SECRET` - Webhook签名密钥

### 3. 在Stripe Dashboard中配置Webhook
1. 登录Stripe Dashboard
2. 进入Developers > Webhooks
3. 添加端点：`https://bbohqxwziavcqiwmcitw.supabase.co/functions/v1/stripe-webhook`
4. 选择以下事件：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 4. 测试Webhook
使用测试页面 `web/test-webhook.html` 来测试webhook端点。

## 临时解决方案

如果webhook部署有问题，可以使用临时解决方案：

### 方案1：改进前端处理
修改 `web/js/subscription-manager.js`，在支付成功后直接创建订阅记录：

```javascript
// 在handlePaymentSuccess方法中添加
const subscriptionData = {
    stripe_subscription_id: paymentDetails.sessionId || 'temp_' + Date.now(),
    stripe_customer_id: paymentDetails.customerId || 'temp_cus_' + Date.now(),
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: this.calculatePeriodEnd(paymentDetails.priceId),
    interval: this.getIntervalFromPriceId(paymentDetails.priceId),
    amount: this.getAmountFromPriceId(paymentDetails.priceId),
    currency: 'usd'
};

const result = await window.supabaseClient.upsertUserSubscription(subscriptionData);
```

### 方案2：使用Stripe Checkout的success_url参数
在创建Checkout Session时，通过success_url传递用户信息：

```javascript
const checkoutConfig = {
    mode: 'subscription',
    lineItems: [{
        price: priceId,
        quantity: 1
    }],
    successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}&user_id=${user.id}`,
    cancelUrl: `${window.location.origin}/cancel`
};
```

然后在success页面处理订阅创建。

## 验证步骤

1. **测试Webhook端点**：
   ```bash
   curl -X POST https://bbohqxwziavcqiwmcitw.supabase.co/functions/v1/stripe-webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"test","data":{"object":{"id":"test"}}}'
   ```

2. **检查Stripe Dashboard**：
   - 查看Webhook事件历史
   - 确认事件是否成功发送
   - 检查响应状态码

3. **检查Supabase Logs**：
   - 查看Functions日志
   - 确认webhook是否被触发
   - 检查错误信息

## 调试命令

```bash
# 查看functions状态
npx supabase functions list

# 查看function日志
npx supabase functions logs stripe-webhook

# 重新部署function
npx supabase functions deploy stripe-webhook
```

## 常见问题

### Q: Webhook返回404错误
A: 检查function是否正确部署，URL是否正确。

### Q: Webhook返回401错误
A: 检查环境变量是否正确设置。

### Q: Webhook返回400错误
A: 检查请求格式和签名验证。

### Q: 事件没有被处理
A: 检查事件类型是否在switch语句中处理。
