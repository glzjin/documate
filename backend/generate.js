// @see https://docs.aircode.io/guide/functions/
const OpenAI = require('openai');
const db = require('./db');

// 默认模型配置
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';

// 将向量数组转换为PostgreSQL vector格式
function formatEmbeddingForPostgres(embedding) {
  if (!Array.isArray(embedding)) {
    throw new Error('Embedding must be an array');
  }
  return `[${embedding.join(',')}]`;
}

async function generateEmbeddings(project, embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL) {
  try {
    // Find all the pages without embeddings
    const result = await db.query(
      'SELECT * FROM pages WHERE project = $1 AND embedding IS NULL',
      [project]
    ).catch(err => {
      console.error('Database query failed:', err);
      throw new Error('Failed to query database');
    });

    const pages = result.rows;

    if (!pages || pages.length === 0) {
      console.log(`No pages found needing embeddings for project: ${project}`);
      return { ok: 1 };
    }

    // Replace newlines with spaces for OpenAI embeddings
    const input = pages.map(page => page.content.replace(/\n/g, ' '));
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    // 配置OpenAI客户端
    const openaiConfig = {
      apiKey: process.env.OPENAI_API_KEY,
    };
    
    // 如果设置了自定义API base，添加到配置中
    if (process.env.OPENAI_API_BASE) {
      openaiConfig.baseURL = process.env.OPENAI_API_BASE;
    }

    const openai = new OpenAI(openaiConfig);

    const { data, usage } = await openai.embeddings.create({
      model: embeddingModel,
      input,
    }).catch(err => {
      console.error('OpenAI API call failed:', err.message);
      throw new Error('Failed to generate embeddings from OpenAI');
    });

    // Update embeddings in batches
    for (let i = 0; i < pages.length; i++) {
      try {
        const formattedEmbedding = formatEmbeddingForPostgres(data[i].embedding);
        await db.query(
          'UPDATE pages SET embedding = $1 WHERE id = $2',
          [formattedEmbedding, pages[i].id]
        );
      } catch (err) {
        console.error(`Failed to update embedding for page ${pages[i].id}:`, err);
        console.error('Embedding data:', {
          id: pages[i].id,
          embeddingLength: data[i].embedding?.length,
          sampleEmbedding: data[i].embedding?.slice(0, 5)
        });
        throw new Error(`Failed to update embeddings in database: ${err.message}`);
      }
    }

    console.log(`Successfully generated embeddings for ${pages.length} pages in project: ${project}`);
    return { ok: 1, count: pages.length };
  } catch (error) {
    console.error(`Failed to generate embeddings for project ${project}:`, error.message);
    return { 
      ok: 0, 
      error: error.message,
      details: error.stack 
    };
  }
}

module.exports = {
  generateEmbeddings,
}
