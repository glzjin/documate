const OpenAI = require('openai');
const { OpenAIStream } = require('ai');
const db = require('./db');

const MAX_CONTEXT_TOKEN = 1500;

async function handleAsk(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(400).json({
      error: 'Missing OPENAI_API_KEY environment variable',
    });
  }

  const { question, project = 'default' } = req.body;

  if (!question) {
    return res.status(400).json({
      error: 'Missing question parameter',
    });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Moderate the content
    const { results: moderationRes } = await openai.moderations.create({
      input: question.trim(),
    });

    if (moderationRes[0].flagged) {
      return res.status(403).json({
        error: 'Question input didn\'t meet the moderation criteria.',
        categories: moderationRes[0].categories,
      });
    }

    // Create embedding from the question
    const { data: [{ embedding }] } = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: question.replace(/\n/g, ' '),
    });

    // Search similar vectors using cosine similarity
    const result = await db.query(
      `SELECT content FROM pages 
       WHERE project = $1 
       ORDER BY embedding <=> $2 
       LIMIT 10`,
      [project, embedding]
    );

    let contextSections = result.rows
      .map(row => `${row.content.trim()}\n---\n`)
      .join('');

    // Ask GPT
    const prompt = `You are a very kindly assistant who loves to help people. Given the following sections from documatation, answer the question using only that information, outputted in markdown format. If you are unsure and the answer is not explicitly written in the documentation, say "Sorry, I don't know how to help with that." Always trying to anwser in the spoken language of the questioner.

Context sections:
${contextSections}

Question:
${question}

Answer as markdown (including related code snippets if available):`;

    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      max_tokens: 512,
      temperature: 0.4,
      stream: true,
    });

    const stream = OpenAIStream(response);
    return stream.pipe(res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Failed to generate answer.',
    });
  }
}

module.exports = handleAsk;
