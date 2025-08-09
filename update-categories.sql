-- 更新数据库中的类别名称从中文改为英文
-- 这个脚本将novels表中的category字段从中文更新为英文

-- 更新类别名称
UPDATE novels SET category = 'Fantasy' WHERE category = '玄幻';
UPDATE novels SET category = 'Urban' WHERE category = '都市';
UPDATE novels SET category = 'Xianxia' WHERE category = '仙侠';
UPDATE novels SET category = 'Historical' WHERE category = '历史';
UPDATE novels SET category = 'Military' WHERE category = '军事';
UPDATE novels SET category = 'Gaming' WHERE category = '游戏';
UPDATE novels SET category = 'Sports' WHERE category = '竞技';
UPDATE novels SET category = 'Sci-Fi' WHERE category = '科幻';
UPDATE novels SET category = 'Supernatural' WHERE category = '灵异';
UPDATE novels SET category = 'Fanfiction' WHERE category = '同人';

-- 查看更新结果
SELECT category, COUNT(*) as count 
FROM novels 
GROUP BY category 
ORDER BY category;

-- 显示所有小说的类别
SELECT id, title, category 
FROM novels 
ORDER BY category, title;