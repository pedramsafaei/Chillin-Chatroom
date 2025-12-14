const { getPool } = require('../connection');

class Room {
  static async create({ name, description, creator, isPrivate, password, themeColor, icon, type, maxMembers }) {
    const pool = getPool();
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    const result = await pool.query(
      `INSERT INTO rooms (name, slug, description, creator, is_private, password, theme_color, icon, max_members, member_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, NOW(), NOW())
       RETURNING id, name, slug, description, creator, is_private, theme_color, icon, max_members, member_count, created_at`,
      [name, slug, description, creator, isPrivate || false, password, themeColor, icon, maxMembers]
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

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM rooms WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll({ page = 1, limit = 20, sort = 'created_at', category = null }) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, name, slug, description, creator, theme_color, icon, 
             is_private, member_count, created_at, updated_at
      FROM rooms
      WHERE is_archived = FALSE
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (category) {
      query += ` AND settings->>'category' = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    // Sort order
    const sortField = sort === 'members' ? 'member_count' : 'created_at';
    query += ` ORDER BY ${sortField} DESC`;
    
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM rooms WHERE is_archived = FALSE';
    const countParams = [];
    if (category) {
      countQuery += ' AND settings->\'category\' = $1';
      countParams.push(category);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    return {
      rooms: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
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

  static async updateById(id, updates) {
    const pool = getPool();
    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'settings') {
        setClause.push(`settings = settings || $${paramCount}::jsonb`);
        values.push(JSON.stringify(value));
      } else {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
      }
      paramCount++;
    });

    values.push(id);
    const result = await pool.query(
      `UPDATE rooms 
       SET ${setClause.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, name, slug, description, theme_color, icon, is_private, member_count, settings, updated_at`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const pool = getPool();
    await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
  }

  static async deleteByName(name) {
    const pool = getPool();
    await pool.query('DELETE FROM rooms WHERE name = $1', [name]);
  }

  static async addMember(roomId, userId, role = 'member') {
    const pool = getPool();
    try {
      const result = await pool.query(
        `INSERT INTO room_members (room_id, user_id, role, joined_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (room_id, user_id) DO NOTHING
         RETURNING *`,
        [roomId, userId, role]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error adding room member:', error);
      throw error;
    }
  }

  static async removeMember(roomId, userId) {
    const pool = getPool();
    await pool.query(
      'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
  }

  static async getMembers(roomId, { status = null, page = 1, limit = 50 }) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT u.id, u.username, u.display_name, u.avatar, u.avatar_url, u.status,
             rm.role, rm.joined_at, rm.nickname
      FROM room_members rm
      INNER JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $1
    `;
    
    const params = [roomId];
    let paramCount = 2;
    
    if (status) {
      query += ` AND u.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY rm.joined_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM room_members rm INNER JOIN users u ON rm.user_id = u.id WHERE rm.room_id = $1';
    const countParams = [roomId];
    if (status) {
      countQuery += ' AND u.status = $2';
      countParams.push(status);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    return {
      members: result.rows,
      total
    };
  }

  static async getRoomWithCounts(id) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT r.*, 
              (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count,
              (SELECT COUNT(*) FROM room_members rm 
               INNER JOIN users u ON rm.user_id = u.id 
               WHERE rm.room_id = r.id AND u.status = 'online') as online_count
       FROM rooms r
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Room;
