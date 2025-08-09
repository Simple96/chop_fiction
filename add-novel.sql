-- 添加新小说的SQL脚本模板
-- 复制这个模板，修改参数，然后在Supabase SQL Editor中执行

-- 示例：添加一本新小说
INSERT INTO novels (
  title,
  author,
  description,
  cover_image,
  category,
  original_language,
  translated_language,
  total_chapters,
  free_chapters,
  price
) VALUES (
  '你的小说标题',                    -- title: 小说标题
  '作者名',                         -- author: 作者名
  '这里是小说的简介描述，介绍故事情节和特色。', -- description: 小说描述
  'https://via.placeholder.com/300x400', -- cover_image: 封面图片URL
  'Fantasy',                        -- category: 类别 (Fantasy, Urban, Xianxia, Historical, Military, Gaming, Sports, Sci-Fi, Supernatural, Fanfiction)
  'zh-CN',                         -- original_language: 原始语言
  'en',                            -- translated_language: 翻译后语言
  50,                              -- total_chapters: 总章节数
  12,                              -- free_chapters: 免费章节数
  9.99                             -- price: 价格 (美元)
);

-- 获取刚插入的小说ID (可选)
SELECT id, title FROM novels ORDER BY created_at DESC LIMIT 1;

-- ========================================
-- 批量添加多本小说的示例
-- ========================================

INSERT INTO novels (title, author, description, cover_image, category, original_language, translated_language, total_chapters, free_chapters, price) VALUES

-- 小说1
('斗破苍穹 (AI精简版)', '天蚕土豆', '少年萧炎在家族中被视为废物，但在获得神秘戒指后开始崛起。这是原版小说的AI精简版本，保留了精彩剧情的同时大大缩短了篇幅。', 'https://via.placeholder.com/300x400', 'Fantasy', 'zh-CN', 'en', 45, 11, 8.99),

-- 小说2
('完美世界 (AI缩写版)', '辰东', '一个少年从荒域走出，踏上修炼之路的传奇故事。AI智能缩写，保留原著精华，快速阅读体验。', 'https://via.placeholder.com/300x400', 'Fantasy', 'zh-CN', 'en', 40, 10, 7.99),

-- 小说3
('都市修仙传说', '网络作者', '现代都市中的修仙者故事，融合了都市生活与修仙元素。', 'https://via.placeholder.com/300x400', 'Urban', 'zh-CN', 'en', 35, 9, 6.99),

-- 小说4
('星际科幻冒险', '科幻作家', '未来世界的星际探险故事，充满科技感和想象力。', 'https://via.placeholder.com/300x400', 'Sci-Fi', 'zh-CN', 'en', 30, 8, 5.99);

-- 查看所有小说
SELECT id, title, author, category, total_chapters, free_chapters, price, created_at 
FROM novels 
ORDER BY created_at DESC;