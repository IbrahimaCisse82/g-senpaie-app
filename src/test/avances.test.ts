import { describe, it, expect } from "vitest";
import { calculerPaie } from "@/lib/payroll";
import { retenueDuMois, type Avance } from "@/hooks/useAvances";
import { FANTA, PARAMS_EXCEL, FIN_NOV_2024 } from "@/lib/__fixtures__/excel";

const pret = (statut: Avance["statut"] = "en_cours"): Avance => ({
  id: "a1", employeeId: "uuid-fanta", type: "pret", montant: 150000, dateOctroi: "2024-10-15", nbMensualites: 3, statut, motif: "",
  echeances: [
    { id: "e1", avanceId: "a1", mois: 11, annee: 2024, montant: 50000, statut: "en_attente" },
    { id: "e2", avanceId: "a1", mois: 12, annee: 2024, montant: 50000, statut: "en_attente" },
    { id: "e3", avanceId: "a1", mois: 1, annee: 2025, montant: 50000, statut: "en_attente" },
  ],
});

describe("Avances & prêts : retenue sur la paie", () => {
  it("retient l'échéance du mois (mois 1-12) d'une avance en cours", () => {
    expect(retenueDuMois([pret()], "uuid-fanta", 11, 2024)).toBe(50000);
    expect(retenueDuMois([pret()], "uuid-fanta", 10, 2024)).toBe(0);
    expect(retenueDuMois([pret()], "autre", 11, 2024)).toBe(0);
  });
  it("avance soldée par anticipation ou annulée : plus de retenue sur les échéances en attente", () => {
    expect(retenueDuMois([pret("solde")], "uuid-fanta", 11, 2024)).toBe(0);
    expect(retenueDuMois([pret("annule")], "uuid-fanta", 11, 2024)).toBe(0);
  });
  it("une échéance payée reste sur le bulletin de son mois (réédition après clôture)", () => {
    const p = pret("solde"); p.echeances[0].statut = "paye";
    expect(retenueDuMois([p], "uuid-fanta", 11, 2024)).toBe(50000);
    expect(retenueDuMois([p], "uuid-fanta", 12, 2024)).toBe(0);
  });
  it("l'échéance diminue le net de son montant exact, sans toucher au brut ni aux cotisations", () => {
    const sans = calculerPaie(FANTA, PARAMS_EXCEL, FIN_NOV_2024);
    const avec = calculerPaie({ ...FANTA, retenueEcheances: 50000 }, PARAMS_EXCEL, FIN_NOV_2024);
    expect(avec.retenueEcheances).toBe(50000);
    expect(avec.brut).toBe(sans.brut);
    expect(avec.totalRet).toBe(sans.totalRet);
    expect(sans.net - avec.net).toBeCloseTo(50000, 6);
  });
});
