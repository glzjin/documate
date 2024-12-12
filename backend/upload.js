const crypto = require('crypto');
const db = require('./db');
const { generateEmbeddings } = require('./generate');

async function handleUpload(req, res) {
  const { operation, project, path, fullPath, content } = req.body;
  
  console.log('Upload request:', {
    operation,
    project,
    path,
    fullPath,
    contentLength: content?.length
  });

  // 检查 operation 是否有效
  if (!['add', 'delete', 'clean', 'generate'].includes(operation)) {
    return res.status(400).json({ error: 'Invalid operation' });
  }

  // clean 和 generate 操作只需要 project 参数
  if (operation === 'clean' || operation === 'generate') {
    try {
      if (operation === 'clean') {
        // 删除项目的所有页面
        await db.query('DELETE FROM pages WHERE project = $1', [project || 'default']);
        return res.json({ message: 'Project cleaned successfully' });
      } else {
        // 生成项目所有页面的向量
        const result = await generateEmbeddings(project || 'default');
        return res.json(result);
      }
    } catch (err) {
      console.error(`Error in ${operation} operation:`, err);
      return res.status(500).json({ error: `Failed to ${operation} project: ${err.message}` });
    }
  }

  // 对于 add 和 delete 操作，检查必需字段
  const missingFields = [];
  if (!path) missingFields.push('path');
  if (operation === 'add' && !content) missingFields.push('content');

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missingFields,
      receivedFields: {
        operation: !!operation,
        project: !!project,
        path: !!path,
        fullPath: !!fullPath,
        content: !!content
      }
    });
  }

  try {
    switch (operation) {
      case 'add': {
        // 计算内容的MD5校验和
        const checksum = crypto.createHash('md5').update(content).digest('hex');

        // 检查是否已存在相同的页面
        try {
          const existingPage = await db.query(
            'SELECT checksum FROM pages WHERE project = $1 AND path = $2 LIMIT 1',
            [project || 'default', path]
          );

          if (existingPage.rows.length > 0 && existingPage.rows[0].checksum === checksum) {
            return res.json({ message: 'Page already exists with same content' });
          }
        } catch (err) {
          console.error('Error checking existing page:', err);
          throw new Error('Failed to check existing page');
        }

        // 删除现有页面（如果存在）
        try {
          await db.query(
            'DELETE FROM pages WHERE project = $1 AND path = $2',
            [project || 'default', path]
          );
        } catch (err) {
          console.error('Error in delete operation:', err);
          throw new Error('Failed to delete existing page');
        }

        // 规范化路径
        const normalizedPath = path.replace(/\\/g, '/');
        const finalPath = fullPath ? fullPath.replace(/\\/g, '/') : normalizedPath;

        // 添加新页面
        try {
          console.log('Inserting page with path:', {
            project: project || 'default',
            path: normalizedPath,
            fullPath: finalPath,
            checksum
          });

          await db.query(
            'INSERT INTO pages (project, path, fullPath, content, checksum) VALUES ($1, $2, $3, $4, $5)',
            [project || 'default', normalizedPath, finalPath, content, checksum]
          );
        } catch (err) {
          console.error('Error in add operation:', err);
          throw new Error('Failed to add new page');
        }

        // 生成嵌入向量
        try {
          await generateEmbeddings(project || 'default');
        } catch (err) {
          console.error('Error generating embeddings:', err);
          throw new Error('Failed to generate embeddings');
        }

        return res.json({ message: 'Page added successfully' });
      }

      case 'delete': {
        try {
          await db.query(
            'DELETE FROM pages WHERE project = $1 AND path = $2',
            [project || 'default', path]
          );
        } catch (err) {
          console.error('Error in delete operation:', err);
          throw new Error('Failed to delete page');
        }

        return res.json({ message: 'Page deleted successfully' });
      }

      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error in upload handler:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = handleUpload;
