/**
 * routes/save.js — Chargement & sauvegarde de la progression
 */

import { Router } from 'express';
import jwt        from 'jsonwebtoken';
import db         from '../db.js';
import { JWT_SECRET } from './auth.js';

const router = Router();

/* ── Middleware d'authentification ── */
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Non authentifié.' });

  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
}

/* ── GET /api/save — Charger la progression ── */
router.get('/', requireAuth, (req, res) => {
  const save = db.prepare('SELECT collection, progress FROM saves WHERE user_id = ?')
    .get(req.user.userId);

  if (!save) return res.status(404).json({ error: 'Aucune sauvegarde trouvée.' });

  res.json({
    collection: JSON.parse(save.collection),
    progress:   JSON.parse(save.progress),
  });
});

/* ── POST /api/save — Écrire la progression ── */
router.post('/', requireAuth, (req, res) => {
  const { collection, progress } = req.body ?? {};

  if (collection === undefined || progress === undefined)
    return res.status(400).json({ error: 'collection et progress requis.' });

  const col = JSON.stringify(collection);
  const prg = JSON.stringify(progress);

  db.prepare(`
    UPDATE saves
    SET collection = ?, progress = ?, updated_at = unixepoch()
    WHERE user_id = ?
  `).run(col, prg, req.user.userId);

  res.json({ ok: true });
});

export default router;
