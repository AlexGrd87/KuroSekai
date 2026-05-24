/**
 * main.js — Point d'entrée de KuroSekai
 */

import { gsap }           from 'gsap';
import { MenuScene }      from './scenes/MenuScene.js';
import { MenuUI }         from './ui/MenuUI.js';
import { SummonUI }       from './ui/SummonUI.js';
import { CollectionUI }   from './ui/CollectionUI.js';
import { TeamSelectUI }   from './ui/TeamSelectUI.js';
import { CombatUI }       from './ui/CombatUI.js';
import { HubUI }          from './ui/HubUI.js';
import { SceneUI }        from './ui/SceneUI.js';
import { PlayerData, ENERGY_MAX } from './data/PlayerData.js';
import { CHARACTERS }     from './data/characters.js';
import { SCENARIO }       from './data/scenario.js';
import { SettingsUI }     from './ui/SettingsUI.js';
import { LevelUpUI }      from './ui/LevelUpUI.js';
import { RewardPopupUI }  from './ui/RewardPopupUI.js';
import { settings }       from './data/Settings.js';
import { AuthUI }         from './ui/AuthUI.js';
import { ShopUI }         from './ui/ShopUI.js';
import { DungeonUI }      from './ui/DungeonUI.js';
import { LeaderboardUI }  from './ui/LeaderboardUI.js';
import { QuestsUI }       from './ui/QuestsUI.js';
import { ProfileUI }      from './ui/ProfileUI.js';
import { apiService }     from './data/ApiService.js';
import { audio }          from './audio/AudioManager.js';
import { DailyLoginUI }   from './ui/DailyLoginUI.js';
import { toast }          from './ui/ToastUI.js';
import { transition }     from './ui/TransitionUI.js';
import { tutorialUI }     from './ui/TutorialUI.js';
import { ArenaUI }        from './ui/ArenaUI.js';
import { TowerUI }        from './ui/TowerUI.js';
import { WeeklyBossUI }   from './ui/WeeklyBossUI.js';
import { ForgeUI }             from './ui/ForgeUI.js';
import { TalentUI }            from './ui/TalentUI.js';
import { ArtifactInventoryUI } from './ui/ArtifactInventoryUI.js';
import { rollArtifactDrops, formatArtifactDrops } from './data/artifacts.js';

/* ══════════════════════════════════════════
   DONNÉES JOUEUR
══════════════════════════════════════════ */

const playerData = new PlayerData();
playerData.seedDemo(CHARACTERS);

/* ══════════════════════════════════════════
   SCÈNE 3D (fond permanent)
══════════════════════════════════════════ */

const canvas = document.getElementById('bg-canvas');
const scene  = new MenuScene(canvas);

/* ══════════════════════════════════════════
   ÉCRANS
══════════════════════════════════════════ */

const sceneUI    = new SceneUI();
const summon     = new SummonUI(playerData);
const collection = new CollectionUI(playerData);
const levelUpUI  = new LevelUpUI();
const rewardPopup = new RewardPopupUI();

/* ── Retour hub depuis les sous-écrans plein-écran ── */
function _checkAchievements() {
  const newOnes = playerData.checkAchievements(CHARACTERS.length);
  newOnes.forEach(ach => {
    const rewardStr = [
      ach.reward?.currency  ? `+${ach.reward.currency.toLocaleString()} ◈`  : '',
      ach.reward?.freeRolls ? `+${ach.reward.freeRolls} tirage${ach.reward.freeRolls > 1 ? 's' : ''}` : '',
    ].filter(Boolean).join(' · ');
    toast.show(`🏆 Haut fait : ${ach.name}`, 'reward', {
      sub:      rewardStr || ach.desc,
      duration: 5000,
    });
  });
}

function _smartStartupNotifs() {
  // Énergie rechargée pendant l'absence ?
  const { current, full } = playerData.getEnergy();
  const lastVisit = parseInt(localStorage.getItem('kuro_last_visit') ?? '0', 10);
  const wasEmpty  = lastVisit > 0 && (playerData.energy ?? 0) < ENERGY_MAX;
  if (full && wasEmpty) {
    toast.show('Énergie rechargée !', 'energy', { sub: `⚡ ${current}/10 — prêt au combat` });
  }
  localStorage.setItem('kuro_last_visit', Date.now().toString());

  // Quêtes réclamables ?
  const claimable = playerData.claimableQuestCount();
  if (claimable > 0) {
    toast.show(`${claimable} quête${claimable > 1 ? 's' : ''} terminée${claimable > 1 ? 's' : ''}`, 'success',
      { sub: 'Réclame tes récompenses dans Missions', duration: 4500 });
  }
}

function goHub() {
  transition.sweep('hub', () => {
    hub.show();
    questsUI?.refreshBadge();
    if (!audio.ready || audio._bgmTheme !== 'hub') {
      audio.stopBgm(600);
      setTimeout(() => audio.playBgm('hub'), 650);
    }
    // Vérifications au retour hub
    setTimeout(() => {
      _checkAchievements();
      _smartStartupNotifs();
    }, 400);
  });
}

const settingsUI = new SettingsUI(playerData, goHub);
const shopUI     = new ShopUI(playerData, goHub);

/* ══════════════════════════════════════════
   COMBAT + SÉLECTION D'ÉQUIPE
══════════════════════════════════════════ */

let _pendingStage  = null;
let _currentTeam   = [];
let _arenaResultCb = null; // si non-null, le prochain résultat de combat va à l'arène
let _towerResultCb = null; // si non-null, le prochain résultat de combat va à la tour
let _bossResultCb  = null; // si non-null, le prochain résultat de combat va au boss hebdo

function handleVictory(stage, teamHpPct = 0) {
  audio.play('victory');
  playerData.completeStage(stage.id, stage.rewards);
  // Étoiles de performance
  const stars = PlayerData.calcStars(teamHpPct);
  playerData.setStageStars(stage.id, stars);
  // Progression quêtes + stats profil
  playerData.incrementCombatsWon();
  playerData.incrementQuest('COMBAT_WIN',     1);
  playerData.incrementQuest('STAGE_COMPLETE', 1);
  questsUI?.refreshBadge();

  const xpMult    = playerData.consumeXpBoost();   // 2 si boost actif, sinon 1
  const expGained = Math.round((stage.rewards.exp ?? 0) * xpMult);
  const lvlResults = _currentTeam.map(char => {
    const oldLevel = playerData.getLevel(char.id);
    const result   = playerData.addExp(char.id, expGained);
    const prog     = playerData.expProgress(char.id);
    return { char, oldLevel, newLevel: result.newLevel,
             newExp: prog.exp, expGained, leveled: result.newLevel > oldLevel };
  });

  // Vérification achievements après victoire
  _checkAchievements();

  // Toast victoire
  const starsStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  toast.show(
    `${stage.name} — Victoire ${starsStr}`,
    'reward',
    { sub: `+${stage.rewards.currency} ◈  ·  +${expGained} EXP${xpMult > 1 ? ' (×' + xpMult + ')' : ''}` }
  );

  const goToHub = () => {
    const debrief = SCENARIO.debriefings[stage.id];
    if (debrief) sceneUI.play(debrief, goHub);
    else         goHub();
  };

  const afterRewards = () => {
    if (lvlResults.some(r => r.leveled)) {
      audio.play('level_up');
      levelUpUI.play(lvlResults, goToHub);
    } else {
      goToHub();
    }
  };

  // Artefacts droppés en campagne
  const artDrops = rollArtifactDrops('campaign');
  artDrops.forEach(art => playerData.addArtifactToInventory(art));
  if (artDrops.length > 0) {
    toast.show('✦ Artefact obtenu !', 'reward', {
      sub: formatArtifactDrops(artDrops), duration: 4000,
    });
  }

  // Afficher la popup de récompenses avant level-up / débrief
  rewardPopup.show(stage, expGained, afterRewards, artDrops);
}

const combatUI = new CombatUI((winner, stage, teamHpPct = 0) => {
  // Combat d'arène : dévie vers l'arène
  if (_arenaResultCb) {
    const cb   = _arenaResultCb;
    _arenaResultCb = null;
    if (winner === 'enemy') audio.play('defeat');
    audio.stopBgm();
    setTimeout(() => { audio.playBgm('hub'); cb(winner); }, 800);
    return;
  }
  // Combat de tour : dévie vers la tour
  if (_towerResultCb) {
    const cb   = _towerResultCb;
    _towerResultCb = null;
    if (winner === 'enemy') audio.play('defeat');
    else audio.play('victory');
    audio.stopBgm();
    setTimeout(() => { audio.playBgm('hub'); cb(winner, teamHpPct); }, 800);
    return;
  }
  // Combat boss hebdo : dévie vers boss
  if (_bossResultCb) {
    const cb  = _bossResultCb;
    _bossResultCb = null;
    if (winner === 'enemy') audio.play('defeat');
    else audio.play('victory');
    audio.stopBgm();
    setTimeout(() => { audio.playBgm('hub'); cb(winner, teamHpPct); }, 800);
    return;
  }
  if (winner === 'player' && stage) handleVictory(stage, teamHpPct);
  else {
    if (winner === 'enemy') audio.play('defeat');
    audio.stopBgm();
    setTimeout(() => { audio.playBgm('hub'); goHub(); }, 800);
  }
});

const teamSelect = new TeamSelectUI(playerData, (team) => {
  _currentTeam = team;
  audio.stopBgm(500);
  setTimeout(() => audio.playBgm('combat'), 550);
  combatUI.start(
    team.map(char => {
      const { cd0, cd1 } = playerData.getCooldownReductions(char);
      const skills = char.skills.map((sk, i) => {
        const red = i === 0 ? cd0 : i === 1 ? cd1 : 0;
        if (red === 0) return sk;
        return { ...sk, cooldown: Math.max(1, sk.cooldown + red) };
      });
      return {
        ...char,
        skills,
        level: playerData.getLevel(char.id),
        stats: playerData.getScaledStats(char),
      };
    }),
    _pendingStage
  );
});

/* Retour team-select → hub */
document.getElementById('ts-back')?.addEventListener('click', goHub);

/* ── DONJON ABYSSAL ── */
const dungeonUI = new DungeonUI(playerData, combatUI, teamSelect, goHub);
document.getElementById('hub-dungeon-btn')
  ?.addEventListener('click', () => {
    audio.play('ui_navigate');
    dungeonUI.show();
  });

/* ── ARÈNE PVP ── */
const arenaUI = new ArenaUI(playerData, goHub);
arenaUI.setCombatLauncher((stage, onResult) => {
  _pendingStage  = stage;
  _arenaResultCb = onResult;
  audio.stopBgm(500);
  setTimeout(() => audio.playBgm('combat'), 550);
  teamSelect.show();
});

document.getElementById('hub-arena-btn')
  ?.addEventListener('click', () => {
    audio.play('ui_navigate');
    hub.hide?.();
    arenaUI.show();
  });

/* ── TOUR INFINIE ── */
const towerUI = new TowerUI(playerData, goHub);
towerUI.setCombatLauncher((stage, onResult) => {
  _pendingStage  = stage;
  _towerResultCb = onResult;
  audio.stopBgm(500);
  setTimeout(() => audio.playBgm('combat'), 550);
  teamSelect.show();
});

document.getElementById('hub-tower-btn')
  ?.addEventListener('click', () => {
    audio.play('ui_navigate');
    hub.hide?.();
    towerUI.show();
  });

/* ── TALENTS & PASSIFS ── */
const talentUI = new TalentUI(playerData);

document.addEventListener('kuro:open-talents', (e) => {
  const charId = e.detail?.charId;
  if (!charId) return;
  audio.play('ui_navigate');
  talentUI.show(charId, () => {
    // Retour : rouvre la collection si elle était visible
    if (document.getElementById('collection-screen')?.style.display !== 'none') {
      collection.show?.();
    }
  });
});

/* ── FORGE & ARTEFACTS ── */
const forgeUI     = new ForgeUI(playerData, goHub);
const artifactInv = new ArtifactInventoryUI(playerData, goHub);

document.getElementById('hub-forge-btn')
  ?.addEventListener('click', () => {
    audio.play('ui_navigate');
    hub.hide?.();
    forgeUI.show();
  });

document.getElementById('hub-inventory-btn')
  ?.addEventListener('click', () => {
    audio.play('ui_navigate');
    hub.hide?.();
    artifactInv.show();
  });

/* ── BOSS HEBDOMADAIRE ── */
const weeklyBossUI = new WeeklyBossUI(playerData, goHub);
weeklyBossUI.setCombatLauncher((stage, onResult) => {
  _pendingStage = stage;
  _bossResultCb = onResult;
  audio.stopBgm(500);
  setTimeout(() => audio.playBgm('combat'), 550);
  teamSelect.show();
});

document.getElementById('hub-boss-btn')
  ?.addEventListener('click', () => {
    audio.play('ui_navigate');
    hub.hide?.();
    weeklyBossUI.show();
  });

/* ── CLASSEMENT ── */
const leaderboardUI = new LeaderboardUI(playerData, goHub);
document.getElementById('hub-lb-btn')
  ?.addEventListener('click', () => {
    audio.play('ui_navigate');
    leaderboardUI.show();
  });

/* ── PROFIL ── */
const profileUI = new ProfileUI(playerData, goHub);
document.getElementById('hub-profile-btn')
  ?.addEventListener('click', () => {
    audio.play('ui_navigate');
    hub.hide();
    profileUI.show();
  });

// Depuis le picker profil → ouvre le shop sur l'onglet cosmétiques
document.addEventListener('kuro:open-shop-cosmetique', () => {
  profileUI.hide();
  shopUI._setTab('cosmetique');
  shopUI.show();
});
// Depuis le shop → notifie le profil qu'un cosmétique a été débloqué
document.addEventListener('kuro:cosmetic-unlocked', () => {
  profileUI.notifyUnlock();
});

/* ── MISSIONS & QUÊTES ── */
const questsUI = new QuestsUI(playerData, goHub);
document.getElementById('hub-missions-btn')
  ?.addEventListener('click', () => {
    audio.play('ui_navigate');
    hub.hide();
    questsUI.show();
  });

/* ══════════════════════════════════════════
   HUB — ÉCRAN PRINCIPAL
══════════════════════════════════════════ */

const CAMPAIGN_KEY = 'kuro_campaign_v1';

const hub = new HubUI(
  playerData,

  /* onDeploy — lance le combat depuis la carte */
  (stage) => {
    _pendingStage = stage;
    const briefing = SCENARIO.briefings[stage.id];
    if (briefing) sceneUI.play(briefing, () => teamSelect.show());
    else          teamSelect.show();
  },

  /* onSummon */
  () => summon.show(),

  /* onCollection */
  () => collection.show(),

  /* onSettings */
  () => settingsUI.show(),

  /* onCampaign — joue l'intro la première fois, puis ouvre la carte */
  (openMap) => {
    if (!localStorage.getItem(CAMPAIGN_KEY)) {
      localStorage.setItem(CAMPAIGN_KEY, '1');
      sceneUI.play(SCENARIO.intro, openMap);
    } else {
      openMap();
    }
  },

  /* onShop */
  () => shopUI.show(),
);

/* Bouton daily login dans le hub */
document.getElementById('hub-daily-btn')
  ?.addEventListener('click', () => {
    audio.play('ui_navigate');
    dailyLoginUI.show(true); // force=true → affiche même si déjà réclamé
  });

/* Retour hub depuis summon et collection */
summon.overlay?.querySelector('#summon-back')
  ?.addEventListener('click', goHub);
document.getElementById('col-back')
  ?.addEventListener('click', goHub);

/* ══════════════════════════════════════════
   SYNC INVOCATION → COLLECTION
══════════════════════════════════════════ */

document.addEventListener('kuro:character-obtained', (e) => {
  if (e.detail?.id) {
    playerData.addCharacter(e.detail.id);
    playerData.incrementSummons(1);
    playerData.incrementQuest('SUMMON', 1);
    questsUI?.refreshBadge();
    toast.show(`${e.detail.name ?? e.detail.id} obtenu(e) !`, 'reward',
      { icon: '✦', sub: 'Ajouté(e) à ta collection' });
  }
});

/* ══════════════════════════════════════════
   AUTHENTIFICATION
══════════════════════════════════════════ */

const authUI = new AuthUI(async (username) => {
  // Charge la progression cloud si connecté
  if (username) {
    const cloudSave = await apiService.loadSave();
    if (cloudSave) playerData.loadFromCloud(cloudSave);

    // Badge compte dans le hub
    const nameEl = document.getElementById('hub-account-name');
    if (nameEl) nameEl.textContent = username;
    const badge = document.getElementById('hub-account-badge');
    if (badge) badge.style.display = 'flex';
  } else {
    // Invité : pas de badge
    const badge = document.getElementById('hub-account-badge');
    if (badge) badge.style.display = 'none';
  }

  authUI.hide();
  goSplash();
});

/* Déconnexion depuis le hub */
document.getElementById('hub-logout-btn')?.addEventListener('click', () => {
  apiService.logout();
  // Retour à l'écran auth
  hub.hide?.();
  const badge = document.getElementById('hub-account-badge');
  if (badge) badge.style.display = 'none';
  authUI.show();
});

/* ══════════════════════════════════════════
   DÉMARRAGE — PAGE D'ACCUEIL
══════════════════════════════════════════ */

settings.applyAll();
// Applique les volumes sauvegardés
audio.setBgmVolume(Math.round((settings.get('musicVolume') ?? 0.7) * 100));
audio.setSfxVolume(Math.round((settings.get('sfxVolume')   ?? 0.8) * 100));
audio.playBgm('hub'); // démarre la BGM (sera réellement jouée après premier geste)
scene.animate();

/* ── Daily Login ── */
const dailyLoginUI = new DailyLoginUI(playerData, () => {
  // Callback appelé quand la popup se ferme → rafraîchit le hub
  hub?._updateStats?.();
  questsUI?.refreshBadge();
  _refreshDailyBadge();
});

function _refreshDailyBadge() {
  const state  = playerData.getDailyLoginState();
  const badge  = document.getElementById('hub-daily-badge');
  if (badge) badge.style.display = state.claimedToday ? 'none' : 'block';
}

function goSplash() {
  /* Animation du splash (logo + glitch titre) */
  const splashUI = new MenuUI();
  splashUI.playIntro();

  /* Bouton COMMENCER — clic manuel */
  document.getElementById('btn-start')?.addEventListener('click', () => {
    const overlay = document.getElementById('ui-overlay');
    gsap.to(overlay, {
      opacity: 0, duration: 0.45, ease: 'power2.in',
      onComplete: () => {
        overlay.style.display = 'none';
        goHub();
        // Affiche le daily login si pas encore réclamé aujourd'hui
        setTimeout(() => {
          const state = playerData.getDailyLoginState();
          if (!state.claimedToday) {
            audio.play('ui_navigate');
            dailyLoginUI.show();
          }
          _refreshDailyBadge();
          _smartStartupNotifs();
          // Lance le tutoriel si nouveau joueur
          if (tutorialUI.isNew()) {
            setTimeout(() => tutorialUI.start(playerData), 1200);
          }
        }, 600);
      },
    });
  }, { once: true });
}

// Démarre par l'écran d'auth si déjà un token valide → on skip
if (apiService.isLoggedIn) {
  // Token présent : on essaie de charger le save directement
  (async () => {
    const cloudSave = await apiService.loadSave();
    if (cloudSave) {
      playerData.loadFromCloud(cloudSave);
    } else {
      // Token expiré ou invalide
      apiService.logout();
    }
    const name = apiService.username;
    const nameEl = document.getElementById('hub-account-name');
    if (nameEl && name) nameEl.textContent = name;
    const badge = document.getElementById('hub-account-badge');
    if (badge) badge.style.display = name ? 'flex' : 'none';
    goSplash();
    _refreshDailyBadge();
  })();
} else {
  authUI.show();
}
