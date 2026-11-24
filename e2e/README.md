# Recette en navigateur (faux Supabase)

Parcours automatiques de l'application avec Playwright. `mock.cjs` imite l'API Supabase en mémoire
(sans règles d'accès : le cloisonnement est testé par `supabase/tests/run.sh`).

```sh
npm run build && npx vite preview --port 5201 --host 127.0.0.1 &
cd e2e
node tour.cjs            # affiche chacun des 15 modules (ajoutez « mobile » pour le format téléphone)
node flows.cjs           # bulletin, clôture, déclarations, congés, contrat, STC, avances, paramètres…
node crud.cjs            # création, validation, doublon, modification, suppression d'un salarié
node portail.cjs         # espace salarié après clôture
```

Prérequis : Playwright installé (`npm i -g playwright` ou `npx playwright install chromium`).
Les captures et fichiers générés vont dans `e2e/sorties/` (ignoré par Git).
