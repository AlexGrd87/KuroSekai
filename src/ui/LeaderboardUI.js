/**
 * LeaderboardUI.js
 * Classement KuroSekai — Global, Campagne, Donjon.
 *
 * Scores calculés depuis les données joueur locales
 * et comparés à une liste de joueurs mock persistante.
 * Le joueur voit toujours sa propre ligne mise en évidence.
 */

import { gsap }   from 'gsap';
import { STAGES } from '../data/enemies.js';
import { getAccountRankLabel } from '../data/accountLevel.js';

const LB_BEST_KEY = 'kuro_lb_dungeon_best';

/* ── Joueurs mock (scores fixes, noms japonisés) ── */
const MOCK_PLAYERS = [
  { name: 'ヴァイオレット_XV', scores: { global: 98_400, campaign: 9, dungeon: 5, boss: 94_200,  accountLevel: 42 } },
  { name: 'ZERO.PHOENIX',      scores: { global: 85_200, campaign: 9, dungeon: 4, boss: 81_500,  accountLevel: 38 } },
  { name: '黒刃_Ryuu',         scores: { global: 78_600, campaign: 8, dungeon: 5, boss: 76_800,  accountLevel: 35 } },
  { name: 'Neon_Sakura',       scores: { global: 71_000, campaign: 9, dungeon: 3, boss: 68_400,  accountLevel: 31 } },
  { name: 'GHOST_HKZR',        scores: { global: 64_800, campaign: 7, dungeon: 5, boss: 59_700,  accountLevel: 28 } },
  { name: '夜叉_Kimi',         scores: { global: 57_500, campaign: 8, dungeon: 2, boss: 52_000,  accountLevel: 25 } },
  { name: 'Aurora_9',          scores: { global: 49_200, campaign: 6, dungeon: 4, boss: 45_300,  accountLevel: 22 } },
  { name: 'Cipher_Wolf',       scores: { global: 41_600, campaign: 7, dungeon: 3, boss: 38_100,  accountLevel: 19 } },
  { name: 'ミライ_09',         scores: { global: 35_800, campaign: 5, dungeon: 4, boss: 29_600,  accountLevel: 15 } },
  { name: 'VORTEX.DATA',       scores: { global: 28_300, campaign: 6, dungeon: 2, boss: 22_400,  accountLevel: 12 } },
  { name: '鋼鉄_Nova',         scores: { global: 19_400, campaign: 4, dungeon: 3, boss: 14_800,  accountLevel:  8 } },
  { name: 'DataShard_Aya',     scores: { global: 11_200, campaign: 3, dungeon: 2, boss:  7_200,  accountLevel:  5 } },
];

/* ── Calcul du score joueur ── */
function calcPlayerScores(playerData) {
  const stages_done   = playerData.completedStages?.size ?? 0;
  const dungeonBest   = parseInt(localStorage.getItem(LB_BEST_KEY) ?? '0', 10);
  const chars         = playerData.uniqueCount?.() ?? 0;
  const bossDmg       = playerData.weeklyBossDamage ?? 0;
  const prog          = playerData.getAccountProgress?.() ?? { level: 1 };

  const campaign_pts  = stages_done * 1000;
  const dungeon_pts   = dungeonBest * 800;
  const char_pts      = chars * 200;
  const account_pts   = prog.level * 300;
  const global_pts    = campaign_pts + dungeon_pts + char_pts + account_pts;

  return {
    global:       global_pts,
    campaign:     stages_done,
    dungeon:      dungeonBest,
    boss:         bossDmg,
    accountLevel: prog.level,
  };
}

export class LeaderboardUI {
  constructor(playerData, goHub) {
    this.playerData = playerData;
    this.goHub      = goHub;

    this.screen  = document.getElementById('lb-screen');
    this._tab    = 'global';  // 'global' | 'campaign' | 'dungeon' | 'boss'

    this._bindEvents();
  }

  /* ════════════════════════════════
     AFFICHAGE
  ════════════════════════════════ */

  show() {
    if (!this.screen) return;
    this._tab = 'global';
    this._syncTabUI();
    this._buildList();

    gsap.set(this.screen, { display: 'flex', opacity: 0, y: 20 });
    gsap.to(this.screen, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
    gsap.fromTo('.lb-row',
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, stagger: 0.045, duration: 0.3, ease: 'power2.out', delay: 0.15 }
    );
  }

  hide() {
    if (!this.screen) return;
    gsap.to(this.screen, {
      opacity: 0, y: 16, duration: 0.3, ease: 'power2.in',
      onComplete: () => gsap.set(this.screen, { display: 'none' }),
    });
  }

  /* ════════════════════════════════
     CONSTRUCTION DE LA LISTE
  ════════════════════════════════ */

  _buildList() {
    const list = document.getElementById('lb-list');
    if (!list) return;
    list.innerHTML = '';

    const playerScores = calcPlayerScores(this.playerData);
    const username     = this.playerData._username
      ?? localStorage.getItem('kuro_username')
      ?? 'TOI';

    const tab = this._tab;

    // Construit la liste complète (mocks + joueur)
    const scoreFor = (scores, t) =>
      t === 'global'   ? scores.global
    : t === 'campaign' ? scores.campaign
    : t === 'dungeon'  ? scores.dungeon
    :                    scores.boss ?? 0;

    const all = [
      ...MOCK_PLAYERS.map(m => ({
        name:     m.name,
        score:    scoreFor(m.scores, tab),
        isPlayer: false,
        raw:      m.scores,
      })),
      {
        name:     username,
        score:    scoreFor(playerScores, tab),
        isPlayer: true,
        raw:      playerScores,
      },
    ].sort((a, b) => b.score - a.score);

    // Top 12 affiché
    const shown = all.slice(0, 12);
    // Si le joueur n'est pas dans le top 12, on l'ajoute séparé
    const playerInTop = shown.some(r => r.isPlayer);

    shown.forEach((entry, i) => {
      const rank  = i + 1;
      const row   = this._buildRow(rank, entry, tab);
      list.appendChild(row);
    });

    // Ligne joueur séparée si hors top 12
    if (!playerInTop) {
      const sep = document.createElement('div');
      sep.className = 'lb-sep';
      sep.textContent = '···';
      list.appendChild(sep);

      const playerEntry = all.find(r => r.isPlayer);
      const playerRank  = all.indexOf(playerEntry) + 1;
      list.appendChild(this._buildRow(playerRank, playerEntry, tab));
    }
  }

  _buildRow(rank, entry, tab) {
    const row = document.createElement('div');
    row.className = `lb-row${entry.isPlayer ? ' lb-row--player' : ''}`;

    const rankClass = rank === 1 ? 'lb-rank--gold'
                    : rank === 2 ? 'lb-rank--silver'
                    : rank === 3 ? 'lb-rank--bronze'
                    : '';

    const lvl       = entry.raw.accountLevel ?? 1;
    const rankLabel = getAccountRankLabel(lvl);
    const subInfo   = tab === 'global'
      ? `Nv.${lvl} ${rankLabel} · ${entry.raw.campaign} zones · Donjon S${entry.raw.dungeon ?? 0}`
      : tab === 'campaign'
        ? `${entry.score} / ${STAGES.length} zones`
      : tab === 'dungeon'
        ? `Salle ${entry.score} / 5`
        : `${entry.score.toLocaleString()} dégâts`;

    const scoreLabel = tab === 'campaign' ? `${entry.score} zones`
                     : tab === 'dungeon'  ? `Salle ${entry.score}`
                     : tab === 'boss'     ? `${entry.score.toLocaleString()} dmg`
                     :                     `${entry.score.toLocaleString()} pts`;

    row.innerHTML = `
      <div class="lb-rank ${rankClass}">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</div>
      <div class="lb-name-col">
        <span class="lb-name">${entry.name}</span>
        <span class="lb-sub">${subInfo}</span>
      </div>
      <div class="lb-score">${scoreLabel}</div>
    `;

    // Animation de pulse pour le joueur
    if (entry.isPlayer) {
      gsap.fromTo(row,
        { borderColor: 'transparent' },
        { borderColor: 'rgba(0,212,255,0.5)', duration: 0.8, yoyo: true,
          repeat: -1, ease: 'sine.inOut', delay: 0.8 }
      );
    }

    return row;
  }

  /* ════════════════════════════════
     ONGLETS + EVENTS
  ════════════════════════════════ */

  _syncTabUI() {
    document.querySelectorAll('.lb-tab').forEach(btn => {
      btn.classList.toggle('lb-tab--active', btn.dataset.tab === this._tab);
    });

    const subtitles = {
      global:   'Classement toutes catégories',
      campaign: 'Zones de campagne terminées',
      dungeon:  'Meilleure salle du Donjon Abyssal',
      boss:     'Dégâts infligés au Boss Hebdomadaire',
    };
    const subEl = document.getElementById('lb-subtitle');
    if (subEl) subEl.textContent = subtitles[this._tab];
  }

  _bindEvents() {
    document.getElementById('lb-back')
      ?.addEventListener('click', () => this.hide());

    document.querySelectorAll('.lb-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._tab = btn.dataset.tab;
        this._syncTabUI();
        this._buildList();
        gsap.fromTo('.lb-row',
          { opacity: 0, x: -18 },
          { opacity: 1, x: 0, stagger: 0.04, duration: 0.25, ease: 'power2.out' }
        );
      });
    });
  }
}

/**
 * Enregistre la meilleure salle atteinte dans le donjon.
 * À appeler depuis DungeonUI quand une salle est terminée avec succès.
 */
export function saveDungeonBest(roomIndex) {
  const current = parseInt(localStorage.getItem(LB_BEST_KEY) ?? '0', 10);
  if (roomIndex + 1 > current) {
    localStorage.setItem(LB_BEST_KEY, String(roomIndex + 1));
  }
}
