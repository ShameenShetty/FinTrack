import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

// ── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
    const { full_name, email, password, account_type } = req.body;
    console.log('Registration attempt:', { full_name, email, account_type });

    if (!full_name || !email || !password || !account_type)
        return res.status(400).json({ message: 'All fields are required' });

    try {
        // Check if email already exists
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ?', [email]
        );
        if (existing.length > 0)
            return res.status(409).json({ message: 'Email already registered' });

        const password_hash = await bcrypt.hash(password, 12);

        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, account_type) VALUES (?, ?, ?, ?)',
            [full_name, email, password_hash, account_type]
        );

        res.status(201).json({ message: 'Account created successfully', userId: result.insertId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required' });

    try {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?', [email]
        );
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash)))
            return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, email: user.email, accountType: user.account_type },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            userId: user.id,
            accountType: user.account_type,
            fullName: user.full_name,
            email: user.email
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;