const { getPool } = require('../connection');

class Reaction {
  static async create({ messageId, username, emoji, userId }) {
    const pool = getPool();
    try {
      const result = await pool.query(
        `INSERT INTO message_reactions (message_id, username, emoji, user_id, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING message_id, username, emoji, created_at`,
        [messageId, username, emoji, userId]
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
      `SELECT message_id, username, emoji, created_at
       FROM message_reactions
       WHERE message_id = $1
       ORDER BY created_at ASC`,
      [messageId]
    );
    return result.rows;
  }

  static async delete({ messageId, username, emoji }) {
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM message_reactions
       WHERE message_id = $1 AND username = $2 AND emoji = $3
       RETURNING message_id`,
      [messageId, username, emoji]
    );
    return result.rows[0] || null;
  }

  static async deleteByUserId({ messageId, userId, emoji }) {
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM message_reactions
       WHERE message_id = $1 AND user_id = $2 AND emoji = $3
       RETURNING message_id`,
      [messageId, userId, emoji]
    );
    return result.rows[0] || null;
  }
}

module.exports = Reaction;
