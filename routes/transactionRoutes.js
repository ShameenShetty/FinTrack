import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

// ── GET /api/transactions ─────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT t.*, c.name AS category_name, c.type AS category_type
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = ?
             ORDER BY t.date DESC, t.id DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── POST /api/transactions ────────────────────────────────
router.post('/', async (req, res) => {
    const { category_id, type, amount, description, date, payment_method, status } = req.body;

    if (!type || !amount || !date)
        return res.status(400).json({ message: 'type, amount and date are required' });

    try {
        const [result] = await pool.query(
            'INSERT INTO transactions (user_id, category_id, type, amount, description, date, status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, category_id || null, type, amount, description || null, date, status || 'completed', payment_method || null]
        );
        res.status(201).json({ message: 'Transaction added', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── DELETE /api/transactions/:id ──────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ message: 'Transaction not found' });

        res.json({ message: 'Transaction deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/transactions/summary
router.get('/summary', async (req, res) => {
    const userId = req.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    try {
        const [[income]] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total
             FROM transactions
             WHERE user_id = ? AND type = 'income'
             AND MONTH(date) = ? AND YEAR(date) = ?`,
            [userId, month, year]
        );
        const [[expenses]] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total
             FROM transactions
             WHERE user_id = ? AND type = 'expense'
             AND MONTH(date) = ? AND YEAR(date) = ?`,
            [userId, month, year]
        );
        const [[balance]] = await pool.query(
            `SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) AS total
             FROM transactions WHERE user_id = ?`,
            [userId]
        );
        const [recent] = await pool.query(
            `SELECT t.description, t.amount, t.type, t.date, c.name AS category
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = ?
             ORDER BY t.date DESC LIMIT 5`,
            [userId]
        );

        res.json({
            monthlyIncome: income.total,
            monthlyExpenses: expenses.total,
            totalBalance: balance.total,
            savings: income.total - expenses.total,
            recentTransactions: recent
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;