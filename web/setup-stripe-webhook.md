# 设置 Stripe Webhook

## 1. 部署 Webhook 函数

首先，确保你已经安装了 Supabase CLI：

```bash
# 安装 Supabase CLI（如果还没有安装）
npm install -g supabase

# 登录 Supabase
supabase login

# 链接到你的项目
supabase link --project-ref your-project-id
```

然后部署 webhook 函数和数据库迁移：

```bash
# 部署数据库迁移
supabase db push

# 部署 webhook 函数
supabase functions deploy stripe-webhook
```

## 2. 设置环境变量

在 Supabase Dashboard 中设置以下环境变量：

1. 前往 **Project Settings > Edge Functions**
2. 添加以下环境变量：

```
STRIPE_SECRET_KEY=sk_test_你的秘钥
STRIPE_WEBHOOK_SECRET=whsec_将在步骤3中获取
SUPABASE_URL=你的supabase_url
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
```

## 3. 在 Stripe Dashboard 中设置 Webhook

1. 前往 [Stripe Dashboard](https://dashboard.stripe.com)
2. 导航到 **Developers > Webhooks**
3. 点击 **Add endpoint**
4. 输入 Endpoint URL：
   ```
   https://your-project-id.supabase.co/functions/v1/stripe-webhook
   ```
5. 选择要监听的事件：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

6. 点击 **Add endpoint**
7. 复制 **Signing secret**（以 `whsec_` 开头）
8. 将这个 secret 添加到 Supabase 环境变量中作为 `STRIPE_WEBHOOK_SECRET`

## 4. 测试 Webhook

1. 在你的应用中完成一次测试支付
2. 在 Stripe Dashboard 中查看 Webhook 日志
3. 在 Supabase Dashboard 中检查 `user_subscriptions` 表是否有新记录

## 5. 如果遇到问题

检查以下几点：

1. **Webhook URL 是否正确**：应该是 `https://your-project-id.supabase.co/functions/v1/stripe-webhook`
2. **环境变量是否设置正确**：特别是 `STRIPE_SECRET_KEY` 和 `STRIPE_WEBHOOK_SECRET`
3. **Supabase 函数日志**：在 Supabase Dashboard > Edge Functions > Logs 中查看错误信息
4. **Stripe Webhook 日志**：在 Stripe Dashboard > Webhooks 中查看发送状态

## 快速测试脚本

创建一个测试文件来验证 webhook 是否工作：

```javascript
// test-webhook.js
const testWebhook = async () => {
  const response = await fetch('https://your-project-id.supabase.co/functions/v1/stripe-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'test',
      data: { object: { test: true } }
    })
  });
  
  console.log('Webhook response:', await response.text());
};

testWebhook();
```

如果所有步骤都正确完成，当用户完成支付后，`user_subscriptions` 表中应该会自动创建相应的记录。

