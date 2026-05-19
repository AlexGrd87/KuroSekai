# KuroSekai — 世界黒

> Gacha game 3D manga-style — navigateur web

## Concept

KuroSekai ("Monde Noir") est un jeu gacha navigateur en 3D manga. Le joueur invoque des personnages issus d'un univers dystopique japonais, les fait combattre et progresser.

## Stack technique

- **Frontend** : Three.js (rendu 3D) + PixiJS (UI/effets 2D)
- **Framework** : Vite + Vanilla JS (ou React)
- **Backend** : Node.js + Express
- **BDD** : MongoDB
- **Auth** : JWT

## Structure du projet

```
KuroSekai/
├── client/          # Frontend (Three.js, UI, animations)
├── server/          # Backend (API, gacha engine, auth)
├── assets/          # Modèles 3D, textures, sons
└── docs/            # Design doc, lore, roadmap
```

## Roadmap

- [ ] Prototype UI (menu principal, écran de pull)
- [ ] Système de gacha (rates, bannières)
- [ ] Rendu 3D des personnages (Three.js)
- [ ] Combat au tour par tour
- [ ] Système de progression
- [ ] Backend & comptes joueurs
