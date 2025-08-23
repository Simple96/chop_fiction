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

-- 验证策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_subscriptions';
