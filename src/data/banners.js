/**
 * banners.js — Définition des bannières de tirage KuroSekai.
 * Bannière standard permanente + bannières événement rotatifs.
 */

import { CHARACTERS } from './characters.js';

/**
 * Liste de toutes les bannières (actives ou non).
 * Propriétés :
 *  - id            : identifiant unique
 *  - name          : nom affiché (court)
 *  - nameJp        : nom japonais (sous-titre)
 *  - kanji         : kanji décoratif
 *  - subtitle      : étiquette "type"
 *  - description   : texte court
 *  - featuredId    : id du personnage vedette (null si aucun)
 *  - rateUpMult    : multiplicateur du taux 5★ (1 = normal, 2 = doublé)
 *  - guarantee5050 : si true, 1er 5★ = vedette garantie, ensuite 50/50
 *  - color         : couleur thème
 *  - colorDim      : variante sombre
 *  - permanent     : toujours actif
 *  - startTime     : timestamp ms (null si permanent)
 *  - endTime       : timestamp ms (null si permanent)
 */
export const BANNERS = [
  {
    id:            'standard',
    name:          'STANDARD',
    nameJp:        '常設召喚',
    kanji:         '常',
    subtitle:      'Collection complète',
    description:   'Tous les personnages du roster disponibles en tirage standard.',
    featuredId:    null,
    rateUpMult:    1,
    guarantee5050: false,
    color:         '#00d4ff',
    colorDim:      '#003d55',
    permanent:     true,
    startTime:     null,
    endTime:       null,
  },
  {
    id:            'event_kira',
    name:          'PROTOCOLE NÉANT',
    nameJp:        '虚無の覚醒',
    kanji:         '虚',
    subtitle:      'Bannière Limitée',
    description:   'KIRA · La Faucheuse Bionique en vedette. Taux 5★ doublé. Premier 5★ garanti KIRA.',
    featuredId:    'kira',
    rateUpMult:    2,
    guarantee5050: true,
    color:         '#cc00ff',
    colorDim:      '#440066',
    permanent:     false,
    startTime:     new Date('2026-05-24T00:00:00Z').getTime(),
    endTime:       new Date('2026-06-07T00:00:00Z').getTime(),
  },
  {
    id:            'event_seraph',
    name:          'AILE BRISÉE',
    nameJp:        '堕ちた天使',
    kanji:         '光',
    subtitle:      'Bannière Limitée',
    description:   'SERAPH · L\'Ange de l\'Apocalypse en vedette. Taux 5★ doublé. Premier 5★ garanti SERAPH.',
    featuredId:    'seraph',
    rateUpMult:    2,
    guarantee5050: true,
    color:         '#ccccff',
    colorDim:      '#333366',
    permanent:     false,
    startTime:     new Date('2026-06-07T00:00:00Z').getTime(),
    endTime:       new Date('2026-06-21T00:00:00Z').getTime(),
  },
];

/** Retourne les bannières actuellement actives (standard + events en cours). */
export function getActiveBanners() {
  const now = Date.now();
  return BANNERS.filter(b =>
    b.permanent || (b.startTime <= now && now < b.endTime)
  );
}

/** Retourne le personnage vedette d'une bannière, ou null. */
export function getFeaturedCharacter(banner) {
  if (!banner?.featuredId) return null;
  return CHARACTERS.find(c => c.id === banner.featuredId) ?? null;
}

/** Retourne l'objet bannière par son id. */
export function getBannerById(id) {
  return BANNERS.find(b => b.id === id) ?? BANNERS[0];
}

/**
 * Formate le temps restant (ms) en chaîne lisible.
 * Ex: "13j 23h 59m 42s" / "5h 03m 12s" / "42m 08s"
 */
export function formatCountdown(ms) {
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
