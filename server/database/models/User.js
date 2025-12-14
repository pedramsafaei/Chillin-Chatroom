const { getPool } = require('../connection');
const crypto = require('crypto');

class User {
  static async create({ username, password, email, avatar, displayName, isGuest = false }) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO users (username, password, email, avatar, display_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, username, email, avatar, display_name, status, status_message, created_at`,
      [username, password, email, avatar, displayName || username]
    );
    return result.rows[0];
  }

  static async findByUsername(username) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, username, email, avatar, display_name, avatar_url, status, status_message, last_seen_at, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async update(username, updates) {
    const pool = getPool();
    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      setClause.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    values.push(username);
    const result = await pool.query(
      `UPDATE users 
       SET ${setClause.join(', ')}, updated_at = NOW()
       WHERE username = $${paramCount}
       RETURNING id, username, email, avatar, display_name, avatar_url, status, status_message, updated_at`,
      values
    );
    return result.rows[0] || null;
  }

  static async updateById(id, updates) {
    const pool = getPool();
    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      setClause.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    values.push(id);
    const result = await pool.query(
      `UPDATE users 
       SET ${setClause.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, username, email, avatar, display_name, avatar_url, status, status_message, updated_at`,
      values
    );
    return result.rows[0] || null;
  }

  static async getUserRooms(userId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT r.id, r.name, r.slug, r.description, r.theme_color, r.icon, 
              r.is_private, r.member_count, r.created_at,
              rm.role, rm.notifications, rm.joined_at, rm.last_read_at
       FROM rooms r
       INNER JOIN room_members rm ON r.id = rm.room_id
       WHERE rm.user_id = $1
       ORDER BY rm.last_read_at DESC NULLS LAST, r.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async delete(username) {
    const pool = getPool();
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
  }

  static hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  static verifyPassword(password, hashedPassword) {
    const hash = this.hashPassword(password);
    return hash === hashedPassword;
  }
}

module.exports = User;
