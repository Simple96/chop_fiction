-- 清理现有数据（如果存在）
DELETE FROM chapters;
DELETE FROM user_purchases;
DELETE FROM user_bookshelf;
DELETE FROM novels;

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

-- 为斗破苍穹插入更多免费章节
DO $$
DECLARE
    novel_uuid UUID;
    i INTEGER;
BEGIN
    SELECT id INTO novel_uuid FROM novels WHERE title = '斗破苍穹（缩写版）';
    
    FOR i IN 4..12 LOOP
        INSERT INTO chapters (novel_id, chapter_number, title, content, is_free)
        VALUES (novel_uuid, i, '第' || i || '章', '这是第' || i || '章的内容。萧炎的修炼之路充满挑战，每一步都需要他的坚持和努力。AI缩写版本保留了原作的精彩情节。', true);
    END LOOP;
    
    -- 插入付费章节
    FOR i IN 13..50 LOOP
        INSERT INTO chapters (novel_id, chapter_number, title, content, is_free)
        VALUES (novel_uuid, i, '第' || i || '章', '这是付费章节的内容。需要购买全本才能阅读。萧炎的实力不断提升，面对更强大的敌人...', false);
    END LOOP;
END $$;

-- 为其他小说插入章节
DO $$
DECLARE
    novel_record RECORD;
    i INTEGER;
BEGIN
    FOR novel_record IN SELECT id, title, free_chapters, total_chapters FROM novels WHERE title != '斗破苍穹（缩写版）' LOOP
        -- 插入免费章节
        FOR i IN 1..novel_record.free_chapters LOOP
            INSERT INTO chapters (novel_id, chapter_number, title, content, is_free)
            VALUES (novel_record.id, i, '第' || i || '章', '这是第' || i || '章的内容。AI缩写版本保留了原作的精彩情节，让读者能够快速了解故事发展。内容经过精心编辑，确保阅读体验的流畅性。', true);
        END LOOP;
        
        -- 插入付费章节
        FOR i IN (novel_record.free_chapters + 1)..novel_record.total_chapters LOOP
            INSERT INTO chapters (novel_id, chapter_number, title, content, is_free)
            VALUES (novel_record.id, i, '第' || i || '章', '这是付费章节的内容。需要购买全本才能阅读。AI缩写版本在保持故事完整性的同时，大大缩短了阅读时间，让您能够快速体验完整的故事情节。', false);
        END LOOP;
    END LOOP;
END $$; 