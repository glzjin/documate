const crypto = require('crypto');
const tokenizer = require('gpt-3-encoder');
const { generateEmbeddings } = require('./generate');
const db = require('./db');

const MAX_TOKEN_PER_CHUNK = 8191;

// Split the page content into chunks base on the MAX_TOKEN_PER_CHUNK
function getContentChunks(content) {
  try {
    const encoded = tokenizer.encode(content);
    const tokenChunks = encoded.reduce(
      (acc, token) => (
        acc[acc.length - 1].length < MAX_TOKEN_PER_CHUNK
          ? acc[acc.length - 1].push(token)
          : acc.push([token]),
        acc
      ),
      [[]],
    );
    return tokenChunks.map(tokens => tokenizer.decode(tokens));
  } catch (error) {
    console.error('Error in getContentChunks:', error);
    return [content]; // 如果分块失败，返回原始内容作为单个块
  }
}

async function handleUpload(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json('Missing OPENAI_API_KEY environment variable');
    }

    const { 
      operation, 
      project = 'default', 
      path, 
      title = '', 
      content = '',
      embeddingModel = process.env.OPENAI_EMBEDDING_MODEL 
    } = req.body;

    if (!['add', 'delete', 'clean', 'generate'].includes(operation)) {
      return res.status(400).json('Operation not supported');
    }

    if (operation === 'clean') {
      try {
        await db.query('DELETE FROM pages WHERE project = $1', [project]);
        return res.json({ ok: 1 });
      } catch (error) {
        console.error('Error cleaning project:', error);
        return res.status(500).send('Failed to clean project: ' + error.message);
      }
    }

    if (operation === 'generate') {
      try {
        const result = await generateEmbeddings(project, embeddingModel);
        if (!result.ok) {
          return res.status(500).send('Failed to generate embeddings: ' + result.error);
        }
        return res.json(result);
      } catch (error) {
        console.error('Error generating embeddings:', error);
        return res.status(500).send('Failed to generate embeddings: ' + error.message);
      }
    }

    if (!path) {
      return res.status(400).json('Missing path parameter');
    }

    if (operation === 'delete') {
      try {
        await db.query('DELETE FROM pages WHERE project = $1 AND path = $2', [project, path]);
        return res.json({ ok: 1 });
      } catch (error) {
        console.error('Error deleting page:', error);
        return res.status(500).send('Failed to delete page: ' + error.message);
      }
    }

    // Add operation
    try {
      const checksum = crypto.createHash('md5').update(content).digest('hex');
      
      // Check if page exists
      const existed = await db.query(
        'SELECT checksum FROM pages WHERE project = $1 AND path = $2 LIMIT 1',
        [project, path]
      ).catch(error => {
        console.error('Error checking existing page:', error);
        throw new Error('Failed to check existing page');
      });

      if (existed.rows.length > 0) {
        if (existed.rows[0].checksum === checksum) {
          return res.json({ ok: 1 });
        } else {
          await db.query('DELETE FROM pages WHERE project = $1 AND path = $2', [project, path])
            .catch(error => {
              console.error('Error deleting existing page:', error);
              throw new Error('Failed to delete existing page');
            });
        }
      }

      const chunks = getContentChunks(content);
      for (let i = 0; i < chunks.length; i++) {
        await db.query(
          'INSERT INTO pages (project, path, title, checksum, chunk_index, content, embedding) VALUES ($1, $2, $3, $4, $5, $6, NULL)',
          [project, path, title, checksum, i, chunks[i]]
        ).catch(error => {
          console.error(`Error inserting chunk ${i}:`, error);
          throw new Error(`Failed to insert chunk ${i}`);
        });
      }

      return res.json({ ok: 1 });
    } catch (error) {
      console.error('Error in add operation:', error);
      return res.status(500).send('Failed to add page: ' + error.message);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).send('Internal server error: ' + error.message);
  }
}

module.exports = handleUpload;
