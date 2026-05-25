/**
 * events.js — Événements temporaires de KuroSekai.
 * Chaque événement a une durée fixe, des quêtes dédiées et des récompenses de complétion.
 */

export const EVENTS = [
  {
    id:          'event_kira_2026',
    name:        'PROTOCOLE NÉANT',
    nameJp:      '虚無の覚醒',
    kanji:       '虚',
    description: "L'Unité KIRA s'est éveillée. Prouvez votre valeur pour décrocher ses faveurs et réclamer les récompenses de l'opération.",
    color:       '#cc00ff',
    colorDim:    '#440066',
    bannerId:    'event_kira',
    startTime:   new Date('2026-05-24T00:00:00Z').getTime(),
    endTime:     new Date('2026-06-07T00:00:00Z').getTime(),
    quests: [
      {
        id: 'ev_kira_combat5',  type: 'COMBAT_WIN',
        icon: '⚔', name: 'Protocole Assaut',
        desc: 'Remporter 5 combats',
        target: 5,  rewards: { currency: 800 },
      },
      {
        id: 'ev_kira_summon3',  type: 'SUMMON',
        icon: '✦', name: 'Résonance Bionique',
        desc: 'Effectuer 3 invocations',
        target: 3,  rewards: { currency: 500, freeRolls: 1 },
      },
      {
        id: 'ev_kira_stage2',   type: 'STAGE_COMPLETE',
        icon: '地', name: 'Terrain Zéro',
        desc: 'Compléter 2 stages',
        target: 2,  rewards: { currency: 600 },
      },
    ],
    completion: { currency: 2000, freeRolls: 1 },
  },
  {
    id:          'event_seraph_2026',
    name:        'AILE BRISÉE',
    nameJp:      '堕ちた天使',
    kanji:       '光',
    description: 'SERAPH descend des cieux brisés. Relevez ses épreuves pour mériter sa grâce et les récompenses célestes.',
    color:       '#aaaaff',
    colorDim:    '#222255',
    bannerId:    'event_seraph',
    startTime:   new Date('2026-06-07T00:00:00Z').getTime(),
    endTime:     new Date('2026-06-21T00:00:00Z').getTime(),
    quests: [
      {
        id: 'ev_seraph_combat10', type: 'COMBAT_WIN',
        icon: '⚔', name: 'Purification',
        desc: 'Remporter 10 combats',
        target: 10, rewards: { currency: 1500 },
      },
      {
        id: 'ev_seraph_summon5',  type: 'SUMMON',
        icon: '✦', name: 'Harmonie Céleste',
        desc: 'Effectuer 5 invocations',
        target: 5,  rewards: { currency: 1000, freeRolls: 1 },
      },
      {
        id: 'ev_seraph_stage3',   type: 'STAGE_COMPLETE',
        icon: '地', name: 'Descente du Ciel',
        desc: 'Compléter 3 stages',
        target: 3,  rewards: { currency: 800 },
      },
    ],
    completion: { currency: 3000, freeRolls: 2 },
  },
];

/** Retourne les événements actuellement actifs. */
export function getActiveEvents() {
  const now = Date.now();
  return EVENTS.filter(e => e.startTime <= now && now < e.endTime);
}

/** Retourne les événements à venir (non encore commencés). */
export function getUpcomingEvents() {
  const now = Date.now();
  return EVENTS.filter(e => e.startTime > now);
}

/** Retourne un événement par son id. */
export function getEventById(id) {
  return EVENTS.find(e => e.id === id) ?? null;
}

/**
 * Formate un temps restant (ms) en chaîne lisible.
 * Ex: "13j 23h 59m" / "5h 03m 12s" / "42m 08s"
 */
export function formatEventCountdown(ms) {
  if (ms <= 0) return 'Terminé';
  const totalSec = Math.floor(ms / 1000);
  const days  = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins  = Math.floor((totalSec % 3600) / 60);
  const secs  = totalSec % 60;
  const pad   = n => String(n).padStart(2, '0');
  if (days > 0)  return `${days}j ${pad(hours)}h ${pad(mins)}m`;
  if (hours > 0) return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
  return `${pad(mins)}m ${pad(secs)}s`;
}
