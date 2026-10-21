// ══════════════════════════════════════════════════════════════════════════════
//  Types & Interfaces for G-SENPAIE
// ══════════════════════════════════════════════════════════════════════════════

export interface Employee {
  id?: number;
  matricule: string;
  prenom: string;
  nom: string;
  sexe: "M" | "F";
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  adresse: string;
  telephone: string;
  email: string;
  situationFamille: string;
  femmes: number;
  enfants: number;
  fonction: string;
  convention: string;
  categorie: string;
  statut: string;
  contrat: string;
  dateEntree: string;
  salaireBase: number;
  sursalaire: number;
  // Gestion avancée
  heuresAbsence: number;
  heuresAbsMaladie: number;
  tauxMaladie: number;
  nbPaniers: number;
  hs115: number;
  hs140: number;
  hs160: number;
  hs200: number;
  avanceTabaski: number;
  avanceCaisse: number;
  avanceFinanciere: number;
  retCooperative: number;
  fraisMedicaux: number;
  indKilometrique: number;
}

export interface PayrollParams {
  CFCE: CotisationParam;
  BRS: CotisationParam;
  IPRES_RG: CotisationParam;
  IPRES_RCC: CotisationParam;
  CSS_AF: CotisationParam;
  CSS_AT: CotisationParam;
  IPM: CotisationParam;
  transport: { label: string; valeur: number };
}

export interface CotisationParam {
  label: string;
  taux: number;
  tauxSalarial: number;
  tauxPatronal: number;
  plafond: number | null;
}

export interface PayrollResult {
  salaireBase: number;
  sursalaire: number;
  primeAnc: number;
  brut: number;
  regime: RegimePaie;
  ir: number;
  trimf: number;
  brs: number;
  revenuImposable: number;
  impotBrut: number;
  reductionFamille: number;
  ipresRG_s: number;
  ipresRC_s: number;
  ipm_s: number;
  totalRet: number;
  cfce: number;
  ipresRG_p: number;
  ipresRC_p: number;
  css_af: number;
  css_at: number;
  ipm_p: number;
  chargesPat: number;
  transport: number;
  net: number;
  masse: number;
  anc: number;
  ancRate: number;
  baseCSS: number;
  baseCSS_AT: number;
  baseIPM: number;
  partsIR: number;
  partsTRIMFCap: number;
  // Gestion avancée
  tauxHoraire: number;
  retAbsence: number;
  indMaladie: number;
  mtHS115: number;
  mtHS140: number;
  mtHS160: number;
  mtHS200: number;
  totalHS: number;
  primePanier: number;
  indKilometrique: number;
  totalAvances: number;
  avanceTabaski: number;
  avanceCaisse: number;
  avanceFinanciere: number;
  retCooperative: number;
  fraisMedicaux: number;
}

export interface Convention {
  id: string;
  nom: string;
  secteur: string;
  dateSignature: string;
  description: string;
  categories: ConventionCategory[];
}

export interface ConventionCategory {
  id: string;
  code: string;
  libelle: string;
  statut: string;
  salaireMinima: number;
}

export interface Entreprise {
  nom: string;
  logo: string;
  adresse: string;
  telephone: string;
  email: string;
  ninea: string;
  rccm: string;
}

// ══════════════════════════════════════════════════════════════════════════════
//  Payroll Calculation Engine
// ══════════════════════════════════════════════════════════════════════════════

// Constantes horaires reprises du fichier SENEXCELPAIE
/** Heures mensuelles pour le taux horaire des heures supplémentaires : 40 h × 52 sem. / 12 */
export const HEURES_MOIS_HS = (40 * 52) / 12;
/** Heures mensuelles pour les retenues d'absence et l'indemnité maladie (valeur de l'Excel) */
export const HEURES_MOIS = 173.33;

/** Fin du mois de paie (par défaut : fin du mois en cours) */
export function finDeMois(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Ancienneté en années révolues à la fin de la période de paie.
 * Équivalent Excel : DATEDIF(date_entrée ; fin_de_mois + 1 ; "y").
 */
export function getAnciennete(dateEntree: string, refDate?: Date): number {
  if (!dateEntree) return 0;
  const entree = new Date(dateEntree);
  if (isNaN(entree.getTime())) return 0;
  const fin = refDate ? new Date(refDate) : finDeMois();
  const ref = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() + 1);
  let annees = ref.getFullYear() - entree.getFullYear();
  if (ref.getMonth() < entree.getMonth() || (ref.getMonth() === entree.getMonth() && ref.getDate() < entree.getDate())) annees--;
  return Math.max(0, annees);
}

/** Applique un plafond de cotisation ; null / 0 / vide = sans plafond */
function plafonner(base: number, plafond: number | null | undefined): number {
  return plafond && plafond > 0 ? Math.min(base, plafond) : base;
}

/** Taux d'ancienneté : 1 % par année d'ancienneté, applicable dès 2 ans.
 *  Prime d'ancienneté = taux × salaire de base (choix validé, conforme au fichier SENEXCELPAIE 2019). */
export function getTauxAnciennete(anc: number): number {
  if (anc < 2) return 0;
  return anc / 100;
}

/** Régime de paie selon le type de contrat (colonne « SITUATION CONTRAT » de l'Excel) */
export type RegimePaie = "salarie" | "prestataire" | "stagiaire";
export function getRegime(contrat: string | undefined): RegimePaie {
  const c = (contrat || "").trim().toUpperCase();
  if (c === "PRESTATION") return "prestataire";
  if (c === "STAGE") return "stagiaire";
  return "salarie"; // CDI, CDD (et valeurs inconnues : régime salarié par prudence)
}

/**
 * Nombre de parts IR (quotient familial) — formule de la fiche personnel de l'Excel :
 * marié(e), ou veuf(ve) avec enfants : 1,5 + 0,5 par enfant ; sinon 1 + 0,5 par enfant ; plafonné à 5.
 */
export function getPartsIR(situationFamille: string | undefined, enfants: number | undefined): number {
  const n = Math.max(0, enfants || 0);
  const sit = (situationFamille || "").toLowerCase();
  const couple = sit.startsWith("mari") || (sit.startsWith("veu") && n > 0);
  return Math.min((couple ? 1.5 : 1) + n * 0.5, 5);
}

/** Barème progressif annuel de l'IR (CGI Sénégal) sur le revenu imposable arrondi au millier inférieur */
export function baremeIR(revenuImposable: number): number {
  const b = revenuImposable;
  if (b > 13500000) return 4359000 + (b - 13500000) * 0.40;
  if (b > 8000000) return 2324000 + (b - 8000000) * 0.37;
  if (b > 4000000) return 924000 + (b - 4000000) * 0.35;
  if (b > 1500000) return 174000 + (b - 1500000) * 0.30;
  if (b > 630000) return (b - 630000) * 0.20;
  return 0;
}

/** Réduction d'impôt pour charges de famille : [taux, minimum, maximum] selon le nombre de parts */
export const REDUCTION_FAMILLE: Record<string, [number, number, number]> = {
  "1.5": [0.10, 100000, 300000],
  "2": [0.15, 200000, 650000],
  "2.5": [0.20, 300000, 1100000],
  "3": [0.25, 400000, 1650000],
  "3.5": [0.30, 500000, 2030000],
  "4": [0.35, 600000, 2490000],
  "4.5": [0.40, 700000, 2755000],
  "5": [0.45, 800000, 3180000],
};

/**
 * IR mensuel — méthode du fichier SENEXCELPAIE :
 * 1. revenu annuel = brut × 12, abattement de 30 % plafonné à 900 000, arrondi au millier inférieur ;
 * 2. impôt brut = barème appliqué au revenu entier ;
 * 3. réduction pour charges de famille = impôt × taux, bornée [minimum ; maximum] ;
 * 4. IR annuel = max(0 ; impôt − réduction), divisé par 12.
 */
export function calculerIR(brut: number, parts: number): { ir: number; revenuImposable: number; impotBrut: number; reduction: number } {
  const annuel = brut * 12;
  const revenuImposable = Math.floor((annuel - Math.min(annuel * 0.3, 900000)) / 1000) * 1000;
  const impotBrut = baremeIR(Math.max(0, revenuImposable));
  const r = REDUCTION_FAMILLE[String(parts)];
  const reduction = r ? Math.min(r[2], Math.max(impotBrut * r[0], r[1])) : 0;
  return { ir: Math.max(0, impotBrut - reduction) / 12, revenuImposable, impotBrut, reduction };
}

/** Calcul TRIMF mensuel (barème annuel × parts TRIMF, tranche minimale forfaitaire de 900 F/an) */
function calculerTRIMF(brut: number, part: number): number {
  const ba = brut * 12;
  let t = 900;
  if (ba >= 12000000) t = part * 36000;
  else if (ba >= 7000000) t = part * 18000;
  else if (ba >= 2000000) t = part * 12000;
  else if (ba >= 1000000) t = part * 4800;
  else if (ba >= 600000) t = part * 3600;
  return t / 12;
}

/** Calcul complet de la paie d'un employé pour la période se terminant à refDate (fin de mois) */
export function calculerPaie(emp: Employee, p: PayrollParams, refDate?: Date): PayrollResult {
  const regime = getRegime(emp.contrat);
  const salarie = regime === "salarie";
  const anc = getAnciennete(emp.dateEntree, refDate);
  const ancRate = salarie ? getTauxAnciennete(anc) : 0; // pas de prime d'ancienneté sur honoraires / stage
  const salaireBase = emp.salaireBase || 0;
  const sursalaire = emp.sursalaire || 0;
  const primeAnc = salaireBase * ancRate;

  // Taux horaire : (salaire de base + sursalaire) / heures mensuelles — comme l'Excel
  const remunHoraire = salaireBase + sursalaire;
  const tauxHoraire = remunHoraire / HEURES_MOIS_HS;
  const tauxHoraireAbs = remunHoraire / HEURES_MOIS;

  // Heures supplémentaires
  const mtHS115 = (emp.hs115 || 0) * tauxHoraire * 1.15;
  const mtHS140 = (emp.hs140 || 0) * tauxHoraire * 1.40;
  const mtHS160 = (emp.hs160 || 0) * tauxHoraire * 1.60;
  const mtHS200 = (emp.hs200 || 0) * tauxHoraire * 2.00;
  const totalHS = mtHS115 + mtHS140 + mtHS160 + mtHS200;

  // Absences : les heures de maladie sont déduites comme toute absence…
  const heuresMaladie = emp.heuresAbsMaladie || 0;
  const retAbsence = ((emp.heuresAbsence || 0) + heuresMaladie) * tauxHoraireAbs;
  // … puis indemnisées au taux de maintien de salaire (1 = 100 %), d'où aucun double paiement
  const indMaladie = heuresMaladie * tauxHoraireAbs * Math.min(Math.max(emp.tauxMaladie || 0, 0), 1);

  // Prime de panier (constante 3000 FCFA × nb paniers)
  const primePanier = (emp.nbPaniers || 0) * 3000;
  const indKilometrique = emp.indKilometrique || 0;

  const brut = salaireBase + sursalaire + primeAnc + totalHS - retAbsence + indMaladie;

  // Impôts — uniquement pour les salariés (CDI / CDD)
  const partsIR = getPartsIR(emp.situationFamille, emp.enfants);
  const irCalc = calculerIR(brut, partsIR);
  const ir = salarie ? irCalc.ir : 0;
  const partsTRIMFCap = Math.min(1 + (emp.femmes || 0), 5);
  const trimf = salarie ? calculerTRIMF(brut, partsTRIMFCap) : 0;
  // BRS : retenue à la source sur honoraires des prestataires
  const brs = regime === "prestataire" ? brut * p.BRS.taux : 0;

  // IPRES RG
  const baseRG = salarie ? plafonner(brut, p.IPRES_RG.plafond) : 0;
  const ipresRG_s = baseRG * p.IPRES_RG.taux * p.IPRES_RG.tauxSalarial;
  const ipresRG_p = baseRG * p.IPRES_RG.taux * p.IPRES_RG.tauxPatronal;

  // IPRES RCC (cadres uniquement)
  const baseRC = salarie && (emp.statut || "").toLowerCase() === "cadres" ? plafonner(brut, p.IPRES_RCC.plafond) : 0;
  const ipresRC_s = baseRC * p.IPRES_RCC.taux * p.IPRES_RCC.tauxSalarial;
  const ipresRC_p = baseRC * p.IPRES_RCC.taux * p.IPRES_RCC.tauxPatronal;

  // CSS : chaque branche a son propre taux et son propre plafond (paramétrables)
  const baseCSS = salarie ? plafonner(brut, p.CSS_AF.plafond) : 0;
  const css_af = baseCSS * p.CSS_AF.taux;
  const baseCSS_AT = salarie ? plafonner(brut, p.CSS_AT.plafond) : 0;
  const css_at = baseCSS_AT * p.CSS_AT.taux;

  // CFCE (salariés uniquement)
  const cfce = salarie ? brut * p.CFCE.taux : 0;

  // IPM : taux, répartition et plafond paramétrables (taux 0 par défaut = pas d'IPM)
  const baseIPM = regime === "stagiaire" ? 0 : plafonner(brut, p.IPM.plafond);
  const ipm_s = baseIPM * p.IPM.taux * p.IPM.tauxSalarial;
  const ipm_p = baseIPM * p.IPM.taux * p.IPM.tauxPatronal;

  // Avances & retenues diverses
  const avanceTabaski = emp.avanceTabaski || 0;
  const avanceCaisse = emp.avanceCaisse || 0;
  const avanceFinanciere = emp.avanceFinanciere || 0;
  const retCooperative = emp.retCooperative || 0;
  const fraisMedicaux = emp.fraisMedicaux || 0;
  const totalAvances = avanceTabaski + avanceCaisse + avanceFinanciere + retCooperative + fraisMedicaux;

  const totalRet = ir + trimf + brs + ipresRG_s + ipresRC_s + ipm_s;
  const chargesPat = cfce + ipresRG_p + ipresRC_p + css_af + css_at + ipm_p;
  // Indemnité de transport : non due aux prestataires
  const transport = regime === "prestataire" ? 0 : (p.transport.valeur || 0);
  const net = brut - totalRet + transport + primePanier + indKilometrique - totalAvances;
  const masse = brut + chargesPat;

  return {
    salaireBase, sursalaire, regime,
    primeAnc, brut, ir, trimf, brs, ipresRG_s, ipresRC_s, ipm_s, totalRet,
    cfce, ipresRG_p, ipresRC_p, css_af, css_at, ipm_p, chargesPat,
    transport, net, masse, anc, ancRate, baseCSS, baseCSS_AT, baseIPM, partsIR, partsTRIMFCap,
    revenuImposable: irCalc.revenuImposable, impotBrut: salarie ? irCalc.impotBrut : 0, reductionFamille: salarie ? irCalc.reduction : 0,
    tauxHoraire, retAbsence, indMaladie, mtHS115, mtHS140, mtHS160, mtHS200, totalHS,
    primePanier, indKilometrique, totalAvances,
    avanceTabaski, avanceCaisse, avanceFinanciere, retCooperative, fraisMedicaux,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  Paramètres : classes de risque CSS AT et normalisation
// ══════════════════════════════════════════════════════════════════════════════

/** Classes de risque accident du travail (CSS) — taux patronal */
export const CSS_AT_CLASSES = [
  { label: "Classe 1 – risque faible (1 %)", taux: 0.01 },
  { label: "Classe 2 – risque moyen (3 %)", taux: 0.03 },
  { label: "Classe 3 – risque élevé (5 %)", taux: 0.05 },
] as const;

/** Fusionne des paramètres enregistrés (éventuellement anciens / incomplets) avec les valeurs par défaut */
export function normaliserParams(saved: Partial<PayrollParams> | null | undefined, defaults: PayrollParams): PayrollParams {
  const out = JSON.parse(JSON.stringify(defaults)) as PayrollParams;
  if (!saved) return out;
  for (const key of Object.keys(defaults) as (keyof PayrollParams)[]) {
    const v = saved[key];
    if (v && typeof v === "object") Object.assign(out[key], v);
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════════════
//  Formatters
// ══════════════════════════════════════════════════════════════════════════════

export const fmt = (n: number): string => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
export const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
export const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
