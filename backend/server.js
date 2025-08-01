import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import wallRoutes from './routes/wall.js';
import pool from './config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '20mb' }));
app.use(express.urlencoded({ limit: process.env.MAX_FILE_SIZE || '20mb', extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/wall', wallRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running successfully!' });
});

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Add this function to test MySQL connection
async function testDatabaseConnection() {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Unable to connect to the database:', err);
        reject(err);
        process.exit(1);
      } else {
        console.log('Database connection has been established successfully.');
        connection.release();
        resolve();
      }
    });
  });
}

async function startServer() {
  await testDatabaseConnection();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

startServer(); 