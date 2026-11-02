# Règles de paie protégées — G-SenPaie

Ces règles ont été validées contre le classeur de référence SENEXCELPAIE et sont vérifiées
par les tests (`src/lib/payroll.excel.test.ts`, `src/test/*.test.ts`) à chaque modification (CI GitHub).

**Ne pas modifier `src/lib/payroll.ts`, `src/lib/legal.ts`, `src/lib/dads.ts` ni supprimer ces tests
sans que l'ensemble des tests passe.** Si un test échoue, c'est le calcul qu'il faut corriger, pas le test.

| Règle | Source |
|---|---|
| IR : barème sur le revenu annuel entier (abattement 30 % plafonné à 900 000), puis réduction pour charges de famille (10 % à 45 % bornée min/max selon les parts) | Excel SENEXCELPAIE, CGI |
| Parts IR : marié(e) ou veuf(ve) avec enfants = 1,5 + 0,5/enfant, sinon 1 + 0,5/enfant, plafond 5 | Excel |
| Taux horaire HS = (base + sursalaire) / (40 × 52 / 12) ; absences et maladie / 173,33 | Excel |
| Ancienneté = années révolues au lendemain de la fin de mois (DATEDIF) ; prime = % × salaire de base | Excel, choix client |
| Maladie : heures déduites puis indemnisées au taux de maintien (défaut 100 %) | — |
| Prestataire : BRS 5 %, ni IR, TRIMF, IPRES, CSS, CFCE, prime d'ancienneté ni transport | Excel |
| CSS AT et IPM : taux, répartition et plafond paramétrables | Choix client |
| Statut et situation de famille normalisés (« Cadre », « CADRES », « Mariée »…) | — |
| Congés : 2 j ouvrables/mois, +1/+2/+3/+7 j après 10/15/20/25 ans | CCNI 2019 art. 70 (palier 25 ans à confirmer sur le JO) |
| Cumul des congés limité à 36 mois | Hypothèse de prudence, non trouvée dans la CCNI : à valider par un juriste |
| Indemnité de congés = salaire mensuel / 24 par jour | 1/12 de la rémunération annuelle pour 24 jours |
| Préavis : ouvriers et employés 1 mois, agents de maîtrise 2 mois, cadres 3 mois | CCNI 2019 art. 75 |
| DADS : cumul des bulletins clôturés (bulletins_mois), jamais d'extrapolation × 12 | — |
| Clôture unique : bulletins figés + remise à zéro des absences, HS et paniers ; un mois clôturé est verrouillé (rouvrir pour refaire) | — |
| Période d'essai max : ouvriers et employés 1 mois, agents de maîtrise 2, cadres 3 | CCNI 2019 art. 23 |
| CDD : 2 ans max par contrat, 1 renouvellement, 4 ans cumulés max | Code du travail 2026 (loi n° 2026-18) art. 100 |
| Toute donnée saisie est échappée avant insertion dans un HTML (bulletins, attestations, STC, rapports) | Sécurité |
