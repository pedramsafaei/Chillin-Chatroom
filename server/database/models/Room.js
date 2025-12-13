const { getPool } = require('../connection');

class Room {
  static async create({ name, description, creator, isPrivate, password }) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO rooms (name, description, creator, is_private, password, member_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW())
       RETURNING id, name, description, creator, is_private, member_count, created_at`,
      [name, description, creator, isPrivate, password]
    );
    return result.rows[0];
  }

  static async findByName(name) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM rooms WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }

  static async findAll() {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, name, description, creator, is_private, member_count, created_at FROM rooms ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async updateMemberCount(name, count) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE rooms 
       SET member_count = $1, updated_at = NOW()
       WHERE name = $2
       RETURNING *`,
      [count, name]
    );
    return result.rows[0] || null;
  }

  static async delete(name) {
    const pool = getPool();
    await pool.query('DELETE FROM rooms WHERE name = $1', [name]);
  }
}

module.exports = Room;
