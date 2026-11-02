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
