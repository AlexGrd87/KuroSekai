/**
 * portrait.js
 * Système de portrait SVG génératif partagé.
 * Utilisé par CollectionUI, TeamSelectUI, CombatUI.
 *
 * Variants : 'grid' | 'team' | 'card' | 'combat'
 */

/* ── Icônes SVG par classe ── */
export const CLASS_ICONS = {
  Shinigami: `
    <path d="M62 20 Q18 28 28 68 Q38 54 50 58" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>
    <line x1="50" y1="58" x2="68" y2="84" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>
    <line x1="60" y1="74" x2="74" y2="70" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="62" cy="20" r="4" fill="currentColor"/>`,
  Gardien: `
    <path d="M50 18 L72 30 L72 54 Q72 72 50 83 Q28 72 28 54 L28 30 Z" fill="none" stroke="currentColor" stroke-width="2.6"/>
    <line x1="50" y1="34" x2="50" y2="68" stroke="currentColor" stroke-width="1.8" opacity="0.7"/>
    <line x1="36" y1="51" x2="64" y2="51" stroke="currentColor" stroke-width="1.8" opacity="0.7"/>`,
  Guerrier: `
    <line x1="33" y1="24" x2="67" y2="76" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="67" y1="24" x2="33" y2="76" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="26" y1="38" x2="40" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="74" y1="38" x2="60" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  Assassin: `
    <path d="M50 16 L54 52 L50 58 L46 52 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <line x1="50" y1="58" x2="50" y2="78" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <line x1="41" y1="66" x2="59" y2="66" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="40" y1="46" x2="60" y2="46" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  Soutien: `
    <line x1="50" y1="22" x2="50" y2="78" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
    <line x1="24" y1="48" x2="76" y2="48" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="50" cy="48" r="6" fill="currentColor"/>
    <circle cx="50" cy="48" r="11" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>`,
  Tireur: `
    <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="50" cy="50" r="13" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <circle cx="50" cy="50" r="3.5" fill="currentColor"/>
    <line x1="50" y1="20" x2="50" y2="26" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="50" y1="74" x2="50" y2="80" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="20" y1="50" x2="26" y2="50" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="74" y1="50" x2="80" y2="50" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  Tank: `
    <path d="M50 16 L76 30 L80 58 L50 84 L20 58 L24 30 Z" fill="none" stroke="currentColor" stroke-width="2.6"/>
    <path d="M50 28 L66 37 L68 56 L50 70 L32 56 L34 37 Z" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.55"/>
    <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.7"/>`,
  Mage: `
    <line x1="50" y1="30" x2="50" y2="80" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M50 18 L53 26 L62 26 L55 32 L58 40 L50 35 L42 40 L45 32 L38 26 L47 26 Z" fill="currentColor" opacity="0.9"/>
    <line x1="40" y1="72" x2="60" y2="72" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="44" y1="78" x2="56" y2="78" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
};

export const PORTRAIT_ELEMENTS = {
  Fire:    { color: '#ff5500', glow: '#ff2200', kanji: '火' },
  Dark:    { color: '#8800ff', glow: '#5500cc', kanji: '闇' },
  Wind:    { color: '#00cc66', glow: '#00ff88', kanji: '風' },
  Water:   { color: '#0099cc', glow: '#00ccff', kanji: '水' },
  Thunder: { color: '#cccc00', glow: '#ffff00', kanji: '雷' },
  Earth:   { color: '#886600', glow: '#bbaa00', kanji: '土' },
  Light:   { color: '#ccccff', glow: '#ffffff', kanji: '光' },
  Void:    { color: '#cc00ff', glow: '#880099', kanji: '虚' },
  Neutral: { color: '#99aacc', glow: '#667799', kanji: '無' },
};

/**
 * Génère une balise SVG complète pour un personnage.
 * @param {object} char   — objet CHARACTERS (id, name, class, element, rarity, ...)
 * @param {string} variant — 'grid' | 'team' | 'card' | 'combat'
 */
export function buildPortraitSVG(char, variant = 'grid') {
  const el   = PORTRAIT_ELEMENTS[char.element] || PORTRAIT_ELEMENTS.Neutral;
  const icon = CLASS_ICONS[char.class]         || CLASS_ICONS.Guerrier;
  const uid  = `${char.id}-${variant}`;

  // Dots rareté (grille et team seulement)
  const rarDots = (variant === 'grid' || variant === 'team')
    ? Array.from({ length: char.rarity }, (_, i) =>
        `<circle cx="${50 - (char.rarity - 1) * 5 + i * 10}" cy="91" r="2.2" fill="${el.color}" opacity="0.85"/>`
      ).join('')
    : '';

  return `
    <svg class="char-portrait-svg char-portrait-svg--${variant}"
         viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pg-${uid}" cx="50%" cy="38%" r="62%">
          <stop offset="0%"   stop-color="${el.color}" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="${el.color}" stop-opacity="0"/>
        </radialGradient>
        <filter id="glow-${uid}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="100" height="100" fill="url(#pg-${uid})"/>

      <g stroke="${el.color}" stroke-width="0.5" fill="none" opacity="0.18">
        <polyline points="8,22 22,22 22,10"/>
        <polyline points="92,78 78,78 78,90"/>
        <polyline points="8,65 8,80 20,80"/>
        <polyline points="92,35 92,20 80,20"/>
        <line x1="28" y1="22" x2="38" y2="22"/>
        <line x1="62" y1="78" x2="72" y2="78"/>
      </g>

      <text x="50" y="64" text-anchor="middle"
            font-size="54" fill="${el.color}" opacity="0.07"
            font-family="serif" font-weight="900">${el.kanji}</text>

      <g color="${el.color}" filter="url(#glow-${uid})">
        ${icon}
      </g>

      ${rarDots}
    </svg>`;
}
