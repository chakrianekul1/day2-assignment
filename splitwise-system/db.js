const { Pool } = require('pg');
const pool = new Pool({
    // In Docker, the host is the name of the service: 'postgres'
    connectionString: process.env.DATABASE_URL || 'postgres://user:password@postgres:5432/splitwise_db'
});
module.exports = pool;