import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

// ── GET /api/categories ───────────────────────────────────
// Returns system defaults + user's own custom categories
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM categories WHERE user_id = ? OR user_id IS NULL ORDER BY type, name',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;