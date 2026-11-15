// ══════════════════════════════════════════════════════════════════════════════
//  Régularisation annuelle de l'IR
//  Chaque mois, l'IR est retenu comme si le salaire du mois était perçu douze fois.
//  En fin d'année (ou au départ du salarié), on recalcule l'impôt sur le revenu réellement
//  versé dans l'année et on compare aux retenues déjà opérées.
// ══════════════════════════════════════════════════════════════════════════════
import { calculerIRAnnuel, calculerPaie, getPartsIR, getRegime, type Employee, type PayrollParams, type PayrollResult } from "./payroll";
import type { BulletinArchive } from "./dads";

export interface LigneRegulIR {
  matricule: string;
  nom: string;
  parts: number;
  /** Mois de l'année pris en compte (bulletins clôturés + mois en cours s'il est inclus) */
  nbMois: number;
  brutAnnuel: number;
  /** IR déjà retenu sur les bulletins (régularisations antérieures comprises) */
  irRetenu: number;
  /** IR dû sur le revenu réel de l'année */
  irDu: number;
  /** irDu − irRetenu : positif = complément à retenir, négatif = trop-perçu à rembourser */
  ecart: number;
}

const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);

/**
 * @param bulletins bulletins clôturés (table bulletins_mois)
 * @param moisEnCours mois ouvert à ajouter (0-11), ou null si tous les mois utiles sont clôturés
 */
export function regularisationIR(
  bulletins: BulletinArchive[], employees: Employee[], params: PayrollParams, annee: number, moisEnCours: number | null,
): LigneRegulIR[] {
  const lignes: LigneRegulIR[] = [];
  for (const emp of employees) {
    if (getRegime(emp.contrat) !== "salarie") continue; // prestataires : BRS ; stagiaires : pas d'IR
    const vus = new Set<number>();
    let brutAnnuel = 0, irRetenu = 0;
    for (const b of bulletins) {
      if (b.annee !== annee || b.matricule !== emp.matricule || vus.has(b.mois)) continue;
      const p: Partial<PayrollResult> = b.data || {};
      if (p.regime && p.regime !== "salarie") continue;
      vus.add(b.mois);
      brutAnnuel += n(p.brut) || n(b.brut);
      irRetenu += n(p.ir) + n(p.regulIR);
    }
    if (moisEnCours !== null && !vus.has(moisEnCours)) {
      // Mois ouvert : paie du mois sans la régularisation elle-même
      const p = calculerPaie({ ...emp, regulIR: 0 }, params, new Date(annee, moisEnCours + 1, 0));
      vus.add(moisEnCours);
      brutAnnuel += p.brut;
      irRetenu += p.ir;
    }
    if (vus.size === 0) continue;
    const parts = getPartsIR(emp.situationFamille, emp.enfants);
    const irDu = calculerIRAnnuel(brutAnnuel, parts).ir;
    lignes.push({
      matricule: emp.matricule, nom: `${emp.prenom} ${emp.nom}`, parts, nbMois: vus.size,
      brutAnnuel: Math.round(brutAnnuel), irRetenu: Math.round(irRetenu), irDu: Math.round(irDu),
      ecart: Math.round(irDu) - Math.round(irRetenu),
    });
  }
  return lignes.sort((a, b) => a.matricule.localeCompare(b.matricule));
}
