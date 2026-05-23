/**
 * server/index.js — Serveur Express KuroSekai
 */

import express  from 'express';
import cors     from 'cors';
import authRoutes from './routes/auth.js';
import saveRoutes from './routes/save.js';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/save', saveRoutes);

app.get('/api/ping', (_req, res) => res.json({ ok: true, time: Date.now() }));

app.listen(PORT, () => {
  console.log(`\x1b[36m[KuroSekai API]\x1b[0m → http://localhost:${PORT}`);
});
