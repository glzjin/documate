const crypto = require('crypto');
const tokenizer = require('gpt-3-encoder');
const { generateEmbeddings } = require('./generate');
const db = require('./db');

const MAX_TOKEN_PER_CHUNK = 8191;

// Split the page content into chunks base on the MAX_TOKEN_PER_CHUNK
function getContentChunks(content) {
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
}

async function handleUpload(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(400).json({
      error: 'Missing OPENAI_API_KEY environment variable',
    });
  }

  const { operation, project = 'default', path, title = '', content = '' } = req.body;

  if (!['add', 'delete', 'clean', 'generate'].includes(operation)) {
    return res.status(400).json({
      error: `Operation ${operation} is not supported`,
    });
  }

  if (operation === 'clean') {
    await db.query('DELETE FROM pages WHERE project = $1', [project]);
    return res.json({ ok: 1 });
  }

  if (operation === 'generate') {
    await generateEmbeddings(project);
    return res.json({ ok: 1 });
  }

  if (!path) {
    return res.status(400).json({
      error: 'Missing path parameter',
    });
  }

  if (operation === 'delete') {
    await db.query('DELETE FROM pages WHERE project = $1 AND path = $2', [project, path]);
    return res.json({ ok: 1 });
  }

  const checksum = crypto.createHash('md5').update(content).digest('hex');
  const existed = await db.query(
    'SELECT checksum FROM pages WHERE project = $1 AND path = $2 LIMIT 1',
    [project, path]
  );

  if (existed.rows.length > 0) {
    if (existed.rows[0].checksum === checksum) {
      return res.json({ ok: 1 });
    } else {
      await db.query('DELETE FROM pages WHERE project = $1 AND path = $2', [project, path]);
    }
  }

  const chunks = getContentChunks(content);
  for (let i = 0; i < chunks.length; i++) {
    await db.query(
      'INSERT INTO pages (project, path, title, checksum, chunk_index, content, embedding) VALUES ($1, $2, $3, $4, $5, $6, NULL)',
      [project, path, title, checksum, i, chunks[i]]
    );
  }

  return res.json({ ok: 1 });
}

module.exports = handleUpload;
