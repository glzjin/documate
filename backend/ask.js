const OpenAI = require('openai');
const db = require('./db');
const tokenizer = require('gpt-3-encoder');

// 默认模型配置
const DEFAULT_CHAT_MODEL = 'gpt-3.5-turbo';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';

// Token 限制配置
const MAX_TOTAL_TOKENS = 14000; // 保留一些空间给回答
const MAX_CONTEXT_TOKENS = 12000; // 上下文的最大token数
const TOKENS_RESERVE_FOR_ANSWER = 2000; // 为回答保留的token数

// 将向量数组转换为PostgreSQL vector格式
function formatEmbeddingForPostgres(embedding) {
  if (!Array.isArray(embedding)) {
    throw new Error('Embedding must be an array');
  }
  return `[${embedding.join(',')}]`;
}

// 计算文本的token数量
function countTokens(text) {
  try {
    return tokenizer.encode(text).length;
  } catch (error) {
    console.error('Error counting tokens:', error);
    // 如果编码失败，使用粗略估计（平均每4个字符1个token）
    return Math.ceil(text.length / 4);
  }
}

// 限制上下文长度，确保不超过token限制
function limitContextLength(sections, maxTokens) {
  let totalTokens = 0;
  const limitedSections = [];

  for (const section of sections) {
    const sectionTokens = countTokens(section);
    if (totalTokens + sectionTokens <= maxTokens) {
      limitedSections.push(section);
      totalTokens += sectionTokens;
    } else {
      break;
    }
  }

  return limitedSections;
}

// 使用关键词搜索查找相关内容
async function searchByKeywords(question, project) {
  try {
    // 使用中文全文搜索
    const query = `
      SELECT content,
             ts_rank_cd(to_tsvector('chinese', content), plainto_tsquery('chinese', $2)) as rank
      FROM pages 
      WHERE project = $1 
        AND to_tsvector('chinese', content) @@ plainto_tsquery('chinese', $2)
      ORDER BY rank DESC
      LIMIT 10
    `;

    const result = await db.query(query, [project, question]);
    return result.rows;
  } catch (error) {
    console.error('Full-text search failed:', error);
    // 如果全文搜索失败，回退到简单的LIKE查询
    try {
      const fallbackQuery = `
        SELECT content 
        FROM pages 
        WHERE project = $1 
          AND content ILIKE $2
        LIMIT 10
      `;
      const result = await db.query(fallbackQuery, [project, `%${question}%`]);
      return result.rows;
    } catch (fallbackError) {
      console.error('Fallback search failed:', fallbackError);
      return [];
    }
  }
}

async function handleAsk(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json('Missing OPENAI_API_KEY environment variable');
    }

    const { 
      question, 
      project = 'default',
      model = process.env.OPENAI_CHAT_MODEL || DEFAULT_CHAT_MODEL,
      embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL
    } = req.body;

    if (!question) {
      return res.status(400).json('Missing question parameter');
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

    try {
      // 如果是查询系统功能，直接返回帮助信息
      if (question.toLowerCase().includes('你能做什么') || 
          question.toLowerCase().includes('what can you do')) {
        return res.send(`我是一个文档助手，可以帮助你：

1. 回答关于文档内容的问题
2. 解释文档中的概念和代码
3. 提供相关的代码示例
4. 根据上下文给出准确的解答

使用方法：
- 直接问我任何关于文档的问题
- 可以询问具体的实现方式
- 可以请求代码示例
- 如果回答不准确，可以提供更多上下文
- 可以通过 model 参数指定使用的模型（如：gpt-4, gpt-3.5-turbo等）

注意：我只能回答已经在文档中存在的内容。`);
      }

      let contextSections = [];
      let usingKeywordSearch = false;

      // 首先尝试向量搜索
      try {
        const embeddingResponse = await openai.embeddings.create({
          model: embeddingModel,
          input: question.replace(/\n/g, ' '),
        });
        
        const embedding = embeddingResponse.data[0].embedding;
        const formattedEmbedding = formatEmbeddingForPostgres(embedding);

        const result = await db.query(
          `SELECT content 
           FROM pages 
           WHERE project = $1 
           ORDER BY embedding <=> $2::vector 
           LIMIT 10`,
          [project, formattedEmbedding]
        );

        if (result.rows.length > 0) {
          contextSections = result.rows.map(row => row.content.trim());
        } else {
          // 如果向量搜索没有结果，尝试关键词搜索
          throw new Error('No results from vector search');
        }
      } catch (error) {
        console.error('Vector search failed:', error);
        // 如果向量搜索失败，尝试关键词搜索
        const keywordResults = await searchByKeywords(question, project);
        if (keywordResults.length > 0) {
          contextSections = keywordResults.map(row => row.content.trim());
          usingKeywordSearch = true;
          console.log('Using keyword search as fallback');
        } else {
          console.log('Both vector and keyword search failed');
          return res.send("抱歉，我在文档中没有找到相关的内容。请尝试用其他方式描述你的问题，或者确认相关文档是否已经上传。");
        }
      }

      if (contextSections.length === 0) {
        return res.send("抱歉，我在文档中没有找到相关的内容。请尝试用其他方式描述你的问题，或者确认相关文档是否已经上传。");
      }

      // 限制上下文长度
      const limitedSections = limitContextLength(contextSections, MAX_CONTEXT_TOKENS);
      const contextText = limitedSections.join('\n---\n');

      // 计算系统提示的token数
      const systemPrompt = `你是一个专业的文档助手。请基于提供的文档内容回答用户问题。
回答要求：
1. 如果文档中有直接相关的内容，请详细解释
2. 如果涉及代码，请提供代码示例
3. 如果文档中没有相关信息，请明确说明
4. 回答要有条理，使用markdown格式
5. 保持专业性，同时要通俗易懂
${usingKeywordSearch ? '注意：当前使用关键词匹配查找的相关内容，可能不如向量搜索准确。' : ''}`;

      const userPrompt = `基于以下文档内容回答问题：\n\n${contextText}\n\n问题：${question}`;

      const systemTokens = countTokens(systemPrompt);
      const userTokens = countTokens(userPrompt);
      const totalTokens = systemTokens + userTokens;

      console.log(`Token counts - System: ${systemTokens}, User: ${userTokens}, Total: ${totalTokens}`);

      if (totalTokens > MAX_TOTAL_TOKENS) {
        return res.status(400).send("抱歉，问题相关的文档内容太多，超出了处理限制。请尝试将问题拆分为更小的部分。");
      }

      // Ask GPT
      const response = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        model: model,
        temperature: 0.3,
        max_tokens: TOKENS_RESERVE_FOR_ANSWER,
      }).catch(error => {
        console.error('Chat completion API error:', error);
        throw new Error('Failed to generate answer: ' + error.message);
      });

      // 直接返回回答内容
      return res.send(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return res.status(500).send(error.message);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).send(error.message);
  }
}

module.exports = handleAsk;
