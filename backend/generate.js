// @see https://docs.aircode.io/guide/functions/
const OpenAI = require('openai');
const db = require('./db');

async function generateEmbeddings(project) {
  // Find all the pages without embeddings
  const result = await db.query(
    'SELECT * FROM pages WHERE project = $1 AND embedding IS NULL',
    [project]
  );
  const pages = result.rows;

  if (!pages || pages.length === 0) {
    return { ok: 1 };
  }

  // Replace newlines with spaces for OpenAI embeddings
  const input = pages.map(page => page.content.replace(/\n/g, ' '));
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  
    const { data, usage } = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input,
    });

    // Update embeddings in batches
    for (let i = 0; i < pages.length; i++) {
      await db.query(
        'UPDATE pages SET embedding = $1 WHERE id = $2',
        [data[i].embedding, pages[i].id]
      );
    }
  
    return { ok: 1 };
  } catch (error) {
    console.error(`Failed to generate embeddings for ${project}`);
    throw error;
  }
}

module.exports = {
  generateEmbeddings,
}
