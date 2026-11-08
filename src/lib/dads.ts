// ══════════════════════════════════════════════════════════════════════════════
//  DADS annuelle : cumul des bulletins réellement clôturés (table bulletins_mois).
//  Aucune extrapolation : un mois non clôturé n'est pas déclaré.
// ══════════════════════════════════════════════════════════════════════════════
import type { Employee, PayrollResult } from "./payroll";

/** Bulletin figé à la clôture, tel que stocké dans bulletins_mois */
export interface BulletinArchive {
  matricule: string;
  nom_complet: string;
  mois: number; // 0 = janvier
  annee: number;
  brut: number;
  data: Partial<PayrollResult> | null;
}

export interface LigneDADS {
  emp: Pick<Employee, "matricule" | "nom" | "prenom" | "dateEntree"> & { dateSortie?: string };
  moisPayes: number[];
  brutAnnuel: number;
  irAnnuel: number;
  trimfAnnuel: number;
  ipresAnnuel: number;
  cssAnnuel: number;
}

const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);

/**
 * Agrège les bulletins clôturés de l'année par salarié. Les salariés sortis en cours d'année
 * (absents de la liste actuelle) sont conservés grâce au nom figé dans le bulletin.
 */
export function calculerDADS(bulletins: BulletinArchive[], employees: Employee[], annee: number): LigneDADS[] {
  const parMat = new Map<string, LigneDADS>();
  for (const b of bulletins) {
    if (b.annee !== annee) continue;
    let l = parMat.get(b.matricule);
    if (!l) {
      const e = employees.find((x) => x.matricule === b.matricule);
      const [prenom, ...reste] = (b.nom_complet || "").split(" ");
      l = {
        emp: e
          ? { matricule: e.matricule, nom: e.nom, prenom: e.prenom, dateEntree: e.dateEntree, dateSortie: e.dateSortie }
          : { matricule: b.matricule, nom: reste.join(" "), prenom, dateEntree: "" },
        moisPayes: [], brutAnnuel: 0, irAnnuel: 0, trimfAnnuel: 0, ipresAnnuel: 0, cssAnnuel: 0,
      };
      parMat.set(b.matricule, l);
    }
    if (l.moisPayes.includes(b.mois)) continue; // un bulletin régénéré ne compte qu'une fois
    const p = b.data || {};
    l.moisPayes.push(b.mois);
    l.brutAnnuel += n(p.brut) || n(b.brut);
    l.irAnnuel += n(p.ir);
    l.trimfAnnuel += n(p.trimf);
    l.ipresAnnuel += n(p.ipresRG_s) + n(p.ipresRC_s);
    l.cssAnnuel += n(p.css_af) + n(p.css_at);
  }
  return [...parMat.values()]
    .map((l) => ({ ...l, moisPayes: l.moisPayes.sort((a, b) => a - b) }))
    .sort((a, b) => a.emp.matricule.localeCompare(b.emp.matricule));
}

/** Mois de l'année pour lesquels au moins un bulletin a été clôturé */
export function moisClotures(bulletins: BulletinArchive[], annee: number): number[] {
  return [...new Set(bulletins.filter((b) => b.annee === annee).map((b) => b.mois))].sort((a, b) => a - b);
}

// ══════════════════════════════════════════════════════════════════════════════
//  Rapport de cotisations sur une période : uniquement les mois clôturés
// ══════════════════════════════════════════════════════════════════════════════
export interface PeriodeTotaux {
  mois: number; annee: number; effectif: number;
  brut: number; ir: number; trimf: number; ipresRG: number; ipresRC: number; css: number; cfce: number; ipm: number;
  totalRet: number; chargesPat: number; net: number; masse: number;
}

/** Mois (0-11) de la période, bornes incluses */
export function moisDeLaPeriode(moisDebut: number, anneeDebut: number, moisFin: number, anneeFin: number): { mois: number; annee: number }[] {
  const out: { mois: number; annee: number }[] = [];
  let m = moisDebut, a = anneeDebut;
  while ((a < anneeFin || (a === anneeFin && m <= moisFin)) && out.length < 240) {
    out.push({ mois: m, annee: a });
    if (++m > 11) { m = 0; a++; }
  }
  return out;
}

/**
 * Totaux mensuels à partir des bulletins figés. Les mois sans bulletin clôturé sont
 * retournés à part (`nonClotures`) et ne figurent ni dans les lignes ni dans les totaux.
 */
export function totauxPeriode(bulletins: BulletinArchive[], moisDebut: number, anneeDebut: number, moisFin: number, anneeFin: number) {
  const lignes: PeriodeTotaux[] = [];
  const nonClotures: { mois: number; annee: number }[] = [];
  for (const { mois, annee } of moisDeLaPeriode(moisDebut, anneeDebut, moisFin, anneeFin)) {
    const bs = bulletins.filter((b) => b.mois === mois && b.annee === annee);
    if (bs.length === 0) { nonClotures.push({ mois, annee }); continue; }
    const s = (f: (p: Partial<PayrollResult>) => number) => bs.reduce((acc, b) => acc + f(b.data || {}), 0);
    lignes.push({
      mois, annee, effectif: bs.length,
      brut: bs.reduce((acc, b) => acc + n(b.data?.brut ?? b.brut), 0),
      ir: s((p) => n(p.ir)), trimf: s((p) => n(p.trimf)),
      ipresRG: s((p) => n(p.ipresRG_s) + n(p.ipresRG_p)), ipresRC: s((p) => n(p.ipresRC_s) + n(p.ipresRC_p)),
      css: s((p) => n(p.css_af) + n(p.css_at)), cfce: s((p) => n(p.cfce)), ipm: s((p) => n(p.ipm_s) + n(p.ipm_p)),
      totalRet: s((p) => n(p.totalRet)), chargesPat: s((p) => n(p.chargesPat)), net: s((p) => n(p.net)), masse: s((p) => n(p.masse)),
    });
  }
  return { lignes, nonClotures };
}
