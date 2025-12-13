const { getPool } = require('../connection');

class Reaction {
  static async create({ messageId, username, emoji }) {
    const pool = getPool();
    try {
      const result = await pool.query(
        `INSERT INTO reactions (message_id, username, emoji, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, message_id, username, emoji, created_at`,
        [messageId, username, emoji]
      );
      return result.rows[0];
    } catch (error) {
      // Handle duplicate constraint violation (user already reacted with this emoji)
      if (error.code === '23505') {
        return null;
      }
      throw error;
    }
  }

  static async findByMessage(messageId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, message_id, username, emoji, created_at
       FROM reactions
       WHERE message_id = $1
       ORDER BY created_at ASC`,
      [messageId]
    );
    return result.rows;
  }

  static async delete({ messageId, username, emoji }) {
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM reactions
       WHERE message_id = $1 AND username = $2 AND emoji = $3
       RETURNING id`,
      [messageId, username, emoji]
    );
    return result.rows[0] || null;
  }
}

module.exports = Reaction;
