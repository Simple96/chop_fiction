-- 插入示例小说数据（英文内容）
INSERT INTO novels (title, author, description, category, total_chapters, free_chapters, price) VALUES
('Battle Through the Heavens (AI Condensed)', 'Heavenly Silkworm Potato', 'Young Xiao Yan was once considered a waste in his family, but after obtaining a mysterious ring, he begins his rise to power. This is an AI-condensed version of the original novel, preserving the exciting plot while significantly shortening the length.', '玄幻', 50, 12, 9.99),
('Perfect World (AI Condensed)', 'Chen Dong', 'A young man walks out from the great wilderness and embarks on the path of cultivation. Carefully condensed by AI, compressing millions of words into an essential version.', '玄幻', 45, 11, 8.99),
('Shrouding the Heavens (AI Condensed)', 'Chen Dong', 'In the cold and dark depths of the universe, nine massive dragon corpses pull a bronze ancient coffin, existing for eternity. The AI condensed version maintains the grand worldview of the original work.', '玄幻', 60, 15, 12.99),
('A Record of Mortal Cultivation (AI Condensed)', 'Wang Yu', 'An ordinary poor boy from a mountain village accidentally enters a small sect in the martial world. AI intelligently condensed, allowing you to quickly experience the path of cultivation.', '仙侠', 40, 10, 7.99),
('Jade Dynasty (AI Condensed)', 'Xiao Ding', 'Below Mount Shu, there is a sect called Qingyun Gate. AI condensed version, the essential presentation of this classic immortal cultivation story.', '仙侠', 35, 8, 6.99);

-- 为第一本小说插入示例章节（英文内容）
INSERT INTO chapters (novel_id, chapter_number, title, content, is_free) 
SELECT id, 1, 'The Fallen Genius', 
'Xiao Yan, a direct descendant of the Xiao family, was a cultivation genius with extraordinary talent. He began cultivating at age four, reached the ninth stage of Dou Qi at ten, and broke through to the tenth stage at eleven, successfully condensing his Dou Qi spiral and becoming the youngest Dou Zhe in the family''s century-long history. However, just as Xiao Yan was full of ambition, preparing to shine at the upcoming coming-of-age ceremony, his talent fell like a meteor...', true
FROM novels WHERE title = 'Battle Through the Heavens (AI Condensed)';

INSERT INTO chapters (novel_id, chapter_number, title, content, is_free) 
SELECT id, 2, 'The Mysterious Ring', 
'Under the guidance of Yao Lao, Xiao Yan began a new path of cultivation. It turned out that the Dou Qi in his body had not disappeared, but was being devoured by a mysterious force. This force came from the soul sleeping in the ring left by his mother - Yao Chen, once the greatest alchemist on the Dou Qi continent...', true
FROM novels WHERE title = 'Battle Through the Heavens (AI Condensed)';

INSERT INTO chapters (novel_id, chapter_number, title, content, is_free) 
SELECT id, 3, 'Rising Again', 
'Under Yao Lao''s careful guidance, Xiao Yan''s strength began to improve rapidly. He not only recovered his cultivation talent but also mastered alchemy. However, the cold mockery in the family still followed him like a shadow. Xiao Yan decided to prove himself at the upcoming coming-of-age ceremony...', true
FROM novels WHERE title = 'Battle Through the Heavens (AI Condensed)';

-- 为斗破苍穹插入更多免费章节（英文内容）
DO $$
DECLARE
    novel_uuid UUID;
    i INTEGER;
BEGIN
    SELECT id INTO novel_uuid FROM novels WHERE title = 'Battle Through the Heavens (AI Condensed)';
    
    FOR i IN 4..12 LOOP
        INSERT INTO chapters (novel_id, chapter_number, title, content, is_free)
        VALUES (novel_uuid, i, 'Chapter ' || i, 'This is the content of Chapter ' || i || '. Xiao Yan''s cultivation journey is full of challenges, and each step requires his persistence and effort. The AI condensed version preserves the exciting plot of the original work.', true);
    END LOOP;
    
    -- 插入付费章节
    FOR i IN 13..50 LOOP
        INSERT INTO chapters (novel_id, chapter_number, title, content, is_free)
        VALUES (novel_uuid, i, 'Chapter ' || i, 'This is premium chapter content. Purchase the full version to read. Xiao Yan''s strength continues to improve as he faces even more powerful enemies...', false);
    END LOOP;
END $$;

-- 为其他小说插入章节（英文内容）
DO $$
DECLARE
    novel_record RECORD;
    i INTEGER;
BEGIN
    FOR novel_record IN SELECT id, title, free_chapters, total_chapters FROM novels WHERE title != 'Battle Through the Heavens (AI Condensed)' LOOP
        -- 插入免费章节
        FOR i IN 1..novel_record.free_chapters LOOP
            INSERT INTO chapters (novel_id, chapter_number, title, content, is_free)
            VALUES (novel_record.id, i, 'Chapter ' || i, 'This is the content of Chapter ' || i || '. The AI condensed version preserves the exciting plot of the original work, allowing readers to quickly understand the story development. The content has been carefully edited to ensure a smooth reading experience.', true);
        END LOOP;
        
        -- 插入付费章节
        FOR i IN (novel_record.free_chapters + 1)..novel_record.total_chapters LOOP
            INSERT INTO chapters (novel_id, chapter_number, title, content, is_free)
            VALUES (novel_record.id, i, 'Chapter ' || i, 'This is premium chapter content. Purchase the full version to read. The AI condensed version maintains story integrity while significantly reducing reading time, allowing you to quickly experience the complete storyline.', false);
        END LOOP;
    END LOOP;
END $$; 