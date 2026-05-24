/**
 * ApiService.js
 * Couche d'accès à l'API Express depuis le frontend.
 * Gère : token JWT, login, register, chargement et sauvegarde cloud.
 */

// En dev : proxy Vite sur /api (vite.config.js)
// En prod : variable VITE_API_URL définie dans GitHub Actions / Render
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY  = 'kuro_jwt';
const USER_KEY   = 'kuro_username';

class ApiService {
  constructor() {
    this._token    = localStorage.getItem(TOKEN_KEY)    || null;
    this._username = localStorage.getItem(USER_KEY)     || null;
    this._saveTimer = null;
  }

  /* ── Getters ── */
  get isLoggedIn() { return !!this._token; }
  get username()   { return this._username; }

  /* ── Auth ── */

  async register(username, password) {
    const data = await this._post('/auth/register', { username, password });
    this._setSession(data.token, data.username);
    return data;
  }

  async login(username, password) {
    const data = await this._post('/auth/login', { username, password });
    this._setSession(data.token, data.username);
    return data;
  }

  logout() {
    this._token    = null;
    this._username = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /* ── Sauvegarde ── */

  async loadSave() {
    if (!this.isLoggedIn) return null;
    try {
      return await this._get('/save');
    } catch {
      return null;
    }
  }

  /** Sauvegarde immédiate */
  async syncNow(collection, progress) {
    if (!this.isLoggedIn) return;
    try {
      await this._post('/save', { collection, progress });
    } catch (e) {
      console.warn('[KuroAPI] sync failed:', e.message);
    }
  }

  /** Sauvegarde dé-bouncée (évite le spam) */
  scheduleSync(collection, progress, delayMs = 1500) {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.syncNow(collection, progress), delayMs);
  }

  /* ── Ping ── */
  async ping() {
    try {
      const r = await fetch(`${API_BASE}/ping`);
      return r.ok;
    } catch {
      return false;
    }
  }

  /* ── Internes ── */

  _setSession(token, username) {
    this._token    = token;
    this._username = username;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY,  username);
  }

  async _get(path) {
    const r = await fetch(`${API_BASE}${path}`, {
      headers: this._authHeaders(),
    });
    const json = await r.json();
    if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
    return json;
  }

  async _post(path, body) {
    const r = await fetch(`${API_BASE}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...this._authHeaders() },
      body:    JSON.stringify(body),
    });
    const json = await r.json();
    if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
    return json;
  }

  _authHeaders() {
    return this._token ? { Authorization: `Bearer ${this._token}` } : {};
  }
}

export const apiService = new ApiService();
