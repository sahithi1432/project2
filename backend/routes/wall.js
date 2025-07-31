import express from 'express';
import pool from '../config/database.js';
import crypto from 'crypto';
import { authenticateToken } from './auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [designs] = await pool.promise().execute('SELECT * FROM wall_designs ORDER BY created_at DESC');
    res.json(designs);
  } catch (error) {
    console.error('Get all wall designs error:', error);
    res.status(500).json({ message: 'Error fetching wall designs' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [designs] = await pool.promise().execute(
      'SELECT * FROM wall_designs WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json(designs);
  } catch (error) {
    console.error('Get wall designs error:', error);
    res.status(500).json({ message: 'Error fetching wall designs' });
  }
});




router.post('/save', async (req, res) => {
  try {
    const { userId, wallData, wallName } = req.body;
    if (!userId || !wallData || !wallName) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId, wallData, wallName' 
      });
    }
    let jsonData;
    try {
      jsonData = JSON.stringify(wallData);
    } catch (jsonError) {
      console.error('JSON serialization failed:', jsonError);
      return res.status(400).json({ 
        message: 'Invalid wall data: Cannot serialize to JSON',
        error: jsonError.message 
      });
    }
    const [result] = await pool.promise().execute(
      'INSERT INTO wall_designs (user_id, wall_name, wall_data) VALUES (?, ?, ?)',
      [userId, wallName, jsonData]
    );
    res.status(201).json({
      message: 'Wall design saved successfully',
      wallId: result.insertId
    });
  } catch (error) {
    console.error('================ BACKEND ERROR ================');
    console.error('Save wall design error:', error);
    console.error(error.stack);
    res.status(500).json({ message: 'Error saving wall design', error: error.message });
  }
});


router.get('/:designId', async (req, res) => {
  try {
    const { designId } = req.params;

    const [designs] = await pool.promise().execute(
      'SELECT * FROM wall_designs WHERE id = ?',
      [designId]
    );

    if (designs.length === 0) {
      return res.status(404).json({ message: 'Wall design not found' });
    }

    res.json(designs[0]);
  } catch (error) {
    console.error('Get wall design error:', error);
    res.status(500).json({ message: 'Error fetching wall design' });
  }
});


router.put('/:designId', async (req, res) => {
  try {
    const { designId } = req.params;
    const { wallData, wallName } = req.body;

 
    if (!wallData || !wallName) {
      return res.status(400).json({ 
        message: 'Missing required fields: wallData, wallName' 
      });
    }

    
    const [existingDesigns] = await pool.promise().execute(
      'SELECT * FROM wall_designs WHERE id = ?',
      [designId]
    );

    if (existingDesigns.length === 0) {
      return res.status(404).json({ message: 'Wall design not found' });
    }

    
    const [result] = await pool.promise().execute(
      'UPDATE wall_designs SET wall_name = ?, wall_data = ?, updated_at = NOW() WHERE id = ?',
      [wallName, JSON.stringify(wallData), designId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Wall design not found or no changes made' });
    }

    res.json({ 
      message: 'Wall design updated successfully',
      designId: designId,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Update wall design error:', error);
    res.status(500).json({ 
      message: 'Error updating wall design', 
      error: error.message,
      stack: error.stack 
    });
  }
});


router.delete('/:designId', async (req, res) => {
  try {
    const { designId } = req.params;

    const [result] = await pool.promise().execute(
      'DELETE FROM wall_designs WHERE id = ?',
      [designId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Wall design not found' });
    }

    res.json({ message: 'Wall design deleted successfully' });
  } catch (error) {
    console.error('Delete wall design error:', error);
    res.status(500).json({ message: 'Error deleting wall design' });
  }
});

// Generate or fetch share token for an altar
router.post('/:designId/share', async (req, res) => {
  try {
    const { designId } = req.params;
    // Check if already has a share_token
    const [rows] = await pool.promise().execute('SELECT share_token FROM wall_designs WHERE id = ?', [designId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Altar not found' });
    let token = rows[0].share_token;
    if (!token) {
      token = crypto.randomBytes(24).toString('hex');
      await pool.promise().execute('UPDATE wall_designs SET share_token = ? WHERE id = ?', [token, designId]);
    }
    res.json({ share_token: token });
  } catch (error) {
    console.error('Share token error:', error);
    res.status(500).json({ message: 'Error generating share token' });
  }
});

// Fetch altar by share token (read-only)
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const [rows] = await pool.promise().execute('SELECT * FROM wall_designs WHERE share_token = ?', [token]);
    if (rows.length === 0) return res.status(404).json({ message: 'Altar not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Fetch by share token error:', error);
    res.status(500).json({ message: 'Error fetching altar by token' });
  }
});

// Toggle public/private status of an altar
router.put('/:id/public', async (req, res) => {
  const { public: isPublic } = req.body;
  const altarId = req.params.id;
  await pool.promise().execute('UPDATE wall_designs SET public = ? WHERE id = ?', [isPublic, altarId]);
  res.json({ message: 'Public status updated' });
});

// Generate or fetch edit token for an altar
router.post('/:designId/edit-share', async (req, res) => {
  try {
    const { designId } = req.params;
    // Check if already has an edit_token
    const [rows] = await pool.promise().execute('SELECT edit_token FROM wall_designs WHERE id = ?', [designId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Altar not found' });
    let token = rows[0].edit_token;
    if (!token) {
      token = crypto.randomBytes(24).toString('hex');
      await pool.promise().execute('UPDATE wall_designs SET edit_token = ? WHERE id = ?', [token, designId]);
    }
    res.json({ edit_token: token });
  } catch (error) {
    console.error('Edit token error:', error);
    res.status(500).json({ message: 'Error generating edit token' });
  }
});

// Fetch altar by edit token (for edit mode)
router.get('/edit/:editToken', async (req, res) => {
  try {
    const { editToken } = req.params;
    const [rows] = await pool.promise().execute('SELECT * FROM wall_designs WHERE edit_token = ?', [editToken]);
    if (rows.length === 0) return res.status(404).json({ message: 'Altar not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Fetch by edit token error:', error);
    res.status(500).json({ message: 'Error fetching altar by edit token' });
  }
});

// Update altar by edit token (for edit mode sharing)
router.put('/edit/:editToken', async (req, res) => {
  try {
    const { editToken } = req.params;
    const { wallData, wallName } = req.body;
    if (!wallData || !wallName) {
      return res.status(400).json({ message: 'Missing required fields: wallData, wallName' });
    }
    const [existingDesigns] = await pool.promise().execute('SELECT * FROM wall_designs WHERE edit_token = ?', [editToken]);
    if (existingDesigns.length === 0) {
      return res.status(404).json({ message: 'Wall design not found' });
    }
    const [result] = await pool.promise().execute(
      'UPDATE wall_designs SET wall_name = ?, wall_data = ?, updated_at = NOW() WHERE edit_token = ?',
      [wallName, JSON.stringify(wallData), editToken]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Wall design not found or no changes made' });
    }
    res.json({ message: 'Wall design updated successfully', affectedRows: result.affectedRows });
  } catch (error) {
    console.error('Update by edit token error:', error);
    res.status(500).json({ message: 'Error updating wall design by edit token', error: error.message });
  }
});

// GET /api/wall/history/:userId
router.get('/history/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const requester = req.user; // { userId, role }

  // Get the user's privacy setting
  const [users] = await pool.promise().execute(
    'SELECT profile_public FROM users WHERE id = ?',
    [userId]
  );
  if (users.length === 0) return res.status(404).json({ message: 'User not found' });

  const isOwner = requester.userId == userId;
  const isAdmin = requester.role === 'admin';
  const isPublic = users[0].profile_public === 1;

  if (!isPublic && !isOwner && !isAdmin) {
    return res.status(403).json({ message: "This user's history is private." });
  }

  // Fetch and return the user's history (replace with your actual logic)
  const [history] = await pool.promise().execute(
    'SELECT * FROM wall_designs WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  res.json({ history });
});

export default router; 