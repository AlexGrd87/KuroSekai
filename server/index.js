/**
 * server/index.js — Serveur Express KuroSekai
 */

import express  from 'express';
import cors     from 'cors';
import authRoutes from './routes/auth.js';
import saveRoutes from './routes/save.js';

const app  = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    // Autorise les requêtes sans origin (Postman, mobile, etc.)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS bloqué'));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/save', saveRoutes);

app.get('/api/ping', (_req, res) => res.json({ ok: true, time: Date.now() }));

app.listen(PORT, () => {
  console.log(`\x1b[36m[KuroSekai API]\x1b[0m → http://localhost:${PORT}`);
});
