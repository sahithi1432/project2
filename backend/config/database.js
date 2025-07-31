import mysql from 'mysql2';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root', 
  database: process.env.DB_NAME || 'virtual_wall_decor',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool; 