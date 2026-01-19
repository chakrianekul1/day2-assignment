const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://user:password@postgres:5432/splitwise_db'
});
module.exports = pool;