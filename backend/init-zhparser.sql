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
        -- 检查索引是否存在
        IF EXISTS (
            SELECT 1
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'pages_content_idx'
        ) THEN
            DROP INDEX pages_content_idx;
        END IF;
        
        -- 创建新的全文搜索索引
        CREATE INDEX pages_content_idx ON pages USING gin(to_tsvector('chinese', content));
    END IF;
END
$$; 