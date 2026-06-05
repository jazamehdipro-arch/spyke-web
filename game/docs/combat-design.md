# Système de Combat — Design Document

## Principe de base

Combat en temps réel simultané. À chaque tour, les deux joueurs ont 3 secondes (à tester, peut-être 4-5) pour choisir une action en même temps. Les deux choix se révèlent et se résolvent ensemble.

Le cœur du jeu : le **mind game** — lire l'adversaire et anticiper son choix.

---

## Les 3 actions

| Action | Coût | Effet |
|--------|------|-------|
| **Attaquer** | dépense de l'énergie | frappe l'adversaire |
| **Défendre** | gratuit | se protéger, ne fait pas progresser |
| **Charger** | gratuit | +1 énergie, mais laisse vulnérable |

---

## L'énergie

- S'accumule en chargeant
- L'énergie de l'adversaire est **visible à l'écran** → permet d'anticiper
- 4 niveaux d'attaque (1 à 4 énergies) : plus c'est cher, plus c'est fort… et risqué

---

## Table de résolution

|               | Adversaire attaque                    | Adversaire défend                 | Adversaire charge           |
|---------------|---------------------------------------|-----------------------------------|-----------------------------|
| **Tu attaques** | le plus fort passe / les deux touchent | bloqué, ton énergie est gaspillée | tu touches, il prend cher   |
| **Tu défends**  | tu bloques l'attaque                  | rien ne se passe                  | il monte, tu perds ton tour |
| **Tu charges**  | tu prends cher                        | tu montes tranquille              | vous montez tous les deux   |

**Logique pierre-feuille-ciseaux :**
- Attaque bat la Charge
- Défense bat l'Attaque
- Charge bat la Défense (en rendant plus fort pour la suite)

Aucune option dominante.

---

## Le risque des grosses attaques

Les attaques ne sont pas que "plus de dégâts" — plus c'est cher, plus c'est risqué :

- **Attaque ×1** : faible, rapide, sûre
- **Attaque ×2** : moyenne
- **Attaque ×3** : forte
- **Attaque ×4** : dévastatrice — si elle est défendue, tu perds tout (ou elle est lente/télégraphiée)

→ La grosse attaque est un **pari**, pas un automatisme.

---

## Les 3 réglages critiques à playtester

1. **La table de résolution** — l'équilibre global
2. **La durée du timer** — pression vs réflexion (3s → 5s ?)
3. **Le risque/coût des grosses attaques** — éviter le spam de la meilleure option

---

## Lien avec les monstres (DA)

Chaque monstre joue différemment :

| Monstre | Style | Particularité |
|---------|-------|---------------|
| Salamandre samouraï | Agressif | Tape fort, fragile |
| Panda fumée | Évasif | Dur à toucher |
| Axolotl sorcier | Manipulation | Vol ou charge rapide d'énergie |

→ Donne une raison de **collectionner** et relie le combat à la DA.

---

## TODO / À creuser

- [ ] Capacités spéciales par type de monstre (passifs, actifs ?)
- [ ] Prototype du timer + résolution visuelle
- [ ] HP des monstres (flat ou basé sur le niveau ?)
- [ ] Récompenses (XP, objets, croisement validé)
- [ ] Mode asynchrone (pour les croisements GPS) vs temps réel
