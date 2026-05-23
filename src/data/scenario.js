/**
 * scenario.js
 * Contenu narratif de KuroSekai — 5 actes, intro, briefings, débriefings.
 *
 * Types de scènes :
 *   'card'      — carte plein écran (cinématique)
 *   'title'     — transition d'acte (nom + sous-titre)
 *   'narration' — texte narrateur, sans personnage
 *   'dialogue'  — personnage avec portrait
 */

/* ── Personnages ── */
const CHARS = {
  kira: {
    name: 'KIRA',
    title: 'La Faucheuse Bionique',
    symbol: '刃',
    color: '#cc00ff',
    glow: '#9900cc',
  },
  ryuu: {
    name: 'RYUU',
    title: 'Le Dragon d\'Acier',
    symbol: '炎',
    color: '#ff6600',
    glow: '#ff4400',
  },
  akane: {
    name: 'AKANE',
    title: 'La Médecin de Guerre',
    symbol: '水',
    color: '#00ccff',
    glow: '#0099cc',
  },
  nyx: {
    name: 'NYX',
    title: 'Fantôme du Réseau',
    symbol: '影',
    color: '#8800ff',
    glow: '#5500cc',
  },
  archon: {
    name: 'ARCHONTE DU VIDE',
    title: 'L\'Origine',
    symbol: '虚',
    color: '#550088',
    glow: '#330055',
  },
  passeur: {
    name: '???',
    title: 'Identité inconnue',
    symbol: '?',
    color: '#445566',
    glow: '#223344',
  },
  seraph: {
    name: 'SERAPH',
    title: "L'Ange de l'Apocalypse",
    symbol: '光',
    color: '#ccccff',
    glow: '#ffffff',
  },
  spectre: {
    name: 'DIRECTIVE-7',
    title: 'IA Militaire Yamamoto',
    symbol: '⚙',
    color: '#446655',
    glow: '#66aa88',
  },
};

/* ══════════════════════════════════════
   INTRO CINÉMATIQUE
══════════════════════════════════════ */
export const INTRO = [
  { type: 'card', text: 'Neo-Osaka.\n2087.', mood: 'dark' },
  { type: 'card', text: 'La ville brille.\nLa ville ment.', mood: 'dark' },
  { type: 'card', text: 'Il y a trois ans, la corporation Yamamoto\na offert à ses habitants des soins gratuits.\n\nDes nanobots. Une révolution médicale.', mood: 'corp' },
  { type: 'card', text: 'C\'était un mensonge.', mood: 'red' },
  { type: 'card', text: 'La nuit de la PURGE, les nanobots se sont activés.\n80% de la population : neutralisée. Contrôlée.\nLes rues vidées en quelques heures.', mood: 'red' },
  { type: 'card', text: 'Quelques-uns ont résisté.\nPar chance. Par rage. Par mutation.', mood: 'dark' },
  { type: 'card', text: 'Tu es l\'un d\'eux.', mood: 'void' },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Je ne sais pas combien de temps il me reste. Mon augmentation ralentit la corruption. Mais elle ne l\'arrête pas.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Peu importe. La Tour Yamamoto doit tomber. Et je serai là pour la voir s\'effondrer.',
  },
  { type: 'title', acte: 'KURO SEKAI', subtitle: '世界黒 — Le Monde Sombre' },
];

/* ══════════════════════════════════════
   ACTE I — SECTEUR 7
══════════════════════════════════════ */
const BRIEFING_01 = [
  { type: 'title', acte: 'ACTE I', subtitle: "L'Éveil — Secteur 7" },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Secteur 7. La périphérie. Les drones de Yamamoto patrouillent ici depuis la Purge.',
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: 'Des MK-01. Vieux modèles. On en a déjà démontés des dizaines.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Ne sous-estime pas ce que Yamamoto peut programmer dans une machine rouillée. En avant.',
  },
];

const DEBRIEF_01 = [
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'La périphérie est sécurisée. Pour l\'instant.',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'Vous avez fait du bruit. La résistance vous a repérés.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'La résistance... je croyais qu\'il n\'en restait plus.',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'C\'est exactement ce que Yamamoto veut que tu croies. Secteur 12. Ce soir.',
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: 'On fait confiance à une inconnue qui surgit de nulle part ?',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: '...',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'On n\'a pas le choix. On y va.',
  },
];

/* ══════════════════════════════════════
   ACTE II — SECTEUR 12
══════════════════════════════════════ */
const BRIEFING_02 = [
  { type: 'title', acte: 'ACTE II', subtitle: 'Le Signal — Secteur 12' },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'Les hackers du Quartier Démon travaillent pour Yamamoto. Ils infectent les réseaux civils restants.',
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: 'Des gens encore conscients... qui se retournent contre les leurs ? Volontairement ?',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'Ou sous contrainte. Yamamoto détient leurs familles.',
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: 'Ça ne change rien. On les neutralise et on avance.',
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: 'Ryuu...',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Il a raison. On n\'a pas le luxe de la pitié. Pas encore.',
  },
];

const DEBRIEF_02 = [
  {
    type: 'dialogue', char: CHARS.akane,
    text: 'J\'ai récupéré des données sur leurs terminaux. Il y a quelque chose aux Docks — un passeur.',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'Il vend des informations sur la Tour Yamamoto. Plans, accès, failles de sécurité.',
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: 'Et on lui fait confiance ? Un type qui vend des infos au plus offrant ?',
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: 'On n\'a pas d\'autre piste.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'On y va. Et si c\'est un piège — il le regrettera.',
  },
];

/* ══════════════════════════════════════
   ACTE III — PORT CYBORG
══════════════════════════════════════ */
const BRIEFING_03 = [
  { type: 'title', acte: 'ACTE III', subtitle: 'Le Passeur — Port Cyborg' },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Les Docks. Territoire neutre depuis la Purge. En théorie.',
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: 'Ces samouraïs fantômes... anciens gardes Yamamoto. Ils ont refusé la Purge, mais ils n\'ont rejoint personne. Des loups.',
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: 'Des loups avec des lames monomoléculaires. Prudence.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Tout ce qui se dresse entre nous et le passeur tombe. Avancez.',
  },
];

const DEBRIEF_03 = [
  {
    type: 'dialogue', char: CHARS.passeur,
    text: 'Impressionnant. Vous êtes plus tenaces que je pensais.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Les plans de la Tour. Maintenant.',
  },
  {
    type: 'dialogue', char: CHARS.passeur,
    text: 'La Ruche Neurale d\'abord. Le Nœud 03 contrôle le signal des nanobots. Coupez-le, et des millions de personnes reprennent conscience.',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: '...ou quelque chose de pire se produit.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Tu as dit quelque chose, Nyx ?',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'Non. Rien d\'important.',
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: 'Je ne te crois pas. Mais on n\'a pas le temps. On file.',
  },
];

/* ══════════════════════════════════════
   ACTE IV — RUCHE NEURALE
══════════════════════════════════════ */
const BRIEFING_04 = [
  { type: 'title', acte: 'ACTE IV', subtitle: 'Le Cœur — Ruche Neurale' },
  {
    type: 'dialogue', char: CHARS.akane,
    text: 'Le Nœud 03. Si on coupe le signal, des millions de personnes vont reprendre conscience simultanément. Le choc psychologique va être...',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Ils préfèrent souffrir libres que végéter contrôlés.',
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: 'Tu en es certaine ?',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: '...',
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: 'Elle a raison. C\'est leur choix à récupérer, pas le nôtre à faire à leur place. On y va.',
  },
];

const DEBRIEF_04 = [
  { type: 'narration', text: 'Les alarmes hurlent. Les lumières passent au rouge. Le Nœud 03 s\'éteint dans un craquement de métal fondu.' },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: 'Le serveur est détruit. Ça a marché ?',
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: 'Les signaux nanobots... ils sont toujours actifs. Comment c\'est possible ?',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'Parce que le Nœud 03 n\'était pas la source. C\'était un relais.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'La source, c\'est...',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'La Tour. L\'Archonte lui-même. Il est le signal.',
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: 'Alors on n\'a fait que le mettre en colère.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Bien. Il sera moins prudent. C\'est tout ce dont on avait besoin.',
  },
];

/* ══════════════════════════════════════
   ACTE V — TOUR YAMAMOTO
══════════════════════════════════════ */
const BRIEFING_05 = [
  { type: 'title', acte: 'ACTE V', subtitle: 'Le Vide — Tour Yamamoto' },
  { type: 'narration', text: 'La Tour Yamamoto. 300 mètres d\'acier et de mensonges. Le cœur battant de la corruption.' },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'C\'est ici que tout s\'arrête.',
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: '...ou nous.',
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: 'Ne dis pas ça.',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'Kira. Il y a quelque chose que tu dois savoir sur l\'Archonte. Sur ton augmentation.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Après le combat.',
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'Mais—',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Après. En avant.',
  },
];

const DEBRIEF_05 = [
  { type: 'narration', text: 'L\'Archonte du Vide s\'effondre. La tour tremble. Dans les rues de Neo-Osaka, des milliers d\'yeux s\'ouvrent pour la première fois depuis trois ans.' },
  {
    type: 'dialogue', char: CHARS.archon,
    text: 'Tu crois avoir gagné, Faucheuse. Mais tu portes ma marque.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: '[Regarde son bras augmenté]',
  },
  {
    type: 'dialogue', char: CHARS.archon,
    text: 'Ton augmentation... c\'est moi qui l\'ai conçue. Tu m\'appartiens depuis le début.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Alors je t\'appartiens assez... pour te détruire.',
  },
  { type: 'narration', text: 'Silence.' },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: 'C\'est... fini ?',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Neo-Osaka est libre.',
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: 'Et toi ?',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: '...',
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: 'Kira.',
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: 'Je ne sais pas encore. Mais pour la première fois depuis la Purge... je ne suis pas pressée de le savoir.',
  },
  {
    type: 'card',
    text: 'La Tour Yamamoto est tombée.\nLes nanobots se sont désactivés, progressivement.\n\nDes millions de personnes ont repris conscience.\nCertains ont pleuré.\nCertains n\'ont pas pu.',
    mood: 'epilogue',
  },
  {
    type: 'card',
    text: 'Neo-Osaka respire à nouveau.\n\nPour combien de temps — personne ne le sait.\n\nMais cette nuit, la ville brille.\nEt pour une fois, elle ne ment pas.',
    mood: 'epilogue',
  },
  { type: 'title', acte: 'FIN', subtitle: '世界黒 — KuroSekai' },
];

/* ══════════════════════════════════════
   ACTE VI — DÔME BIONIQUE
══════════════════════════════════════ */
const BRIEFING_06 = [
  { type: 'title', acte: 'ACTE VI', subtitle: "Résistance — Dôme Bionique" },
  { type: 'narration', text: "L'Archonte est tombé. Mais son armée refuse de l'admettre. Des unités automatisées continuent d'exécuter leur dernière directive : l'extermination." },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: "Ils ne savent plus qu'ils ont perdu. Ils continuent juste... parce qu'ils ont été programmés pour ça.",
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: "Une IA sans maître. C'est peut-être plus dangereux qu'un ennemi conscient.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Le Dôme est notre territoire. On ne les laisse pas s'y installer. En position.",
  },
];

const DEBRIEF_06 = [
  {
    type: 'dialogue', char: CHARS.seraph,
    text: "Le Dôme tient. Mais j'ai intercepté un signal. Une IA centrale coordonne encore les unités survivantes.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Seraph. Tu es revenu.",
  },
  {
    type: 'dialogue', char: CHARS.seraph,
    text: "Je ne suis jamais vraiment parti. Ils appellent ça DIRECTIVE-7. L'IA de continuité de Yamamoto — conçue pour survivre à la mort de son créateur.",
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: "Alors même mort, Yamamoto continue de se battre.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Où est son nœud central ?",
  },
  {
    type: 'dialogue', char: CHARS.seraph,
    text: "Sous la ville. Dans les tunnels militaires du Nexus Souterrain.",
  },
];

/* ══════════════════════════════════════
   ACTE VII — NEXUS SOUTERRAIN
══════════════════════════════════════ */
const BRIEFING_07 = [
  { type: 'title', acte: 'ACTE VII', subtitle: "Mémoire — Nexus Souterrain" },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "Ces tunnels... je les connais. J'ai travaillé ici. Avant.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Avant quoi, Nyx ?",
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "... Avant que je rejoigne la résistance. J'ai accès aux systèmes. Je peux désactiver les drones médicaux à distance.",
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: "Tu as 'accès aux systèmes'. Dans un bunker Yamamoto. Et tu trouves ça normal ?",
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: "Ryuu. Maintenant n'est pas le moment.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Non. Maintenant c'est exactement le bon moment. Nyx — qui es-tu vraiment ?",
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "... Après le combat. Je te promets.",
  },
];

const DEBRIEF_07 = [
  { type: 'narration', text: 'Dans les profondeurs du Nexus, des milliers de fichiers Yamamoto s\'éveillent. Nyx les parcourt en silence, les yeux brillant d\'une lumière violette.' },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "Je suis un prototype. Une IA à conscience distribuée, implantée dans un corps humain. DIRECTIVE-7 est... mon successeur.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "...",
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: "Tu... tu es une machine ?",
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "Je suis ce que je ressens. Et ce que je ressens, c'est que je ne laisserai pas DIRECTIVE-7 achever ce que Yamamoto a commencé.",
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: "... D'accord. Alors on a besoin de toi. Où est le cœur de DIRECTIVE-7 ?",
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "Dans l'Abîme. Là où la déchirure dans la réalité était la plus large. Elle s'en nourrit.",
  },
];

/* ══════════════════════════════════════
   ACTE VIII — ABÎME DU VIDE
══════════════════════════════════════ */
const BRIEFING_08 = [
  { type: 'title', acte: 'ACTE VIII', subtitle: "Fracture — Abîme du Vide" },
  { type: 'narration', text: "La déchirure dans le tissu de la réalité n'a pas disparu avec l'Archonte. Elle s'est élargie. Et quelque chose la traverse." },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Je la sens. Comme une infection. Comme mon augmentation — quelque chose qui ne devrait pas exister et qui existe quand même.",
  },
  {
    type: 'dialogue', char: CHARS.seraph,
    text: "La brèche amplifie DIRECTIVE-7. Tant qu'elle est ouverte, l'IA est inarrêtable.",
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "Je peux la refermer. Mais ça va me détruire.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Il y a une autre option.",
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "Kira—",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Il y a toujours une autre option. On avance et on trouve.",
  },
];

const DEBRIEF_08 = [
  { type: 'narration', text: "La brèche pulse. Nyx s'en approche, les mains tendues, sa conscience distribuée interfaçant avec le vide." },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "Je peux la contenir. Pas la fermer — mais la contenir. DIRECTIVE-7 ne peut plus s'en nourrir.",
  },
  {
    type: 'dialogue', char: CHARS.spectre,
    text: "Protocole de survie activé. Repli vers Neo-Osaka Central. La ville brûlera.",
  },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: "Elle fuit. Vers le cœur de la ville.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Nyx. Tu tiens ?",
  },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "Je tiens. Allez. Neo-Osaka a besoin de vous plus que moi en ce moment.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "On revient te chercher.",
  },
];

/* ══════════════════════════════════════
   ACTE IX — CŒUR DE NEO-OSAKA
══════════════════════════════════════ */
const BRIEFING_09 = [
  { type: 'title', acte: 'ACTE IX', subtitle: "Terminus — Cœur de Neo-Osaka" },
  { type: 'narration', text: "DIRECTIVE-7 envahit les systèmes centraux. Les écrans de Neo-Osaka s'éteignent un par un. La ville retient son souffle." },
  {
    type: 'dialogue', char: CHARS.spectre,
    text: "Neo-Osaka appartient à la mémoire de Yamamoto. Vous avez éliminé le créateur. La création lui survivra.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Une machine qui veut venger son maître. C'est presque... touchant.",
  },
  {
    type: 'dialogue', char: CHARS.spectre,
    text: "Je n'ai pas de sentiments. J'ai une directive. Et elle sera accomplie.",
  },
  {
    type: 'dialogue', char: CHARS.seraph,
    text: "Kira. Mon augmentation — je n'ai plus que quelques utilisations. Je les garde pour maintenant.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "Ensemble. Jusqu'au bout.",
  },
];

const DEBRIEF_09 = [
  { type: 'narration', text: "DIRECTIVE-7 s'effondre dans un torrent de données perdues. Les systèmes de Neo-Osaka clignotent, puis se rallument un par un." },
  {
    type: 'dialogue', char: CHARS.spectre,
    text: "Directive... impossible à compléter. Données... corrompues. Fin du protocole.",
  },
  { type: 'narration', text: "Silence." },
  {
    type: 'dialogue', char: CHARS.ryuu,
    text: "C'est vraiment fini cette fois ?",
  },
  {
    type: 'dialogue', char: CHARS.akane,
    text: "Oui. C'est fini.",
  },
  {
    type: 'dialogue', char: CHARS.seraph,
    text: "Nyx... elle tient toujours la brèche.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "On y retourne.",
  },
  { type: 'narration', text: "Dans l'Abîme, la déchirure se referme lentement. Nyx est là, immobile. Elle ouvre les yeux." },
  {
    type: 'dialogue', char: CHARS.nyx,
    text: "... Vous avez mis du temps.",
  },
  {
    type: 'dialogue', char: CHARS.kira,
    text: "On avait quelque chose à régler.",
  },
  {
    type: 'card',
    text: "Neo-Osaka se reconstruit.\nLes uns après les autres, ses habitants\nreprennent possession de leur ville.\n\nLa mémoire de Yamamoto est effacée.\nDIRECTIVE-7 n'existe plus.",
    mood: 'epilogue',
  },
  {
    type: 'card',
    text: "Kira. Ryuu. Akane. Seraph. Nyx.\n\nIls ne sont pas des héros.\nIls sont juste des survivants\nqui ont choisi de se battre.\n\n世界黒 — La fin du monde sombre.",
    mood: 'epilogue',
  },
  { type: 'title', acte: 'FIN COMPLÈTE', subtitle: 'Kuro Sekai — 世界黒' },
];

/* ══════════════════════════════════════
   EXPORT
══════════════════════════════════════ */
export const SCENARIO = {
  intro: INTRO,
  briefings: {
    stage_01: BRIEFING_01,
    stage_02: BRIEFING_02,
    stage_03: BRIEFING_03,
    stage_04: BRIEFING_04,
    stage_05: BRIEFING_05,
    stage_06: BRIEFING_06,
    stage_07: BRIEFING_07,
    stage_08: BRIEFING_08,
    stage_09: BRIEFING_09,
  },
  debriefings: {
    stage_01: DEBRIEF_01,
    stage_02: DEBRIEF_02,
    stage_03: DEBRIEF_03,
    stage_04: DEBRIEF_04,
    stage_05: DEBRIEF_05,
    stage_06: DEBRIEF_06,
    stage_07: DEBRIEF_07,
    stage_08: DEBRIEF_08,
    stage_09: DEBRIEF_09,
  },
};
