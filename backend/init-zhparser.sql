-- 确保扩展目录存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'zhparser'
    ) THEN
        -- 创建 zhparser 扩展
        CREATE EXTENSION IF NOT EXISTS zhparser;

        -- 创建中文全文搜索配置
        DROP TEXT SEARCH CONFIGURATION IF EXISTS chinese;
        CREATE TEXT SEARCH CONFIGURATION chinese (PARSER = zhparser);

        -- 添加词性映射
        ALTER TEXT SEARCH CONFIGURATION chinese
            ADD MAPPING FOR n,v,a,i,e,l WITH simple;
    END IF;
END
$$;

-- 更新现有表以支持中文搜索
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'pages'
    ) THEN
        DROP INDEX IF EXISTS pages_content_idx;
        CREATE INDEX pages_content_idx ON pages USING gin(to_tsvector('chinese', content));
    END IF;
END
$$; 