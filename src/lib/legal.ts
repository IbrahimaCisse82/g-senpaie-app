/**
 * Calculs juridiques RH — Code du Travail Sénégal.
 * Références : art. L.61, L.116, L.143, Convention collective interprofessionnelle.
 */
import type { Employee, PayrollResult } from "./payroll";
import { getAnciennete, normaliserStatut } from "./payroll";

/** Cumul maximal des congés : 3 ans (Code du travail, art. L.148 et suivants) */
export const CUMUL_CONGES_MAX_MOIS = 36;

const ajouterMois = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
const moisEntre = (a: Date, b: Date) => Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));

/**
 * Début de la période de cumul des congés : la date d'entrée, ou 36 mois avant la date de référence
 * si l'embauche est plus ancienne (au-delà, les congés non pris ne se cumulent pas).
 */
export function debutPeriodeConges(dateEntree: string, refDate?: Date): Date | null {
  if (!dateEntree) return null;
  const ref = refDate || new Date();
  const entree = new Date(dateEntree);
  const limite = ajouterMois(ref, -CUMUL_CONGES_MAX_MOIS);
  return entree > limite ? entree : limite;
}

/** Jours supplémentaires annuels selon l'ancienneté (CCNI 2019, art. 70) : +1 après 10 ans, +2 après 15, +3 après 20 */
export function majorationAncienneteConges(anciennete: number): number {
  if (anciennete >= 20) return 3;
  if (anciennete >= 15) return 2;
  if (anciennete >= 10) return 1;
  return 0;
}

/**
 * Droit de congés payés acquis et cumulable : 2 jours ouvrables par mois de service effectif
 * (CCNI 2019, art. 70), sur la période de cumul de 36 mois au plus, majoration d'ancienneté comprise.
 */
export function droitCongesAcquis(dateEntree: string, refDate?: Date): number {
  const debut = debutPeriodeConges(dateEntree, refDate);
  if (!debut) return 0;
  const ref = refDate || new Date();
  const mois = Math.min(moisEntre(debut, ref), CUMUL_CONGES_MAX_MOIS);
  const majoration = majorationAncienneteConges(getAnciennete(dateEntree, ref)) * (mois / 12);
  return Math.floor(mois * 2 + majoration);
}

/** Jours de congés payés validés pris pendant la période de cumul */
export function joursCongesPrisSurPeriode(
  conges: { matricule: string; type: string; statut: string; dateDebut: string; jours: number }[],
  matricule: string, dateEntree: string, refDate?: Date,
): number {
  const debut = debutPeriodeConges(dateEntree, refDate);
  if (!debut) return 0;
  return conges
    .filter((c) => c.matricule === matricule && c.type === "paye" && c.statut === "valide" && new Date(c.dateDebut) >= debut)
    .reduce((s, c) => s + (c.jours || 0), 0);
}

/** Préavis (CCNI 2019, art. 75) : ouvriers et employés 1 mois, agents de maîtrise 2 mois, cadres 3 mois. */
export function dureePreavisMois(statut: string, _anciennete?: number): number {
  const s = normaliserStatut(statut);
  if (s === "cadres") return 3;
  if (s === "agents de maîtrise") return 2;
  return 1;
}

/**
 * Indemnité de licenciement (Code du Travail SN art. L.61).
 * Calculée sur le salaire moyen brut des 12 derniers mois.
 *  - 25% du SMM par année pour les 5 premières années
 *  - 30% du SMM par année de la 6ème à la 10ème
 *  - 40% du SMM par année au-delà de la 10ème
 */
export function indemniteLicenciement(salaireMoyenMensuel: number, anciennete: number): number {
  if (anciennete < 1) return 0;
  let total = 0;
  const tranche1 = Math.min(anciennete, 5);
  total += salaireMoyenMensuel * 0.25 * tranche1;
  if (anciennete > 5) {
    const tranche2 = Math.min(anciennete - 5, 5);
    total += salaireMoyenMensuel * 0.30 * tranche2;
  }
  if (anciennete > 10) {
    const tranche3 = anciennete - 10;
    total += salaireMoyenMensuel * 0.40 * tranche3;
  }
  return total;
}

/** Indemnité compensatrice de préavis = nombre de mois × salaire brut */
export function indemnitePreavis(salaireMoyenMensuel: number, moisPreavis: number): number {
  return salaireMoyenMensuel * moisPreavis;
}

/**
 * Indemnité compensatrice de congés payés : l'allocation de congé vaut 1/12 de la rémunération annuelle
 * pour 24 jours ouvrables, soit (salaire mensuel / 24) par jour restant.
 */
export const JOURS_CONGES_PAR_AN = 24;
export function indemniteCongesNonPris(salaireMoyenMensuel: number, joursAcquis: number, joursPris: number): number {
  const reste = Math.max(0, joursAcquis - joursPris);
  return (salaireMoyenMensuel / JOURS_CONGES_PAR_AN) * reste;
}

export interface SoldeToutCompte {
  anciennete: number;
  salaireMoyenMensuel: number;
  joursCongesAcquis: number;
  joursCongesPris: number;
  preavisMois: number;
  indPreavis: number;
  indCongesNonPris: number;
  indLicenciement: number;
  totalBrut: number;
}

export function calculerSTC(
  emp: Employee,
  paie: PayrollResult,
  joursCongesPris: number,
  motif: "licenciement" | "demission" | "retraite" | "fin_cdd",
  dateFin?: string
): SoldeToutCompte {
  const ref = dateFin ? new Date(dateFin) : new Date();
  const anciennete = getAnciennete(emp.dateEntree, ref);
  const smm = paie.brut;
  const joursCongesAcquis = droitCongesAcquis(emp.dateEntree, ref);
  const preavisMois = dureePreavisMois(emp.statut, anciennete);
  // Pas d'indemnité de préavis si démission ; pas d'indemnité de licenciement si démission ou fin de CDD normale.
  const indPreavis = motif === "demission" ? 0 : indemnitePreavis(smm, preavisMois);
  const indLic = motif === "licenciement" || motif === "retraite" ? indemniteLicenciement(smm, anciennete) : 0;
  const indCongesNonPris = indemniteCongesNonPris(smm, joursCongesAcquis, joursCongesPris);

  return {
    anciennete,
    salaireMoyenMensuel: smm,
    joursCongesAcquis,
    joursCongesPris,
    preavisMois,
    indPreavis,
    indCongesNonPris,
    indLicenciement: indLic,
    totalBrut: indPreavis + indCongesNonPris + indLic,
  };
}

/** Compte les jours ouvrables (lundi-vendredi) entre deux dates incluses. */
export function joursOuvrables(debut: string, fin: string): number {
  const d = new Date(debut);
  const f = new Date(fin);
  let count = 0;
  while (d <= f) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

/** Durée légale journalière retenue pour la conversion jours → heures (40h/semaine, 5 j). */
export const HEURES_PAR_JOUR = 8;

/**
 * Jours ouvrables d'un congé tombant à l'intérieur d'un mois donné (intersection période × mois).
 */
export function joursOuvrablesDansMois(debut: string, fin: string, mois: number, annee: number): number {
  const debutMois = new Date(annee, mois, 1);
  const finMois = new Date(annee, mois + 1, 0);
  const d = new Date(debut) > debutMois ? new Date(debut) : debutMois;
  const f = new Date(fin) < finMois ? new Date(fin) : finMois;
  if (d > f) return 0;
  return joursOuvrables(
    d.toISOString().slice(0, 10),
    f.toISOString().slice(0, 10),
  );
}

export interface AbsenceMensuelle {
  joursNonPayes: number;
  joursMaladie: number;
  heuresAbsence: number;
  heuresAbsMaladie: number;
}

/**
 * Répercussion des congés validés sur la paie du mois :
 *  - « sans_solde » → retenue pour absence (heuresAbsence)
 *  - « maladie » → indemnisation maladie (heuresAbsMaladie)
 *  - congés payés & maternité → aucun impact (rémunérés)
 */
export function absencesDuMois(
  conges: { matricule: string; type: string; statut: string; dateDebut: string; dateFin: string }[],
  matricule: string,
  mois: number,
  annee: number,
): AbsenceMensuelle {
  let joursNonPayes = 0;
  let joursMaladie = 0;
  for (const c of conges) {
    if (c.matricule !== matricule || c.statut !== "valide") continue;
    const j = joursOuvrablesDansMois(c.dateDebut, c.dateFin, mois, annee);
    if (j <= 0) continue;
    if (c.type === "sans_solde") joursNonPayes += j;
    else if (c.type === "maladie") joursMaladie += j;
  }
  return {
    joursNonPayes,
    joursMaladie,
    heuresAbsence: joursNonPayes * HEURES_PAR_JOUR,
    heuresAbsMaladie: joursMaladie * HEURES_PAR_JOUR,
  };
}