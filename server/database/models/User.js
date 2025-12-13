const { getPool } = require('../connection');

class User {
  static async create({ username, password, email, avatar }) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO users (username, password, email, avatar, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, username, email, avatar, created_at`,
      [username, password, email, avatar]
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

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
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
       RETURNING id, username, email, avatar, updated_at`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(username) {
    const pool = getPool();
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
  }
}

module.exports = User;
