const { getPool } = require('../connection');

class Attachment {
  static async create({ messageId, fileName, fileSize, mimeType, url, thumbnailUrl, width, height }) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO attachments (message_id, file_name, file_size, mime_type, url, thumbnail_url, width, height, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, message_id, file_name, file_size, mime_type, url, thumbnail_url, width, height, created_at`,
      [messageId, fileName, fileSize, mimeType, url, thumbnailUrl, width, height]
    );
    return result.rows[0];
  }

  static async findByMessage(messageId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, message_id, file_name, file_size, mime_type, url, thumbnail_url, width, height, created_at
       FROM attachments
       WHERE message_id = $1
       ORDER BY created_at ASC`,
      [messageId]
    );
    return result.rows;
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM attachments WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const pool = getPool();
    await pool.query('DELETE FROM attachments WHERE id = $1', [id]);
  }
}

module.exports = Attachment;
