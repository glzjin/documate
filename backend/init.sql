CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  project VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  checksum VARCHAR(32),
  chunk_index INTEGER,
  embedding vector(1536)
);

CREATE INDEX ON pages USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100); 