const OpenAI = require('openai');
const db = require('./db');
const path = require('path');

// 默认模型配置
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';
const DEFAULT_CHAT_MODEL = 'gpt-4';
const MAX_CONTEXT_TOKENS = 4000; // 上下文最大token数
const MAX_PATHS = 3; // 最大路径数量

// 将向量数组转换为PostgreSQL vector格式
function formatEmbeddingForPostgres(embedding) {
  return `[${embedding.join(',')}]`;
}

async function findSimilarContent(embedding, pathEmbedding, project) {
  try {
    // 首先检查数据库中的数据
    const checkQuery = `
      SELECT id, path, fullpath, content 
      FROM pages 
      WHERE project = $1 
      LIMIT 1
    `;
    const checkResult = await db.query(checkQuery, [project]);
    console.log('Database check:', checkResult.rows[0]);

    // 首先获取最相似的文档及其路径
    const initialQuery = `
      WITH similarity_scores AS (
        SELECT 
          p.id,
          p.path,
          p.fullpath,
          p.content,
          (p.embedding <=> $1) * 0.7 + (p.path_embedding <=> $2) * 0.3 as similarity,
          CASE 
            WHEN position('/' in p.fullpath) > 0 THEN 
              substring(p.fullpath from 1 for position('/' in p.fullpath) - 1)
            ELSE 
              ''
          END as top_dir
        FROM pages p
        WHERE p.project = $3
          AND p.embedding IS NOT NULL 
          AND p.path_embedding IS NOT NULL
          AND p.fullpath IS NOT NULL
      )
      SELECT DISTINCT ON (top_dir)
        id,
        path,
        fullpath,
        content,
        similarity,
        top_dir
      FROM similarity_scores
      ORDER BY top_dir, similarity ASC
      LIMIT ${MAX_PATHS}
    `;

    console.log('Executing initial query...');
    const result = await db.query(initialQuery, [embedding, pathEmbedding, project]);

    if (!result.rows || result.rows.length === 0) {
      console.log('No similar documents found');
      return [];
    }

    console.log('Found initial documents:', result.rows.map(row => ({
      id: row.id,
      path: row.path,
      fullPath: row.fullpath,
      topDir: row.top_dir,
      similarity: row.similarity
    })));

    // 获取所有顶级目录
    const topDirs = result.rows
      .map(row => row.top_dir)
      .filter(dir => dir !== null);

    console.log('Top level directories:', topDirs);
    
    if (topDirs.length === 0) {
      console.log('No valid directories found, falling back to general search');
      const fallbackQuery = `
        WITH similarity_scores AS (
          SELECT 
            p.id,
            p.path,
            p.fullpath,
            p.content,
            (p.embedding <=> $1) * 0.7 + (p.path_embedding <=> $2) * 0.3 as similarity
          FROM pages p
          WHERE p.project = $3
            AND p.embedding IS NOT NULL 
            AND p.path_embedding IS NOT NULL
            AND p.fullpath IS NOT NULL
        )
        SELECT 
          id,
          path,
          fullpath,
          content,
          similarity
        FROM similarity_scores
        ORDER BY similarity ASC
        LIMIT 5
      `;

      const fallbackResult = await db.query(fallbackQuery, [embedding, pathEmbedding, project]);
      return fallbackResult.rows;
    }

    // 构建最终查询条件
    const conditions = topDirs.map((dir, i) => 
      dir === '' ? 
        `(position('/' in p.fullpath) = 0 OR p.fullpath IS NULL)` : 
        `p.fullpath LIKE $${i + 4}`
    ).join(' OR ');

    const params = topDirs
      .filter(dir => dir !== '')
      .map(dir => `${dir}/%`);

    console.log('Final search conditions:', {
      conditions,
      params,
      query: `
        WITH similarity_scores AS (
          SELECT 
            p.id,
            p.path,
            p.fullpath,
            p.content,
            (p.embedding <=> $1) * 0.7 + (p.path_embedding <=> $2) * 0.3 as similarity
          FROM pages p
          WHERE p.project = $3
            AND p.embedding IS NOT NULL 
            AND p.path_embedding IS NOT NULL
            AND p.fullpath IS NOT NULL
            AND (${conditions})
        )
        SELECT 
          id,
          path,
          fullpath,
          content,
          similarity
        FROM similarity_scores
        ORDER BY similarity ASC
        LIMIT 5
      `
    });
    
    const finalQuery = `
      WITH similarity_scores AS (
        SELECT 
          p.id,
          p.path,
          p.fullpath,
          p.content,
          (p.embedding <=> $1) * 0.7 + (p.path_embedding <=> $2) * 0.3 as similarity
        FROM pages p
        WHERE p.project = $3
          AND p.embedding IS NOT NULL 
          AND p.path_embedding IS NOT NULL
          AND p.fullpath IS NOT NULL
          AND (${conditions})
      )
      SELECT 
        id,
        path,
        fullpath,
        content,
        similarity
      FROM similarity_scores
      ORDER BY similarity ASC
      LIMIT 5
    `;

    const queryParams = [embedding, pathEmbedding, project, ...params];
    console.log('Query parameters:', {
      paramCount: queryParams.length,
      params: queryParams.map((p, i) => `$${i + 1}: ${p}`)
    });

    const finalResult = await db.query(finalQuery, queryParams);

    console.log('Final results:', finalResult.rows.map(row => ({
      id: row.id,
      path: row.path,
      fullPath: row.fullpath,
      similarity: row.similarity
    })));

    return finalResult.rows;
  } catch (err) {
    console.error('Error finding similar content:', err);
    throw new Error('Failed to find similar content');
  }
}

// 发送 SSE 消息
function sendSseMessage(res, data) {
  const message = typeof data === 'string' ? { content: data } : data;
  res.write(`data: ${JSON.stringify(message)}\n\n`);
}

// 处理流式响应
async function handleStreamResponse(res, messages, openai, chatModel) {
  // 设置 SSE 响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    // 创建流式完成
    const stream = await openai.chat.completions.create({
      model: chatModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
      stream: true,
    });

    // 处理每个块
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        sendSseMessage(res, {
          type: 'content',
          content: content
        });
      }
    }

    // 发送结束信号
    sendSseMessage(res, {
      type: 'done'
    });
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    sendSseMessage(res, {
      type: 'error',
      error: error.message
    });
    res.end();
  }
}

// 处理普通响应
async function handleNormalResponse(res, messages, openai, chatModel) {
  try {
    const completion = await openai.chat.completions.create({
      model: chatModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    return res.send(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error in normal response:', error);
    return res.status(500).send('处理问题时出错：' + error.message);
  }
}

async function handleAsk(req, res) {
  try {
    const { 
      project = 'default',
      question,
      stream = false,
      chatModel = process.env.OPENAI_CHAT_MODEL || DEFAULT_CHAT_MODEL,
      embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL
    } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'OPENAI_API_KEY environment variable is not set' });
    }

    // 配置OpenAI客户端
    const openaiConfig = {
      apiKey: process.env.OPENAI_API_KEY,
    };
    
    if (process.env.OPENAI_API_BASE) {
      openaiConfig.baseURL = process.env.OPENAI_API_BASE;
    }

    const openai = new OpenAI(openaiConfig);

    // 为问题生成嵌入向量
    const embeddingResponse = await openai.embeddings.create({
      model: embeddingModel,
      input: [question, question], // 生成两次，一次用于内容匹配，一次用于路径匹配
    });

    const questionEmbedding = formatEmbeddingForPostgres(embeddingResponse.data[0].embedding);
    const pathQuestionEmbedding = formatEmbeddingForPostgres(embeddingResponse.data[1].embedding);

    // 查找相似内容
    const similarDocs = await findSimilarContent(questionEmbedding, pathQuestionEmbedding, project);

    if (similarDocs.length === 0) {
      const noContentMessage = "抱歉，我在文档中没有找到相关的内容。请尝试用其他方式描述你的问题，或者确认相关文档是否已经上传。";
      if (stream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        sendSseMessage(res, {
          type: 'content',
          content: noContentMessage
        });
        sendSseMessage(res, {
          type: 'done'
        });
        return res.end();
      }
      return res.send(noContentMessage);
    }

    // 准备上下文
    const context = similarDocs.map(doc => {
      return `文件路径: ${doc.fullpath || doc.path}\n内容:\n${doc.content}\n`;
    }).join('\n---\n');

    // 准备提示
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的文档助手。请基于提供的文档内容回答用户问题。
回答要求：
1. 如果文档中有直接相关的内容，请详细解释
2. 如果涉及代码，请提供代码示例
3. 如果文档中没有相关信息，请明确说明
4. 回答要有条理，使用markdown格式
5. 保持专业性，同时要通俗易懂
6. 如果内容来自多个文件，请在回答时标注内容的来源文件路径`
      },
      {
        role: 'user',
        content: `基于以下文档内容回答问题：\n\n${context}\n\n问题：${question}`
      }
    ];

    // 根据 stream 参数选择响应方式
    if (stream) {
      return handleStreamResponse(res, messages, openai, chatModel);
    } else {
      return handleNormalResponse(res, messages, openai, chatModel);
    }

  } catch (error) {
    console.error('Error in ask handler:', error);
    if (!res.headersSent) {
      return res.status(500).send('处理问题时出错：' + error.message);
    }
  }
}

module.exports = handleAsk;
