# Plan V2 — G-SENPAIE : rendre l'application plus attractive

Objectif : passer d'un outil de paie fonctionnel (100% métier) à une plateforme RH agréable, moderne et différenciante, sans casser l'existant.

## 1. Expérience utilisateur & design

- **Onboarding guidé** : assistant en 3 étapes à la première connexion (créer l'entreprise → ajouter le 1er employé → générer le 1er bulletin) avec checklist de progression dans le Dashboard.
- **Mode démo** : bouton « Explorer avec des données d'exemple » générant un jeu de données réaliste sénégalais (supprimable en 1 clic) — sans violer la règle « nouveaux comptes = formulaires vides ».
- **Refonte visuelle ciblée** : animations micro-interactions (Framer Motion), transitions de pages, squelettes de chargement partout, états vides illustrés et actionnables.
- **Notifications in-app** : centre de notifications (cloche) regroupant alertes CDD/essai, congés en attente, clôtures, avec badge non-lus.

## 2. Fonctionnalités à forte valeur

- **Assistant IA de paie** (Lovable AI, sans clé) : chat intégré répondant en français aux questions (« combien coûte un salarié à 300 000 FCFA brut ? », « explique la retenue IR de ce bulletin ») + génération de textes (contrats, attestations) pré-remplis.
- **Portail employé (self-service)** : accès en lecture seule par employé (lien d'invitation + compte) pour consulter/télécharger ses bulletins, demander des congés, voir son solde. Validation des demandes par Admin/DRH.
- **Pret & avances sur salaire** : module d'avances avec échéancier de retenue automatique intégré au moteur de paie (déduction étalée sur N mois, plafond légal).
- **Rappels automatiques par email** : fin de période d'essai, fin de CDD à J-30/J-7, congés en attente de validation (Edge Function planifiée).

## 3. Pilotage & reporting

- **Dashboard enrichi** : comparateur N vs N-1, projection de masse salariale annuelle, coût complet employeur par employé, répartition par convention/département.
- **Rapports planifiés** : envoi mensuel automatique du livre de paie + synthèse cotisations par email à la clôture.

## 4. Technique & qualité

- **PWA** : installable sur mobile, mode hors-ligne en lecture (cache des derniers bulletins), icône et manifest.
- **Performance** : pagination serveur des listes longues, prefetch des routes au survol.
- **Internationalisation de base** : extraction des libellés (i18next) pour préparer Wolof/Anglais ultérieurement.
- **Emails** : finaliser l'envoi des bulletins (domaine `g-senpaie.online`) — prérequis déjà identifié.

## Découpage en lots (ordre proposé)

| Lot | Contenu | Valeur |
|-----|---------|--------|
| V2.1 | Onboarding, mode démo, notifications in-app, micro-animations | Adoption immédiate |
| V2.2 | Assistant IA de paie + génération de documents | Différenciation forte |
| V2.3 | Portail employé self-service + demandes de congés | Argument commercial majeur |
| V2.4 | Avances/prêts + rappels email automatiques | Complétude métier RH |
| V2.5 | Dashboard enrichi, rapports planifiés, PWA, perf | Fidélisation |

## Détails techniques

- Nouvelles tables : `notifications`, `demandes_conges` (statut en_attente/validee/refusee), `avances_pret` + `echeances_avance`, liens `employees.user_id` pour le portail — chacune avec GRANT + RLS multi-tenant (`entreprise_id`) et rôles Admin/DRH.
- Rôles : ajout du rôle `employe` (lecture seule de ses propres données) dans `app_role`, `has_role` existant réutilisé.
- Edge Functions : `notify-reminders` (cron), `send-payslip-email` (domaine g-senpaie.online), `ai-assistant` (Lovable AI Gateway).
- Aucune régression sur les 38 tests existants ; nouveaux tests pour avances et droits portail.
