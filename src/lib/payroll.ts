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
  ir: number;
  trimf: number;
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
  partsIR: number;
  partsTRIMFCap: number;
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

export function getAnciennete(dateEntree: string, refDate?: Date): number {
  if (!dateEntree) return 0;
  const ref = refDate || new Date();
  return Math.max(0, Math.floor((ref.getTime() - new Date(dateEntree).getTime()) / (365.25 * 86400000)));
}

/** Taux d'ancienneté : ancienneté / 100, applicable dès 2 ans */
export function getTauxAnciennete(anc: number): number {
  if (anc < 2) return 0;
  return anc / 100;
}

/** Calcul TRIMF mensuel */
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

/** Calcul complet de la paie d'un employé */
export function calculerPaie(emp: Employee, p: PayrollParams, refDate?: Date): PayrollResult {
  const anc = getAnciennete(emp.dateEntree, refDate);
  const ancRate = getTauxAnciennete(anc);
  const primeAnc = (emp.salaireBase || 0) * ancRate;
  const brut = (emp.salaireBase || 0) + (emp.sursalaire || 0) + primeAnc;

  // Quotient familial IR
  const partsIR = emp.situationFamille === "Marié(e)"
    ? 1.5 + (emp.enfants || 0) * 0.5
    : 1 + (emp.enfants || 0) * 0.5;

  // IR : barème progressif annuel / 12
  const brutAnnuel = brut * 12;
  const abatt = Math.min(brutAnnuel * 0.3, 900000);
  const baseImposable = brutAnnuel - abatt;
  const baseArr = Math.floor((baseImposable / partsIR) / 1000) * 1000;
  let irParPart = 0;
  if (baseArr > 13500000) irParPart = 4359000 + (baseArr - 13500000) * 0.40;
  else if (baseArr > 8000000) irParPart = 2324000 + (baseArr - 8000000) * 0.37;
  else if (baseArr > 4000000) irParPart = 924000 + (baseArr - 4000000) * 0.35;
  else if (baseArr > 1500000) irParPart = 174000 + (baseArr - 1500000) * 0.30;
  else if (baseArr > 630000) irParPart = (baseArr - 630000) * 0.20;
  const ir = Math.max(0, (irParPart * partsIR) / 12);

  // TRIMF
  const partsTRIMFCap = Math.min(1 + (emp.femmes || 0), 5);
  const trimf = calculerTRIMF(brut, partsTRIMFCap);

  // IPRES RG : plafond 432 000
  const baseRG = p.IPRES_RG.plafond ? Math.min(brut, p.IPRES_RG.plafond) : brut;
  const ipresRG_s = baseRG * p.IPRES_RG.taux * p.IPRES_RG.tauxSalarial;
  const ipresRG_p = baseRG * p.IPRES_RG.taux * p.IPRES_RG.tauxPatronal;

  // IPRES RC (cadres uniquement) : plafond 1 296 000
  const baseRC = emp.statut === "cadres"
    ? (p.IPRES_RCC.plafond ? Math.min(brut, p.IPRES_RCC.plafond) : brut)
    : 0;
  const ipresRC_s = baseRC * p.IPRES_RCC.taux * p.IPRES_RCC.tauxSalarial;
  const ipresRC_p = baseRC * p.IPRES_RCC.taux * p.IPRES_RCC.tauxPatronal;

  // CSS : plafond 63 000
  const baseCSS = p.CSS_AF.plafond ? Math.min(brut, p.CSS_AF.plafond) : brut;
  const css_af = baseCSS * p.CSS_AF.taux;
  const css_at = baseCSS * p.CSS_AT.taux;

  // CFCE
  const cfce = brut * p.CFCE.taux;

  // IPM
  const ipm_s = brut * p.IPM.taux * p.IPM.tauxSalarial;
  const ipm_p = brut * p.IPM.taux * p.IPM.tauxPatronal;

  const totalRet = ir + trimf + ipresRG_s + ipresRC_s + ipm_s;
  const chargesPat = cfce + ipresRG_p + ipresRC_p + css_af + css_at + ipm_p;
  const transport = p.transport.valeur || 0;
  const net = brut - totalRet + transport;
  const masse = brut + chargesPat;

  return {
    salaireBase: emp.salaireBase, sursalaire: emp.sursalaire,
    primeAnc, brut, ir, trimf, ipresRG_s, ipresRC_s, ipm_s, totalRet,
    cfce, ipresRG_p, ipresRC_p, css_af, css_at, ipm_p, chargesPat,
    transport, net, masse, anc, ancRate, baseCSS, partsIR, partsTRIMFCap,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  Formatters
// ══════════════════════════════════════════════════════════════════════════════

export const fmt = (n: number): string => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
export const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
export const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
