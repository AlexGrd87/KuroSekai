/**
 * profileData.js — Avatars, cadres et persistance du profil joueur.
 */

export const PROFILE_KEY = 'kuro_profile';

/* ═══════════════════════════════════════
   AVATARS (kanji)
═══════════════════════════════════════ */

export const AVATAR_OPTIONS = [
  { id: 'kuro',   kanji: '黒', label: 'Kuro',   color: '#00d4ff', glow: 'rgba(0,212,255,0.45)',   cost: 0    },
  { id: 'ken',    kanji: '剣', label: 'Ken',    color: '#ff4466', glow: 'rgba(255,50,80,0.45)',    cost: 0    },
  { id: 'hono',   kanji: '炎', label: 'Honō',   color: '#ff8800', glow: 'rgba(255,130,0,0.45)',   cost: 0    },
  { id: 'yami',   kanji: '闇', label: 'Yami',   color: '#aa44ff', glow: 'rgba(160,50,255,0.45)',  cost: 0    },
  { id: 'hikari', kanji: '光', label: 'Hikari', color: '#ffffaa', glow: 'rgba(255,255,150,0.45)', cost: 0    },
  { id: 'ryuu',   kanji: '龍', label: 'Ryū',    color: '#00ff88', glow: 'rgba(0,255,136,0.45)',   cost: 1000 },
  { id: 'kami',   kanji: '神', label: 'Kami',   color: '#ffdd00', glow: 'rgba(255,220,0,0.45)',   cost: 2000 },
  { id: 'sora',   kanji: '空', label: 'Sora',   color: '#88ccff', glow: 'rgba(100,180,255,0.45)', cost: 1500 },
  { id: 'hoshi',  kanji: '星', label: 'Hoshi',  color: '#ffaaff', glow: 'rgba(255,150,255,0.45)', cost: 2500 },
  { id: 'kage',   kanji: '影', label: 'Kage',   color: '#7799bb', glow: 'rgba(80,120,180,0.45)',  cost: 3000 },
];

/* ═══════════════════════════════════════
   CADRES
═══════════════════════════════════════ */

export const FRAME_OPTIONS = [
  {
    id: 'default',
    label: 'Standard',
    desc: 'Anneau simple',
    cost: 0,
    preview: 'linear-gradient(135deg,#00d4ff,#0099bb)',
  },
  {
    id: 'tech',
    label: 'Techno',
    desc: 'Double anneau pointillé',
    cost: 0,
    preview: 'linear-gradient(135deg,#00d4ff,#004488)',
  },
  {
    id: 'fire',
    label: 'Flammes',
    desc: 'Anneau de feu animé',
    cost: 500,
    preview: 'linear-gradient(135deg,#ff4400,#ffaa00)',
  },
  {
    id: 'void',
    label: 'Abîme',
    desc: 'Pulsation violette du vide',
    cost: 800,
    preview: 'linear-gradient(135deg,#aa44ff,#440088)',
  },
  {
    id: 'gold',
    label: 'Or',
    desc: 'Double anneau doré',
    cost: 1500,
    preview: 'linear-gradient(135deg,#ffcc00,#aa8800)',
  },
  {
    id: 'dragon',
    label: 'Dragon',
    desc: 'Anneau émeraude du dragon',
    cost: 2000,
    preview: 'linear-gradient(135deg,#00ff88,#007744)',
  },
  {
    id: 'celeste',
    label: 'Céleste',
    desc: 'Shimmer blanc stellaire',
    cost: 3000,
    preview: 'linear-gradient(135deg,#ffffff,#aaccff)',
  },
];

/* ═══════════════════════════════════════
   PERSISTANCE
═══════════════════════════════════════ */

const FREE_AVATARS = AVATAR_OPTIONS.filter(a => a.cost === 0).map(a => a.id);
const FREE_FRAMES  = FRAME_OPTIONS .filter(f => f.cost === 0).map(f => f.id);

export function loadProfile() {
  try {
    const raw  = localStorage.getItem(PROFILE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      name:             data.name             ?? 'COMMANDANT',
      avatarId:         data.avatarId         ?? 'kuro',
      frameId:          data.frameId          ?? 'default',
      unlockedAvatars:  data.unlockedAvatars  ?? [...FREE_AVATARS],
      unlockedFrames:   data.unlockedFrames   ?? [...FREE_FRAMES],
    };
  } catch {
    return {
      name: 'COMMANDANT', avatarId: 'kuro', frameId: 'default',
      unlockedAvatars: [...FREE_AVATARS], unlockedFrames: [...FREE_FRAMES],
    };
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getAvatar(id) {
  return AVATAR_OPTIONS.find(a => a.id === id) ?? AVATAR_OPTIONS[0];
}

export function getFrame(id) {
  return FRAME_OPTIONS.find(f => f.id === id) ?? FRAME_OPTIONS[0];
}
