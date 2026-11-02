# Consignes pour tout agent (Lovable, Claude, Copilot…) travaillant sur G-SenPaie

G-SenPaie calcule des salaires, des impôts et des déclarations légales au Sénégal.
Une erreur de calcul a des conséquences financières et légales pour les clients.

## Règles impératives

1. **Ne jamais réécrire, remplacer ni « simplifier » les fichiers de calcul** sans faire passer tous les tests :
   `src/lib/payroll.ts`, `src/lib/legal.ts`, `src/lib/dads.ts`.
2. **Ne jamais supprimer ni affaiblir les tests** : `src/lib/*.test.ts`, `src/test/*.test.ts`, `src/lib/__fixtures__/`.
   Si un test échoue après une modification, c'est la modification qu'il faut corriger, pas le test.
3. **Lors d'une fusion ou d'une synchronisation de branches**, ne jamais résoudre un conflit sur ces fichiers
   en prenant une seule version entière : fusionner ligne à ligne et relancer `npx vitest run`.
4. Les règles métier et leurs sources sont dans `src/lib/PAIE_REGLES.md`.
5. Toute nouvelle dépendance doit être ajoutée avec `npm install` pour garder `package-lock.json` synchronisé
   (la CI utilise `npm ci`, qui échoue sinon).

## Vérification avant chaque commit

```sh
npx tsc -p tsconfig.app.json --noEmit && npx vitest run && npm run build
```

La CI GitHub (`.github/workflows/ci.yml`) exécute ces mêmes contrôles à chaque push.
