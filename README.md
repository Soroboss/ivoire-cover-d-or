# ivoire-couvee-or

Application React + TypeScript + Vite (SPA avec `react-router-dom`).

## Démarrer en local

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
```

- Le site statique généré est dans `dist/`.
- `vite.config.ts` est configuré avec `base: './'` pour que les assets fonctionnent aussi en sous-dossier.

## Déployer (recommandé)

### Netlify

- Un `netlify.toml` est présent (build + publish).
- La redirection SPA est configurée pour que les routes React Router (ex: `/dashboard`) fonctionnent en direct.

### Vercel

- Un `vercel.json` est présent avec une réécriture vers `/index.html` (SPA fallback).

## Déployer “statique” (n’importe quel hébergeur)

1. Lancer `npm run build`
2. Publier le contenu du dossier `dist/`
3. Activer une redirection “SPA fallback” vers `index.html` si l’hébergeur le permet (sinon, les URLs profondes renverront 404).
