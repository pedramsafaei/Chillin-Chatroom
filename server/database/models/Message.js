const { getPool } = require('../connection');

class Message {
  static async create({ roomName, username, text }) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO messages (room_name, username, text, timestamp)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, room_name, username, text, timestamp`,
      [roomName, username, text]
    );
    return result.rows[0];
  }

  static async findByRoom(roomName, limit = 100) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, room_name, username, text, timestamp
       FROM messages
       WHERE room_name = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [roomName, limit]
    );
    // Return in ascending order (oldest first)
    return result.rows.reverse();
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM messages WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async deleteByRoom(roomName) {
    const pool = getPool();
    await pool.query('DELETE FROM messages WHERE room_name = $1', [roomName]);
  }

  static async delete(id) {
    const pool = getPool();
    await pool.query('DELETE FROM messages WHERE id = $1', [id]);
  }

  static async update(id, { text }) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE messages 
       SET text = $1, is_edited = TRUE, edited_at = NOW()
       WHERE id = $2
       RETURNING id, room_name, username, text, is_edited, edited_at, timestamp`,
      [text, id]
    );
    return result.rows[0] || null;
  }

  static async findByIdWithDetails(id) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, room_name, username, text, type, reply_to_id, 
              is_edited, edited_at, is_deleted, timestamp
       FROM messages 
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Message;
