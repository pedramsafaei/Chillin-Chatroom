const { getPool } = require('./connection');

const runMigrations = async () => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create users table with enhanced fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        avatar TEXT,
        display_name VARCHAR(100),
        avatar_url TEXT,
        status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
        status_message TEXT,
        last_seen_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes on users table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status != 'offline';
    `);

    // Create rooms table with enhanced fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(120) UNIQUE NOT NULL,
        description TEXT,
        theme_color VARCHAR(7),
        icon VARCHAR(50),
        max_members INTEGER,
        is_archived BOOLEAN DEFAULT FALSE,
        settings JSONB DEFAULT '{}'::jsonb,
        creator VARCHAR(50),
        is_private BOOLEAN DEFAULT FALSE,
        password VARCHAR(255),
        member_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on room name for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms(name);
    `);

    // Create room_members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_members (
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
        nickname VARCHAR(100),
        notifications VARCHAR(20) DEFAULT 'all' CHECK (notifications IN ('all', 'mentions', 'none')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_read_at TIMESTAMP,
        PRIMARY KEY (room_id, user_id),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create messages table with enhanced fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER,
        user_id INTEGER,
        room_name VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system', 'voice')),
        reply_to_id INTEGER,
        metadata JSONB DEFAULT '{}'::jsonb,
        is_edited BOOLEAN DEFAULT FALSE,
        edited_at TIMESTAMP,
        is_deleted BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
      );
    `);

    // Create indexes for efficient message queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_room_created 
      ON messages(room_id, created_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_reply 
      ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
    `);

    // Create message_reactions table (renamed from reactions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        message_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        username VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (message_id, user_id, emoji),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create index for message_reactions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_message_reactions_message 
      ON message_reactions(message_id);
    `);

    // Create attachments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        width INTEGER,
        height INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      );
    `);

    // Create index for attachments
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attachments_message 
      ON attachments(message_id);
    `);

    // Create sessions table for Redis backup
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        socket_id VARCHAR(255),
        room_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for session lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_username 
      ON sessions(username);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_room 
      ON sessions(room_name);
    `);

    await client.query('COMMIT');
    console.log('Database migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { runMigrations };
