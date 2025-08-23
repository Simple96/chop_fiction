-- 创建用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- 创建小说表
CREATE TABLE IF NOT EXISTS novels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image TEXT,
  category TEXT NOT NULL,
  original_language TEXT DEFAULT 'zh-CN',
  translated_language TEXT DEFAULT 'en',
  total_chapters INTEGER DEFAULT 0,
  free_chapters INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建章节表
CREATE TABLE IF NOT EXISTS chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_free BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(novel_id, chapter_number)
);

-- 清理旧表（逐本购买）
DROP VIEW IF EXISTS user_purchases;
DROP TABLE IF EXISTS user_purchases;

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

-- 兼容视图：基于有效订阅展开为对所有小说的访问权
CREATE OR REPLACE VIEW user_purchases AS
  SELECT
    gen_random_uuid() AS id,
    us.user_id,
    n.id AS novel_id,
    COALESCE(us.current_period_start, NOW()) AS purchased_at
  FROM user_subscriptions us
  JOIN novels n ON TRUE
  WHERE us.status = 'active' AND us.current_period_end > NOW();

-- 创建用户书架表
CREATE TABLE IF NOT EXISTS user_bookshelf (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
  last_read_chapter INTEGER,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, novel_id)
);

-- 启用行级安全策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
-- legacy 表已移除
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookshelf ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
-- profiles 表策略
CREATE POLICY "用户可以查看自己的资料" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户可以更新自己的资料" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "用户可以插入自己的资料" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- novels 表策略（所有人都可以查看）
CREATE POLICY "所有人都可以查看小说" ON novels FOR SELECT USING (true);

-- chapters 表策略（所有人都可以查看）
CREATE POLICY "所有人都可以查看章节" ON chapters FOR SELECT USING (true);

-- user_subscriptions 表策略
CREATE POLICY "用户可以查看自己的订阅" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以新增自己的订阅" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的订阅" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的订阅" ON user_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- user_bookshelf 表策略
CREATE POLICY "用户可以查看自己的书架" ON user_bookshelf FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以管理自己的书架" ON user_bookshelf FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的书架" ON user_bookshelf FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的书架项目" ON user_bookshelf FOR DELETE USING (auth.uid() = user_id);

-- 创建触发器函数，在用户注册时自动创建profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 