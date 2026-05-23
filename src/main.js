/**
 * main.js — Point d'entrée de KuroSekai
 */

import { gsap }         from 'gsap';
import { MenuScene }    from './scenes/MenuScene.js';
import { MenuUI }       from './ui/MenuUI.js';
import { SummonUI }     from './ui/SummonUI.js';
import { CollectionUI } from './ui/CollectionUI.js';
import { TeamSelectUI } from './ui/TeamSelectUI.js';
import { CombatUI }     from './ui/CombatUI.js';
import { HubUI }        from './ui/HubUI.js';
import { SceneUI }      from './ui/SceneUI.js';
import { PlayerData }   from './data/PlayerData.js';
import { CHARACTERS }   from './data/characters.js';
import { SCENARIO }     from './data/scenario.js';
import { SettingsUI }   from './ui/SettingsUI.js';
import { LevelUpUI }    from './ui/LevelUpUI.js';
import { settings }     from './data/Settings.js';

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

/* ── Retour hub depuis les sous-écrans plein-écran ── */
function goHub() { hub.show(); }

const settingsUI = new SettingsUI(playerData, goHub);

/* ══════════════════════════════════════════
   COMBAT + SÉLECTION D'ÉQUIPE
══════════════════════════════════════════ */

let _pendingStage = null;
let _currentTeam  = [];

function handleVictory(stage) {
  playerData.completeStage(stage.id, stage.rewards);

  const expGained  = stage.rewards.exp ?? 0;
  const lvlResults = _currentTeam.map(char => {
    const oldLevel = playerData.getLevel(char.id);
    const result   = playerData.addExp(char.id, expGained);
    const prog     = playerData.expProgress(char.id);
    return { char, oldLevel, newLevel: result.newLevel,
             newExp: prog.exp, expGained, leveled: result.newLevel > oldLevel };
  });

  const goToHub = () => {
    const debrief = SCENARIO.debriefings[stage.id];
    if (debrief) sceneUI.play(debrief, goHub);
    else         goHub();
  };

  if (lvlResults.some(r => r.leveled)) levelUpUI.play(lvlResults, goToHub);
  else goToHub();
}

const combatUI = new CombatUI((winner, stage) => {
  if (winner === 'player' && stage) handleVictory(stage);
  else goHub();
});

const teamSelect = new TeamSelectUI(playerData, (team) => {
  _currentTeam = team;
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
);

/* Retour hub depuis summon et collection */
summon.overlay?.querySelector('#summon-back')
  ?.addEventListener('click', goHub);
document.getElementById('col-back')
  ?.addEventListener('click', goHub);

/* ══════════════════════════════════════════
   SYNC INVOCATION → COLLECTION
══════════════════════════════════════════ */

document.addEventListener('kuro:character-obtained', (e) => {
  if (e.detail?.id) playerData.addCharacter(e.detail.id);
});

/* ══════════════════════════════════════════
   DÉMARRAGE — PAGE D'ACCUEIL
══════════════════════════════════════════ */

settings.applyAll();
scene.animate();

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
    },
  });
});
