// ══════════════════════════════════════════════════════════════════════════════
//  États de paie G-SENPAIE : livre de paie, résumé des cotisations,
//  journal comptable SYSCOHADA et cumuls annuels.
//  Fonctions pures (aucun accès réseau) : testées dans etats.test.ts.
// ══════════════════════════════════════════════════════════════════════════════
import type { Employee, PayrollParams, PayrollResult } from "./payroll";

/** Une ligne de paie : identité du salarié + résultat du calcul pour la période */
export interface LigneBulletin {
  matricule: string;
  prenom: string;
  nom: string;
  fonction: string;
  categorie: string;
  statut: string;
  contrat: string;
  paie: PayrollResult;
}

/** Archive d'un mois clôturé (stockée dans payroll_history.data) */
export interface ArchiveMois {
  mois: number; // 0 = janvier
  annee: number;
  bulletins: LigneBulletin[];
  params?: PayrollParams;
}

export function versLigne(emp: Employee, paie: PayrollResult): LigneBulletin {
  return {
    matricule: emp.matricule, prenom: emp.prenom, nom: emp.nom, fonction: emp.fonction,
    categorie: emp.categorie, statut: emp.statut, contrat: emp.contrat, paie,
  };
}

const somme = (lignes: LigneBulletin[], f: (p: PayrollResult) => number) =>
  lignes.reduce((s, l) => s + (f(l.paie) || 0), 0);

// ──────────────────────────────────────────────────────────────────────────────
//  Livre de paie (rubriques en lignes, salariés en colonnes, comme l'Excel)
// ──────────────────────────────────────────────────────────────────────────────
export type TypeRubrique = "gain" | "retenue" | "total" | "net" | "patronal" | "info";

export interface RubriqueLivre {
  code: string;
  libelle: string;
  type: TypeRubrique;
  valeur: (p: PayrollResult) => number;
}

export const RUBRIQUES_LIVRE: RubriqueLivre[] = [
  { code: "100", libelle: "Salaire de base / honoraires", type: "gain", valeur: (p) => p.salaireBase },
  { code: "110", libelle: "Sursalaire", type: "gain", valeur: (p) => p.sursalaire },
  { code: "120", libelle: "Prime d'ancienneté", type: "gain", valeur: (p) => p.primeAnc },
  { code: "130", libelle: "Heures sup. 115 %", type: "gain", valeur: (p) => p.mtHS115 },
  { code: "131", libelle: "Heures sup. 140 %", type: "gain", valeur: (p) => p.mtHS140 },
  { code: "132", libelle: "Heures sup. 160 %", type: "gain", valeur: (p) => p.mtHS160 },
  { code: "133", libelle: "Heures sup. 200 %", type: "gain", valeur: (p) => p.mtHS200 },
  { code: "140", libelle: "Retenue absences", type: "retenue", valeur: (p) => -p.retAbsence },
  { code: "150", libelle: "Indemnité maladie", type: "gain", valeur: (p) => p.indMaladie },
  { code: "199", libelle: "SALAIRE BRUT", type: "total", valeur: (p) => p.brut },
  { code: "200", libelle: "Impôt sur le revenu (IR)", type: "retenue", valeur: (p) => p.ir },
  { code: "210", libelle: "TRIMF", type: "retenue", valeur: (p) => p.trimf },
  { code: "220", libelle: "BRS (prestataires)", type: "retenue", valeur: (p) => p.brs || 0 },
  { code: "230", libelle: "IPRES RG salarié", type: "retenue", valeur: (p) => p.ipresRG_s },
  { code: "240", libelle: "IPRES RCC salarié", type: "retenue", valeur: (p) => p.ipresRC_s },
  { code: "250", libelle: "IPM salarié", type: "retenue", valeur: (p) => p.ipm_s },
  { code: "299", libelle: "TOTAL RETENUES", type: "total", valeur: (p) => p.totalRet },
  { code: "300", libelle: "Indemnité de transport", type: "gain", valeur: (p) => p.transport },
  { code: "310", libelle: "Prime de panier", type: "gain", valeur: (p) => p.primePanier },
  { code: "320", libelle: "Indemnité kilométrique", type: "gain", valeur: (p) => p.indKilometrique },
  { code: "330", libelle: "Avances et retenues diverses", type: "retenue", valeur: (p) => p.totalAvances },
  { code: "399", libelle: "NET À PAYER", type: "net", valeur: (p) => p.net },
  { code: "400", libelle: "CFCE", type: "patronal", valeur: (p) => p.cfce },
  { code: "410", libelle: "IPRES RG patronal", type: "patronal", valeur: (p) => p.ipresRG_p },
  { code: "420", libelle: "IPRES RCC patronal", type: "patronal", valeur: (p) => p.ipresRC_p },
  { code: "430", libelle: "CSS allocations familiales", type: "patronal", valeur: (p) => p.css_af },
  { code: "440", libelle: "CSS accidents du travail", type: "patronal", valeur: (p) => p.css_at },
  { code: "450", libelle: "IPM patronal", type: "patronal", valeur: (p) => p.ipm_p },
  { code: "499", libelle: "TOTAL CHARGES PATRONALES", type: "total", valeur: (p) => p.chargesPat },
  { code: "999", libelle: "MASSE SALARIALE", type: "total", valeur: (p) => p.masse },
];

export interface LigneLivre {
  rubrique: RubriqueLivre;
  valeurs: number[];
  total: number;
}

/** Livre de paie : une ligne par rubrique non nulle, une colonne par salarié + total */
export function livreDePaie(lignes: LigneBulletin[]): LigneLivre[] {
  return RUBRIQUES_LIVRE.map((rubrique) => {
    const valeurs = lignes.map((l) => rubrique.valeur(l.paie) || 0);
    return { rubrique, valeurs, total: valeurs.reduce((s, v) => s + v, 0) };
  }).filter((l) => l.rubrique.type === "total" || l.rubrique.type === "net" || l.valeurs.some((v) => Math.abs(v) >= 0.5));
}

// ──────────────────────────────────────────────────────────────────────────────
//  Résumé des cotisations par organisme (onglet « ETAT RESUME COTISATIONS »)
// ──────────────────────────────────────────────────────────────────────────────
export type Organisme = "DGID" | "IPRES" | "CSS" | "IPM";

export interface LigneCotisation {
  code: string;
  libelle: string;
  organisme: Organisme;
  tauxSalarial: number;
  tauxPatronal: number;
  assiette: number; // brut soumis
  base: number;     // base plafonnée
  montantSalarial: number;
  montantPatronal: number;
  effectif: number;
}

export interface ResumeCotisations {
  lignes: LigneCotisation[];
  sousTotaux: Record<Organisme, { salarial: number; patronal: number; total: number }>;
  total: { salarial: number; patronal: number; total: number };
  effectif: number;
}

export function resumeCotisations(lignes: LigneBulletin[], p: PayrollParams): ResumeCotisations {
  const sal = lignes.filter((l) => l.paie.regime === "salarie");
  const prest = lignes.filter((l) => l.paie.regime === "prestataire");
  const brutSal = somme(sal, (x) => x.brut);
  const brutPrest = somme(prest, (x) => x.brut);
  const avecIPM = lignes.filter((l) => (l.paie.ipm_s || 0) + (l.paie.ipm_p || 0) > 0);
  const cadres = sal.filter((l) => (l.paie.baseIPRES_RC ?? 0) > 0 || l.paie.ipresRC_s > 0);
  const ts = (c: { taux: number; tauxSalarial: number }) => c.taux * c.tauxSalarial;
  const tp = (c: { taux: number; tauxPatronal: number }) => c.taux * c.tauxPatronal;

  const out: LigneCotisation[] = [
    { code: "100", libelle: "Retenue impôt sur le revenu (IR)", organisme: "DGID", tauxSalarial: 0, tauxPatronal: 0,
      assiette: brutSal, base: brutSal, montantSalarial: somme(sal, (x) => x.ir), montantPatronal: 0, effectif: sal.length },
    { code: "200", libelle: "Retenue TRIMF", organisme: "DGID", tauxSalarial: 0, tauxPatronal: 0,
      assiette: brutSal, base: brutSal, montantSalarial: somme(sal, (x) => x.trimf), montantPatronal: 0, effectif: sal.length },
    { code: "300", libelle: "CFCE", organisme: "DGID", tauxSalarial: ts(p.CFCE), tauxPatronal: tp(p.CFCE),
      assiette: brutSal, base: brutSal, montantSalarial: 0, montantPatronal: somme(sal, (x) => x.cfce), effectif: sal.length },
    { code: "400", libelle: "BRS sur honoraires", organisme: "DGID", tauxSalarial: p.BRS.taux, tauxPatronal: 0,
      assiette: brutPrest, base: brutPrest, montantSalarial: somme(prest, (x) => x.brs || 0), montantPatronal: 0, effectif: prest.length },
    { code: "500", libelle: "IPRES régime général", organisme: "IPRES", tauxSalarial: ts(p.IPRES_RG), tauxPatronal: tp(p.IPRES_RG),
      assiette: brutSal, base: somme(sal, (x) => x.baseIPRES_RG ?? 0),
      montantSalarial: somme(sal, (x) => x.ipresRG_s), montantPatronal: somme(sal, (x) => x.ipresRG_p), effectif: sal.length },
    { code: "600", libelle: "IPRES régime cadres", organisme: "IPRES", tauxSalarial: ts(p.IPRES_RCC), tauxPatronal: tp(p.IPRES_RCC),
      assiette: somme(cadres, (x) => x.brut), base: somme(cadres, (x) => x.baseIPRES_RC ?? 0),
      montantSalarial: somme(cadres, (x) => x.ipresRC_s), montantPatronal: somme(cadres, (x) => x.ipresRC_p), effectif: cadres.length },
    { code: "700", libelle: "CSS allocations familiales", organisme: "CSS", tauxSalarial: 0, tauxPatronal: p.CSS_AF.taux,
      assiette: brutSal, base: somme(sal, (x) => x.baseCSS), montantSalarial: 0, montantPatronal: somme(sal, (x) => x.css_af), effectif: sal.length },
    { code: "800", libelle: "CSS accidents du travail", organisme: "CSS", tauxSalarial: 0, tauxPatronal: p.CSS_AT.taux,
      assiette: brutSal, base: somme(sal, (x) => x.baseCSS_AT), montantSalarial: 0, montantPatronal: somme(sal, (x) => x.css_at), effectif: sal.length },
    { code: "900", libelle: "IPM", organisme: "IPM", tauxSalarial: ts(p.IPM), tauxPatronal: tp(p.IPM),
      assiette: somme(avecIPM, (x) => x.brut), base: somme(avecIPM, (x) => x.baseIPM),
      montantSalarial: somme(avecIPM, (x) => x.ipm_s), montantPatronal: somme(avecIPM, (x) => x.ipm_p), effectif: avecIPM.length },
  ];

  const sousTotaux = {} as ResumeCotisations["sousTotaux"];
  for (const org of ["DGID", "IPRES", "CSS", "IPM"] as Organisme[]) {
    const ls = out.filter((l) => l.organisme === org);
    const s = ls.reduce((a, l) => a + l.montantSalarial, 0);
    const pt = ls.reduce((a, l) => a + l.montantPatronal, 0);
    sousTotaux[org] = { salarial: s, patronal: pt, total: s + pt };
  }
  const tS = out.reduce((a, l) => a + l.montantSalarial, 0);
  const tP = out.reduce((a, l) => a + l.montantPatronal, 0);
  return { lignes: out, sousTotaux, total: { salarial: tS, patronal: tP, total: tS + tP }, effectif: lignes.length };
}

// ──────────────────────────────────────────────────────────────────────────────
//  Journal de paie SYSCOHADA
// ──────────────────────────────────────────────────────────────────────────────
/** Plan de comptes de paie (repris de l'onglet « compta » de l'Excel, à valider par l'expert-comptable) */
export const PLAN_COMPTABLE_PAIE = {
  remunerations: { compte: "661", libelle: "Rémunérations directes versées au personnel" },
  indemnites: { compte: "663", libelle: "Indemnités forfaitaires versées au personnel" },
  honoraires: { compte: "6057", libelle: "Achats d'études et prestations de services" },
  chargesSociales: { compte: "664", libelle: "Charges sociales" },
  taxesSalaires: { compte: "6413", libelle: "Taxes sur appointements et salaires (CFCE)" },
  personnel: { compte: "422", libelle: "Personnel, rémunérations dues" },
  prestataires: { compte: "401", libelle: "Fournisseurs – honoraires prestataires" },
  avances: { compte: "421", libelle: "Personnel, avances et acomptes" },
  cooperative: { compte: "4718", libelle: "Créditeurs divers – retenues coopérative" },
  cssAF: { compte: "4311", libelle: "CSS – prestations familiales" },
  cssAT: { compte: "4312", libelle: "CSS – accidents du travail" },
  ipresRG: { compte: "4313", libelle: "IPRES – régime général" },
  ipresRC: { compte: "4314", libelle: "IPRES – régime cadres" },
  ipm: { compte: "4331", libelle: "IPM" },
  ir: { compte: "4471", libelle: "État – impôt sur le revenu retenu à la source" },
  trimf: { compte: "4472", libelle: "État – TRIMF" },
  brs: { compte: "4471", libelle: "État – BRS retenu à la source" },
  cfce: { compte: "447", libelle: "État – CFCE" },
  banque: { compte: "521", libelle: "Banque" },
} as const;

export type PlanComptablePaie = typeof PLAN_COMPTABLE_PAIE;

export interface LigneEcriture { compte: string; libelle: string; debit: number; credit: number }
export interface Ecriture { numero: number; libelle: string; lignes: LigneEcriture[]; totalDebit: number; totalCredit: number }

function ecriture(numero: number, libelle: string, brutes: LigneEcriture[]): Ecriture {
  // Regroupe par compte + libellé et supprime les lignes nulles
  const map = new Map<string, LigneEcriture>();
  for (const l of brutes) {
    const k = `${l.compte}|${l.libelle}`;
    const cur = map.get(k) || { compte: l.compte, libelle: l.libelle, debit: 0, credit: 0 };
    cur.debit += l.debit; cur.credit += l.credit;
    map.set(k, cur);
  }
  const lignes = [...map.values()]
    .map((l) => ({ ...l, debit: arrondi(l.debit), credit: arrondi(l.credit) }))
    .filter((l) => l.debit !== 0 || l.credit !== 0)
    // Présentation comptable : comptes débités d'abord, puis comptes crédités
    .sort((a, b) => Number(b.debit > 0) - Number(a.debit > 0));
  return {
    numero, libelle, lignes,
    totalDebit: lignes.reduce((s, l) => s + l.debit, 0),
    totalCredit: lignes.reduce((s, l) => s + l.credit, 0),
  };
}

/** Arrondi au franc (les écritures comptables sont en FCFA entiers) */
export const arrondi = (n: number) => Math.round(n || 0);

const D = (c: { compte: string; libelle: string }, montant: number): LigneEcriture => ({ ...c, debit: montant, credit: 0 });
const C = (c: { compte: string; libelle: string }, montant: number): LigneEcriture => ({ ...c, debit: 0, credit: montant });

/**
 * Journal de paie de la période, en 4 écritures équilibrées :
 * 1. constatation des rémunérations, 2. retenues, 3. charges patronales, 4. règlement des nets.
 * Chaque montant est d'abord arrondi au franc par salarié, puis les comptes de tiers (422 / 401)
 * sont calculés par différence pour garantir l'équilibre débit = crédit.
 */
export function journalDePaie(lignes: LigneBulletin[], plan: PlanComptablePaie = PLAN_COMPTABLE_PAIE): Ecriture[] {
  const pc = plan;
  const e1: LigneEcriture[] = [], e2: LigneEcriture[] = [], e3: LigneEcriture[] = [], e4: LigneEcriture[] = [];

  for (const l of lignes) {
    const p = l.paie;
    const prest = p.regime === "prestataire";
    const tiers = prest ? pc.prestataires : pc.personnel;
    const r = (n: number | undefined) => arrondi(n || 0);

    // 1. Rémunérations
    const brut = r(p.brut);
    const indemnites = r(p.transport) + r(p.primePanier) + r(p.indKilometrique);
    e1.push(D(prest ? pc.honoraires : pc.remunerations, brut));
    if (indemnites) e1.push(D(pc.indemnites, indemnites));
    e1.push(C(tiers, brut + indemnites));

    // 2. Retenues
    const avances = r(p.avanceTabaski) + r(p.avanceCaisse) + r(p.avanceFinanciere);
    const retenues: [{ compte: string; libelle: string }, number][] = [
      [pc.ir, r(p.ir)], [pc.trimf, r(p.trimf)], [pc.brs, r(p.brs)],
      [pc.ipresRG, r(p.ipresRG_s)], [pc.ipresRC, r(p.ipresRC_s)],
      [pc.ipm, r(p.ipm_s) + r(p.fraisMedicaux)],
      [pc.avances, avances], [pc.cooperative, r(p.retCooperative)],
    ];
    let totalRetenues = 0;
    for (const [c, m] of retenues) if (m) { e2.push(C(c, m)); totalRetenues += m; }
    if (totalRetenues) e2.push(D(tiers, totalRetenues));

    // 3. Charges patronales
    const patronales: [{ compte: string; libelle: string }, number][] = [
      [pc.cssAF, r(p.css_af)], [pc.cssAT, r(p.css_at)], [pc.ipresRG, r(p.ipresRG_p)],
      [pc.ipresRC, r(p.ipresRC_p)], [pc.ipm, r(p.ipm_p)],
    ];
    let totalSociales = 0;
    for (const [c, m] of patronales) if (m) { e3.push(C(c, m)); totalSociales += m; }
    if (totalSociales) e3.push(D(pc.chargesSociales, totalSociales));
    const cfce = r(p.cfce);
    if (cfce) { e3.push(D(pc.taxesSalaires, cfce)); e3.push(C(pc.cfce, cfce)); }

    // 4. Règlement du net (= solde du compte de tiers)
    const net = brut + indemnites - totalRetenues;
    if (net) { e4.push(D(tiers, net)); e4.push(C(pc.banque, net)); }
  }

  return [
    ecriture(1, "Constatation des rémunérations", e1),
    ecriture(2, "Retenues sur rémunérations", e2),
    ecriture(3, "Charges patronales", e3),
    ecriture(4, "Règlement des salaires et honoraires", e4),
  ].filter((e) => e.lignes.length > 0);
}

// ──────────────────────────────────────────────────────────────────────────────
//  Cumuls annuels
// ──────────────────────────────────────────────────────────────────────────────
export interface Cumuls {
  brut: number; ir: number; trimf: number; ipresRG_s: number; ipresRC_s: number;
  ipm_s: number; brs: number; net: number; chargesPat: number; moisPris: number;
}

const CUMUL_VIDE: Cumuls = { brut: 0, ir: 0, trimf: 0, ipresRG_s: 0, ipresRC_s: 0, ipm_s: 0, brs: 0, net: 0, chargesPat: 0, moisPris: 0 };

/**
 * Cumuls depuis janvier pour un salarié : somme des mois clôturés de l'année antérieurs à la période,
 * plus la paie de la période en cours (si fournie et si la période n'est pas elle-même archivée).
 */
export function cumulsAnnuels(
  archives: ArchiveMois[], matricule: string, annee: number, mois: number, courant?: PayrollResult,
): Cumuls {
  const c = { ...CUMUL_VIDE };
  const ajoute = (p: PayrollResult) => {
    c.brut += p.brut; c.ir += p.ir; c.trimf += p.trimf; c.ipresRG_s += p.ipresRG_s; c.ipresRC_s += p.ipresRC_s;
    c.ipm_s += p.ipm_s; c.brs += p.brs || 0; c.net += p.net; c.chargesPat += p.chargesPat; c.moisPris++;
  };
  let periodeArchivee = false;
  for (const a of archives) {
    if (a.annee !== annee || a.mois > mois) continue;
    const b = a.bulletins?.find((x) => x.matricule === matricule);
    if (!b) continue;
    if (a.mois === mois) periodeArchivee = true;
    ajoute(b.paie);
  }
  if (courant && !periodeArchivee) ajoute(courant);
  return c;
}

// ──────────────────────────────────────────────────────────────────────────────
//  Export CSV (séparateur « ; », BOM UTF-8 pour Excel en français)
// ──────────────────────────────────────────────────────────────────────────────
export function versCSV(lignes: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = typeof v === "number" ? String(Math.round(v)) : v;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return "﻿" + lignes.map((l) => l.map(cell).join(";")).join("\n");
}

export function livreCSV(lignes: LigneBulletin[], periode: string): string {
  const livre = livreDePaie(lignes);
  return versCSV([
    [`Livre de paie – ${periode}`],
    ["Code", "Rubrique", ...lignes.map((l) => `${l.matricule} ${l.prenom} ${l.nom}`), "TOTAL"],
    ...livre.map((r) => [r.rubrique.code, r.rubrique.libelle, ...r.valeurs, r.total]),
  ]);
}

export function cotisationsCSV(res: ResumeCotisations, periode: string): string {
  const pct = (n: number) => (n ? `${(n * 100).toFixed(2).replace(".", ",")} %` : "");
  return versCSV([
    [`Résumé des cotisations – ${periode}`],
    ["Code", "Rubrique", "Organisme", "Taux salarial", "Taux patronal", "Assiette", "Base", "Montant salarial", "Montant patronal", "Total", "Effectif"],
    ...res.lignes.map((l) => [l.code, l.libelle, l.organisme, pct(l.tauxSalarial), pct(l.tauxPatronal), l.assiette, l.base,
      l.montantSalarial, l.montantPatronal, l.montantSalarial + l.montantPatronal, l.effectif]),
    ["", "TOTAL GÉNÉRAL", "", "", "", "", "", res.total.salarial, res.total.patronal, res.total.total, res.effectif],
  ]);
}

export function journalCSV(ecritures: Ecriture[], periode: string, dateEcriture: string): string {
  return versCSV([
    ["Journal", "Date", "N° pièce", "Compte", "Libellé", "Débit", "Crédit"],
    ...ecritures.flatMap((e) => e.lignes.map((l) => [
      "PAIE", dateEcriture, `PAIE-${periode}-${e.numero}`, l.compte, `${e.libelle} – ${l.libelle}`, l.debit || "", l.credit || "",
    ])),
  ]);
}
