## Roadmap RH complète — 5 sprints

Implémentation séquentielle des 5 sprints identifiés dans l'audit. Travail conséquent (~8-10j de dev condensé).

### Sprint 1 — Conformité légale Sénégal
- **Export déclaration IPRES/CSS mensuelle** : nouveau composant `DeclarationIPRES.tsx` générant un PDF récapitulatif (matricule, nom, salaire brut, IPRES RG salarié+patronal, RCC, CSS AF+AT) + export Excel format tabulaire compatible saisie portail
- **Livre de paie** : `LivreDePaie.tsx` — registre chronologique PDF (mois, employé, brut, net, charges, signature) conforme art. L.116
- **DADS annuelle** : récap annuel par employé (cumul brut, IR, IPRES, CSS) export Excel
- Nouvel onglet "Déclarations" dans la sidebar

### Sprint 2 — Congés & absences
- Nouvelle table `conges` (employee_matricule, type [paye/maladie/maternite/sans_solde], date_debut, date_fin, jours, statut, motif)
- Nouvelle table `absences` (similaire, pour AT/maladie avec impact paie)
- Compteur auto : 2j ouvrables/mois (24j/an conformément au Code SN)
- Page `CongesPage.tsx` : liste, ajout, validation, soldes par employé
- Impact paie : déduction jours sans solde sur bulletin du mois

### Sprint 3 — Sorties (STC + attestations)
- **Solde de tout compte** : composant `SoldeToutCompte.tsx` calculant préavis (1-3 mois selon ancienneté), congés non pris, indemnité de licenciement (25%-30%-40% selon tranches d'ancienneté SN)
- **Attestations** : 3 templates PDF (travail, salaire, présence) — génération 1 clic depuis fiche employé
- Champ `dateSortie` + `motifSortie` sur Employee

### Sprint 4 — Contrats de travail
- Templates PDF CDI, CDD, Stage avec mentions légales SN (période d'essai, durée, rémunération, lieu, convention applicable)
- Génération depuis fiche employé
- Stockage métadonnées contrat (type, dateDebut, dateFin, periodeEssai) dans table `contrats`

### Sprint 5 — Multi-utilisateurs & rôles
- Table `user_roles` (enum: admin, drh, comptable, manager) + fonction `has_role` SECURITY DEFINER
- Table `entreprise_members` liant users à une entreprise partagée
- Refonte RLS : lecture/écriture selon rôle et appartenance entreprise
- Page "Équipe" pour inviter membres
- Restrictions UI : comptable = lecture paie, manager = lecture employés de son équipe, DRH = tout

### Section technique

**Migrations DB nécessaires (8 tables)** :
1. `conges` + GRANT + RLS
2. `absences` + GRANT + RLS
3. `contrats` + GRANT + RLS
4. `attestations_log` (audit) + GRANT + RLS
5. `app_role` enum + `user_roles` + has_role function
6. `entreprise_members` + GRANT + RLS
7. ALTER `employees` ADD COLUMN dateSortie, motifSortie
8. ALTER `payroll_history` ADD COLUMN jours_absence

**Modules code à créer (~25 fichiers)** :
- `src/lib/legal.ts` : calculs préavis, indemnité licenciement, soldes congés
- `src/lib/contractTemplates.ts` : templates HTML contrats
- `src/lib/attestationTemplates.ts` : templates attestations
- `src/components/senpaie/DeclarationIPRES.tsx`
- `src/components/senpaie/LivreDePaie.tsx`
- `src/components/senpaie/DADSAnnuelle.tsx`
- `src/components/senpaie/CongesPage.tsx`
- `src/components/senpaie/AbsencesPage.tsx`
- `src/components/senpaie/SoldeToutCompte.tsx`
- `src/components/senpaie/AttestationModal.tsx`
- `src/components/senpaie/ContratModal.tsx`
- `src/components/senpaie/EquipePage.tsx`
- `src/hooks/useConges.ts`, `useAbsences.ts`, `useContrats.ts`, `useRoles.ts`
- Mise à jour `NAV_ITEMS` + `Index.tsx` routing

**Stratégie d'exécution** :
- Sprint 1 → 2 → 3 → 4 → 5 strictement séquentiel (Sprint 5 RLS dépend de toutes les tables précédentes)
- Migrations groupées en début de chaque sprint pour approbation utilisateur
- Tests unitaires ajoutés pour `legal.ts` (calculs juridiques critiques)
- Aucune dépendance npm supplémentaire (jspdf + html2canvas + xlsx déjà installés)

**Risques identifiés** :
- Sprint 5 (RLS multi-tenant) demande refonte de toutes les policies existantes — risque de régression
- Code SN évolutif : barèmes indemnités licenciement à externaliser dans paramètres pour ajustements
