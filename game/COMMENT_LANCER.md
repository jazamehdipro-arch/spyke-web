# 📱 Comment lancer Croisio sur ton téléphone

Pas besoin de savoir coder. Suis les étapes dans l'ordre.

---

## Ce qu'il te faut

1. **Un ordinateur** (Mac ou PC)
2. **Ton iPhone** (ou Android)
3. **10 minutes**

---

## Étape 1 — Installer Node.js (une seule fois)

Node.js, c'est l'outil qui fait tourner le jeu sur ton ordi.

1. Va sur 👉 **https://nodejs.org**
2. Clique sur le gros bouton **"LTS"** (version recommandée)
3. Ouvre le fichier téléchargé et clique "Suivant" jusqu'au bout

---

## Étape 2 — Récupérer le jeu

1. Ouvre le **Terminal** :
   - **Mac** : cherche "Terminal" dans Spotlight (loupe en haut à droite)
   - **Windows** : cherche "PowerShell" dans le menu Démarrer
2. Copie-colle cette commande et appuie sur Entrée :

```bash
git clone https://github.com/jazamehdipro-arch/spyke-web.git
```

3. Puis entre dans le dossier du jeu :

```bash
cd spyke-web/game
git checkout claude/mobile-game-dev-9aTZd
```

---

## Étape 3 — Installer et lancer

Copie-colle ces deux commandes, une par une :

```bash
npm install
```

(attends que ça finisse, ça prend ~2 min)

```bash
npx expo start
```

Un **QR code** va apparaître dans le terminal. 🎉

---

## Étape 4 — Voir le jeu sur ton iPhone

1. Sur ton iPhone, installe l'app **Expo Go** depuis l'App Store
   👉 https://apps.apple.com/app/expo-go/id982107779
2. Ouvre l'**appareil photo** de l'iPhone
3. Vise le **QR code** affiché sur ton ordi
4. Touche la notification qui apparaît → le jeu se lance ! 🦊

> ⚠️ Ton iPhone et ton ordi doivent être sur le **même Wi-Fi**.

---

## Si ça bloque

- **"command not found: git"** → installe Git : https://git-scm.com/downloads
- **"command not found: npm"** → Node.js n'est pas installé, refais l'étape 1
- **Le QR code ne marche pas** → vérifie que tu es sur le même Wi-Fi, et dans Expo Go essaie de taper l'URL manuellement (elle s'affiche sous le QR code)

---

## Tu veux que je t'aide demain ?

Reviens me parler quand tu es sur ton ordi. Si une commande renvoie une erreur,
copie-colle moi le message rouge et je te débloque tout de suite.
