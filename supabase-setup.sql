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

-- 创建用户购买记录表
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, novel_id)
);

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
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
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

-- user_purchases 表策略
CREATE POLICY "用户可以查看自己的购买记录" ON user_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以创建购买记录" ON user_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_bookshelf 表策略
CREATE POLICY "用户可以查看自己的书架" ON user_bookshelf FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以管理自己的书架" ON user_bookshelf FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的书架" ON user_bookshelf FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的书架项目" ON user_bookshelf FOR DELETE USING (auth.uid() = user_id);

-- 插入示例小说数据
INSERT INTO novels (title, author, description, category, total_chapters, free_chapters, price) VALUES
('斗破苍穹（缩写版）', '天蚕土豆', '少年萧炎在家族中被视为废物，但在获得神秘戒指后开始崛起。这是原版小说的AI缩写版本，保留了精彩剧情的同时大大缩短了篇幅。', '玄幻', 50, 12, 9.99),
('完美世界（缩写版）', '辰东', '一个少年从大荒中走出，踏上修炼之路。AI精心缩写，将数百万字的内容压缩为精华版本。', '玄幻', 45, 11, 8.99),
('遮天（缩写版）', '辰东', '冰冷与黑暗并存的宇宙深处，九具庞大的龙尸拉着一口青铜古棺，亘古长存。AI缩写版保持了原作的宏大世界观。', '玄幻', 60, 15, 12.99),
('凡人修仙传（缩写版）', '忘语', '一个普通的山村穷小子，偶然之下，跨入到一个江湖小门派。AI智能缩写，让你快速体验修仙之路。', '仙侠', 40, 10, 7.99),
('诛仙（缩写版）', '萧鼎', '蜀山之下，有一个叫青云门的门派。AI缩写版本，经典仙侠故事的精华呈现。', '仙侠', 35, 8, 6.99);

-- 为第一本小说插入示例章节
INSERT INTO chapters (novel_id, chapter_number, title, content, is_free) 
SELECT id, 1, '废物萧炎', 
'萧炎，萧家嫡系子弟，天赋异禀的修炼天才，四岁开始修炼，十岁便达到了九段斗之气，十一岁突破十段斗之气，成功凝聚斗之气旋，一跃成为家族百年来最年轻的斗者。然而，就在萧炎踌躇满志，准备在即将到来的成人仪式上大放异彩时，他的天赋却如流星般陨落...', true
FROM novels WHERE title = '斗破苍穹（缩写版）';

INSERT INTO chapters (novel_id, chapter_number, title, content, is_free) 
SELECT id, 2, '神秘戒指', 
'萧炎在药老的指导下，开始了全新的修炼之路。原来，他体内的斗之气并非消失，而是被一股神秘的力量所吞噬。这股力量来自于他母亲留下的戒指中沉睡的灵魂——药尘，曾经的斗气大陆第一炼药师...', true
FROM novels WHERE title = '斗破苍穹（缩写版）';

INSERT INTO chapters (novel_id, chapter_number, title, content, is_free) 
SELECT id, 3, '重新崛起', 
'在药老的悉心指导下，萧炎的实力开始飞速提升。他不仅恢复了修炼天赋，更是掌握了炼药术。然而，家族中的冷嘲热讽依然如影随形，萧炎决定在即将到来的成人仪式上证明自己...', true
FROM novels WHERE title = '斗破苍穹（缩写版）';

-- 为其他小说也插入几个免费章节
INSERT INTO chapters (novel_id, chapter_number, title, content, is_free) 
SELECT id, generate_series(1, 11), '第' || generate_series(1, 11) || '章', 
'这是第' || generate_series(1, 11) || '章的内容。AI缩写版本保留了原作的精彩情节，让读者能够快速了解故事发展。内容经过精心编辑，确保阅读体验的流畅性。', true
FROM novels WHERE title != '斗破苍穹（缩写版）';

-- 为所有小说插入付费章节（简化版）
INSERT INTO chapters (novel_id, chapter_number, title, content, is_free)
SELECT 
  n.id,
  generate_series(n.free_chapters + 1, n.total_chapters),
  '第' || generate_series(n.free_chapters + 1, n.total_chapters) || '章',
  '这是付费章节的内容。需要购买全本才能阅读。AI缩写版本在保持故事完整性的同时，大大缩短了阅读时间，让您能够快速体验完整的故事情节。',
  false
FROM novels n;

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