# Sprint 5bis — Multi-tenant réel

## Objectif
Passer d'un modèle mono-utilisateur (chaque `user_id` = son propre espace) à un modèle **entreprise partagée** où plusieurs utilisateurs (Admin, DRH, Comptable, Manager) accèdent aux mêmes données selon leur rôle.

## 1. Schéma DB (migration unique)

### Nouvelles tables
- **`entreprise_members`** : lien N-N entre `auth.users` et `entreprises`
  - `entreprise_id`, `user_id`, `role` (enum `app_role`), `invited_by`, `joined_at`
  - Unique(entreprise_id, user_id)
- **`entreprise_invitations`** : invitations en attente
  - `entreprise_id`, `email`, `role`, `token` (uuid), `invited_by`, `expires_at`, `accepted_at`

### Ajout `entreprise_id` sur toutes les tables métier
`employees`, `conges`, `contrats`, `payroll_history`, `payroll_params`, `conventions`, `convention_categories`, `attestations_log`
- Backfill : pour chaque ligne, `entreprise_id = (SELECT id FROM entreprises WHERE user_id = table.user_id LIMIT 1)`
- Créer une entreprise par défaut pour les users qui n'en ont pas
- Créer une ligne `entreprise_members` (role=admin) pour chaque propriétaire actuel
- Puis `NOT NULL` sur `entreprise_id`

### Fonctions security definer
- `current_entreprise_id()` : retourne la 1ʳᵉ entreprise du user courant (ou celle sélectionnée via app_metadata)
- `is_member_of(_entreprise_id, _role?)` : vérifie appartenance + rôle optionnel
- Refonte de `has_role` pour scoper par entreprise

### RLS refondue
Chaque table métier :
- SELECT : `is_member_of(entreprise_id)` (tout membre lit)
- INSERT/UPDATE/DELETE : `is_member_of(entreprise_id, 'admin')` OR `is_member_of(entreprise_id, 'drh')`
- `payroll_history` en lecture aussi pour `comptable`
- `manager` : lecture employés + validation congés uniquement

`entreprise_members` : lecture par membres de la même entreprise, écriture par admin uniquement.
`entreprise_invitations` : lecture/écriture admin uniquement, plus un accès par token pour l'acceptation.

## 2. Backend — Edge Functions

- **`invite-member`** : admin envoie invitation → crée row `entreprise_invitations` + envoie email avec lien `/invitation?token=...`. Utilise `LOVABLE_API_KEY` via le queue email existant (ou fallback simple si pas encore configuré).
- **`accept-invitation`** : appelée par la page `/invitation`, valide token + expires_at, crée `entreprise_members`, marque `accepted_at`.

## 3. Frontend

### Contexte entreprise
- Nouveau hook `useEntreprise()` : charge l'entreprise courante + rôle du user (via `entreprise_members`).
- Toutes les requêtes existantes utilisent désormais `entreprise_id` (plus `user_id`) via helper.

### `EquipePage` refonte
- Liste des membres actuels (avec rôle, badge)
- Formulaire invitation (email + rôle)
- Liste invitations en attente (avec bouton renvoyer / révoquer)
- Visible seulement si role = admin

### Nouvelle page `/invitation`
- Récupère token depuis URL
- Si user non connecté → redirige vers `/auth` avec paramètre pour revenir
- Sinon appelle `accept-invitation` et redirige vers `/`

### Gating UI par rôle
Dans `Index.tsx`, les onglets sont filtrés selon le rôle :
- `comptable` : Dashboard, Déclarations, Paie (lecture)
- `manager` : Dashboard, Employés (lecture), Congés
- `drh`/`admin` : tout

## 4. Mapping code
`useSupabaseData.ts` et `useRH.ts` :
- Ajouter `entreprise_id` sur tous les inserts (via `useEntreprise()`).
- Retirer le filtre `user_id` (RLS s'en charge).

## 5. Tests
- Migration idempotente vérifiée
- Test manuel Playwright : invitation → acceptation → visibilité partagée.

## Détails techniques

```text
Ordre migration :
1. CREATE TABLE entreprise_members + grants + RLS
2. CREATE TABLE entreprise_invitations + grants + RLS
3. ALTER tables métier: ADD COLUMN entreprise_id UUID
4. Backfill (DO block)
5. NOT NULL + FK
6. DROP anciennes policies user_id
7. CREATE nouvelles policies is_member_of
8. Fonctions helper security definer
```

## Hors scope (livré plus tard)
- Sélecteur multi-entreprises (un user dans plusieurs entreprises) — infra prête mais UI mono pour l'instant
- Email queue custom pour invitations si pas encore setup → fallback simple avec `supabase.auth.admin.inviteUserByEmail`

## Livrables
- 1 migration SQL
- 2 edge functions (`invite-member`, `accept-invitation`)
- 1 hook `useEntreprise`
- Page `/invitation`
- Refonte `EquipePage`, `Index.tsx` (gating)
- Adaptation `useSupabaseData`, `useRH`
