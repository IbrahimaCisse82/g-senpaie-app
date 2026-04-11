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
  bulletinTemplate: string;
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

  // Taux horaire (base 173.33h/mois)
  const TH = 173.33;
  const tauxHoraire = (emp.salaireBase || 0) / TH;

  // Heures supplémentaires
  const mtHS115 = (emp.hs115 || 0) * tauxHoraire * 1.15;
  const mtHS140 = (emp.hs140 || 0) * tauxHoraire * 1.40;
  const mtHS160 = (emp.hs160 || 0) * tauxHoraire * 1.60;
  const mtHS200 = (emp.hs200 || 0) * tauxHoraire * 2.00;
  const totalHS = mtHS115 + mtHS140 + mtHS160 + mtHS200;

  // Retenues absences
  const retAbsence = (emp.heuresAbsence || 0) * tauxHoraire;

  // Indemnité maladie
  const indMaladie = (emp.heuresAbsMaladie || 0) * tauxHoraire * (emp.tauxMaladie || 0);

  // Prime de panier (constante 3000 FCFA/jour × nb paniers)
  const primePanier = (emp.nbPaniers || 0) * 3000;

  // Indemnité kilométrique
  const indKilometrique = emp.indKilometrique || 0;

  const brut = (emp.salaireBase || 0) + (emp.sursalaire || 0) + primeAnc + totalHS - retAbsence + indMaladie;

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

  // Avances & retenues diverses
  const avanceTabaski = emp.avanceTabaski || 0;
  const avanceCaisse = emp.avanceCaisse || 0;
  const avanceFinanciere = emp.avanceFinanciere || 0;
  const retCooperative = emp.retCooperative || 0;
  const fraisMedicaux = emp.fraisMedicaux || 0;
  const totalAvances = avanceTabaski + avanceCaisse + avanceFinanciere + retCooperative + fraisMedicaux;

  const totalRet = ir + trimf + ipresRG_s + ipresRC_s + ipm_s;
  const chargesPat = cfce + ipresRG_p + ipresRC_p + css_af + css_at + ipm_p;
  const transport = p.transport.valeur || 0;
  const net = brut - totalRet + transport + primePanier + indKilometrique - totalAvances;
  const masse = brut + chargesPat;

  return {
    salaireBase: emp.salaireBase, sursalaire: emp.sursalaire,
    primeAnc, brut, ir, trimf, ipresRG_s, ipresRC_s, ipm_s, totalRet,
    cfce, ipresRG_p, ipresRC_p, css_af, css_at, ipm_p, chargesPat,
    transport, net, masse, anc, ancRate, baseCSS, partsIR, partsTRIMFCap,
    tauxHoraire, retAbsence, indMaladie, mtHS115, mtHS140, mtHS160, mtHS200, totalHS,
    primePanier, indKilometrique, totalAvances,
    avanceTabaski, avanceCaisse, avanceFinanciere, retCooperative, fraisMedicaux,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  Formatters
// ══════════════════════════════════════════════════════════════════════════════

export const fmt = (n: number): string => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
export const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
export const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
