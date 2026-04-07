import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

// ── GET /api/budgets ──────────────────────────────────────
router.get('/', async (req, res) => {
    const { month, year } = req.query;
    try {
        const [rows] = await pool.query(
            `SELECT b.*, c.name AS category_name
             FROM budgets b
             JOIN categories c ON b.category_id = c.id
             WHERE b.user_id = ? AND b.month = ? AND b.year = ?`,
            [req.user.id, month, year]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── POST /api/budgets ─────────────────────────────────────
router.post('/', async (req, res) => {
    const { category_id, amount_limit, month, year } = req.body;
    try {
        await pool.query(
            `INSERT INTO budgets (user_id, category_id, amount_limit, month, year)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE amount_limit = VALUES(amount_limit)`,
            [req.user.id, category_id, amount_limit, month, year]
        );
        res.status(201).json({ message: 'Budget saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;