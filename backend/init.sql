CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  project VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL,
  fullPath TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  checksum VARCHAR(32),
  chunk_index INTEGER,
  embedding vector(1536),
  path_embedding vector(1536)
);

-- 创建一个函数来检查和创建索引
CREATE OR REPLACE FUNCTION create_vector_indices()
RETURNS void AS $$
BEGIN
  -- 检查表中的数据量
  IF (SELECT COUNT(*) FROM pages) >= 100 THEN
    -- 如果索引不存在且有足够的数据，则创建索引
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'pages_embedding_idx'
    ) THEN
      CREATE INDEX pages_embedding_idx ON pages USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'pages_path_embedding_idx'
    ) THEN
      CREATE INDEX pages_path_embedding_idx ON pages USING ivfflat (path_embedding vector_cosine_ops)
      WITH (lists = 100);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 创建一个函数来修复路径
CREATE OR REPLACE FUNCTION fix_paths()
RETURNS void AS $$
BEGIN
  -- 更新所有 fullPath 为 NULL 或空的记录
  UPDATE pages 
  SET 
    path = REPLACE(path, '\', '/'),
    fullPath = REPLACE(path, '\', '/')
  WHERE fullPath IS NULL OR fullPath = '';

  -- 更新所有使用反斜杠的记录
  UPDATE pages 
  SET 
    path = REPLACE(path, '\', '/'),
    fullPath = REPLACE(fullPath, '\', '/')
  WHERE path LIKE '%\%' OR fullPath LIKE '%\%';
END;
$$ LANGUAGE plpgsql;

-- 执行路径修复
SELECT fix_paths(); 