const { getPool } = require('./connection');

const runMigrations = async () => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on username for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Create rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
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

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room_name VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_name) REFERENCES rooms(name) ON DELETE CASCADE
      );
    `);

    // Create indexes for efficient message queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_room_timestamp 
      ON messages(room_name, timestamp DESC);
    `);

    // Create reactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL,
        username VARCHAR(50) NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        UNIQUE(message_id, username, emoji)
      );
    `);

    // Create index for reactions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reactions_message 
      ON reactions(message_id);
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
