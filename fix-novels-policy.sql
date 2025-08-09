-- 修复novels和chapters表的INSERT策略
-- 这些策略允许插入新的小说和章节

-- 添加novels表的INSERT策略（允许所有人插入，用于管理员上传小说）
CREATE POLICY "允许插入新小说" ON novels FOR INSERT WITH CHECK (true);

-- 添加chapters表的INSERT策略（允许所有人插入，用于管理员上传章节）
CREATE POLICY "允许插入新章节" ON chapters FOR INSERT WITH CHECK (true);

-- 查看当前所有策略
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('novels', 'chapters')
ORDER BY tablename, cmd;