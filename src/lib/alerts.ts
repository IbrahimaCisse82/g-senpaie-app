import type { Employee, PayrollResult } from "./payroll";
import { fmt } from "./payroll";
import type { Conge, Contrat } from "@/hooks/useRH";

export type AlertType = "warning" | "danger" | "info";

export interface AppAlert {
  id: string;
  type: AlertType;
  message: string;
}

const SMIG = 64281;

/**
 * Construit la liste unifiée des alertes de l'application.
 * Utilisée à la fois par le Tableau de bord et le centre de notifications.
 */
export function buildAlerts(
  allPaies: (Employee & { paie: PayrollResult })[],
  totaux: { brut: number; net: number; ch: number; mass: number },
  conges: Conge[] = [],
  contrats: Contrat[] = []
): AppAlert[] {
  const list: AppAlert[] = [];

  const belowSmig = allPaies.filter((e) => e.salaireBase < SMIG);
  if (belowSmig.length > 0) {
    list.push({
      id: `smig:${belowSmig.map((e) => e.matricule).join(",")}`,
      type: "danger",
      message: `⚠️ ${belowSmig.length} employé${belowSmig.length > 1 ? "s" : ""} sous le SMIG (${fmt(SMIG)} F) : ${belowSmig.map((e) => e.prenom).join(", ")}`,
    });
  }

  const atIpresCeiling = allPaies.filter((e) => e.paie.brut >= 432000);
  if (atIpresCeiling.length > 0) {
    list.push({
      id: `ipres:${atIpresCeiling.length}`,
      type: "warning",
      message: `📊 ${atIpresCeiling.length} employé${atIpresCeiling.length > 1 ? "s" : ""} au plafond IPRES RG (432 000 F)`,
    });
  }

  const chargesRatio = totaux.ch / Math.max(totaux.brut, 1);
  if (chargesRatio > 0.3) {
    list.push({
      id: `charges:${chargesRatio.toFixed(2)}`,
      type: "info",
      message: `📈 Ratio charges patronales/brut élevé : ${(chargesRatio * 100).toFixed(1)}%`,
    });
  }

  const today = new Date();
  const in60 = new Date(today.getTime() + 60 * 86400000);
  const nameOf = (mat: string) => {
    const e = allPaies.find((x) => x.matricule === mat);
    return e ? `${e.prenom} ${e.nom}` : mat;
  };

  const cddSoon = contrats.filter(
    (c) => c.type === "CDD" && c.dateFin && new Date(c.dateFin) >= today && new Date(c.dateFin) <= in60
  );
  if (cddSoon.length > 0) {
    list.push({
      id: `cdd:${cddSoon.map((c) => c.matricule + c.dateFin).join(",")}`,
      type: "warning",
      message: `📝 ${cddSoon.length} CDD arrive${cddSoon.length > 1 ? "nt" : ""} à échéance sous 60 jours : ${cddSoon.map((c) => `${nameOf(c.matricule)} (${c.dateFin})`).join(", ")}`,
    });
  }

  const essais = contrats
    .map((c) => {
      const mois = c.periodeEssaiMois || 0;
      if (!c.dateDebut || mois <= 0) return null;
      const fin = new Date(c.dateDebut);
      fin.setMonth(fin.getMonth() + mois);
      return fin >= today && fin <= in60 ? { c, fin } : null;
    })
    .filter(Boolean) as { c: Contrat; fin: Date }[];
  if (essais.length > 0) {
    list.push({
      id: `essai:${essais.map((x) => x.c.matricule).join(",")}`,
      type: "info",
      message: `⏳ ${essais.length} période${essais.length > 1 ? "s" : ""} d'essai se termine${essais.length > 1 ? "nt" : ""} sous 60 jours : ${essais.map((x) => `${nameOf(x.c.matricule)} (${x.fin.toISOString().slice(0, 10)})`).join(", ")}`,
    });
  }

  const congesAValider = conges.filter((c) => c.statut === "demande");
  if (congesAValider.length > 0) {
    list.push({
      id: `conges:${congesAValider.length}`,
      type: "warning",
      message: `🌴 ${congesAValider.length} demande${congesAValider.length > 1 ? "s" : ""} de congé en attente de validation`,
    });
  }

  return list;
}
