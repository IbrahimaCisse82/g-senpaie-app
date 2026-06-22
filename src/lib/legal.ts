/**
 * Calculs juridiques RH — Code du Travail Sénégal.
 * Références : art. L.61, L.116, L.143, Convention collective interprofessionnelle.
 */
import type { Employee, PayrollResult } from "./payroll";
import { getAnciennete } from "./payroll";

/** Droit de congés payés : 2 jours ouvrables / mois (24j/an). Cumul depuis embauche. */
export function droitCongesAcquis(dateEntree: string, refDate?: Date): number {
  if (!dateEntree) return 0;
  const ref = refDate || new Date();
  const start = new Date(dateEntree);
  const months = Math.max(0, (ref.getFullYear() - start.getFullYear()) * 12 + (ref.getMonth() - start.getMonth()));
  return months * 2;
}

/** Préavis légal (mois) selon statut et ancienneté. */
export function dureePreavisMois(statut: string, anciennete: number): number {
  const cadre = statut === "cadres";
  if (cadre) return 3;
  if (anciennete >= 5) return 2;
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

/** Indemnité compensatrice de congés payés = (jours acquis – jours pris) × (salaire / 26) */
export function indemniteCongesNonPris(salaireMoyenMensuel: number, joursAcquis: number, joursPris: number): number {
  const reste = Math.max(0, joursAcquis - joursPris);
  return (salaireMoyenMensuel / 26) * reste;
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