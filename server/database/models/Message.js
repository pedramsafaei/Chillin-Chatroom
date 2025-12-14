const { getPool } = require('../connection');

class Message {
  static async create({ roomName, username, text, roomId, userId, type = 'text' }) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO messages (room_name, username, text, room_id, user_id, type, timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, room_name, username, text, type, timestamp, created_at`,
      [roomName, username, text, roomId, userId, type]
    );
    return result.rows[0];
  }

  static async findByRoom(roomName, limit = 100) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, room_name, username, text, type, timestamp, is_edited, edited_at
       FROM messages
       WHERE room_name = $1 AND is_deleted = FALSE
       ORDER BY timestamp DESC
       LIMIT $2`,
      [roomName, limit]
    );
    // Return in ascending order (oldest first)
    return result.rows.reverse();
  }

  static async findByRoomId(roomId, { before = null, limit = 50 }) {
    const pool = getPool();
    
    let query = `
      SELECT m.id, m.room_name, m.username, m.text, m.type, m.timestamp, 
             m.is_edited, m.edited_at, m.reply_to_id, m.metadata,
             u.display_name, u.avatar, u.avatar_url
      FROM messages m
      INNER JOIN users u ON m.user_id = u.id
      WHERE m.room_id = $1 AND m.is_deleted = FALSE
    `;
    
    const params = [roomId];
    let paramCount = 2;
    
    if (before) {
      query += ` AND m.id < $${paramCount}`;
      params.push(before);
      paramCount++;
    }
    
    query += ` ORDER BY m.timestamp DESC LIMIT $${paramCount}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    
    return {
      messages: result.rows.reverse(),
      hasMore: result.rows.length === limit
    };
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT m.*, u.display_name, u.avatar, u.avatar_url
       FROM messages m
       INNER JOIN users u ON m.user_id = u.id
       WHERE m.id = $1 AND m.is_deleted = FALSE`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async update(id, text) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE messages 
       SET text = $1, is_edited = TRUE, edited_at = NOW()
       WHERE id = $2 AND is_deleted = FALSE
       RETURNING id, room_name, username, text, type, timestamp, is_edited, edited_at`,
      [text, id]
    );
    return result.rows[0] || null;
  }

  static async deleteByRoom(roomName) {
    const pool = getPool();
    await pool.query('DELETE FROM messages WHERE room_name = $1', [roomName]);
  }

  static async delete(id) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE messages 
       SET is_deleted = TRUE
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async hardDelete(id) {
    const pool = getPool();
    await pool.query('DELETE FROM messages WHERE id = $1', [id]);
  }
}

module.exports = Message;
