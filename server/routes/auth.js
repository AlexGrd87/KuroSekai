/**
 * routes/auth.js — Inscription & connexion
 */

import { Router }   from 'express';
import bcrypt       from 'bcryptjs';
import jwt          from 'jsonwebtoken';
import db           from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'kuro_sekai_secret_dev_2087';
const SALT_ROUNDS = 10;

const router = Router();

/* ── POST /api/auth/register ── */
router.post('/register', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password)
    return res.status(400).json({ error: 'Pseudo et mot de passe requis.' });

  if (username.length < 3 || username.length > 20)
    return res.status(400).json({ error: 'Pseudo : 3 à 20 caractères.' });

  if (!/^[a-zA-Z0-9_\-]+$/.test(username))
    return res.status(400).json({ error: 'Pseudo : lettres, chiffres, _ et - uniquement.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Mot de passe : 6 caractères minimum.' });

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const stmt = db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    );
    const result = stmt.run(username, hash);
    const userId = result.lastInsertRowid;

    // Crée une save vide pour ce compte
    db.prepare('INSERT INTO saves (user_id) VALUES (?)').run(userId);

    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, username });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Ce pseudo est déjà pris.' });
    }
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ── POST /api/auth/login ── */
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password)
    return res.status(400).json({ error: 'Pseudo et mot de passe requis.' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user)
    return res.status(401).json({ error: 'Pseudo ou mot de passe incorrect.' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok)
    return res.status(401).json({ error: 'Pseudo ou mot de passe incorrect.' });

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.json({ token, username: user.username });
});

export default router;
