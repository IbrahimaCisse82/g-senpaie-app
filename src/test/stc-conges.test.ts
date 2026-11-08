import { describe, it, expect } from "vitest";
import { soldeConges, finCongeMaternite, calculerSTC, calculerSTCNet } from "@/lib/legal";
import { calculerPaie } from "@/lib/payroll";
import { DEFAULT_PARAMS } from "@/lib/constants";
import { FANTA } from "@/lib/__fixtures__/excel";

const REF = new Date(2026, 10, 30);
const conge = (type: string, dateDebut: string, jours: number, statut = "valide") => ({ matricule: "IF0002", type, statut, dateDebut, jours });

describe("Solde de congés repris", () => {
  it("sans reprise : 36 mois au plus depuis l'embauche", () => {
    expect(soldeConges(FANTA, [], REF).acquis).toBe(72);
  });
  it("avec reprise : jours repris + 2 j/mois depuis la reprise, congés antérieurs ignorés", () => {
    const s = soldeConges(FANTA, [conge("paye", "2025-12-01", 10), conge("reprise_solde", "2026-01-01", 12), conge("paye", "2026-08-03", 5)], REF);
    expect(s.reprise).toEqual({ date: "2026-01-01", jours: 12 });
    expect(s.acquis).toBe(12 + 10 * 2); // janvier → novembre : 10 mois
    expect(s.pris).toBe(5);
    expect(s.solde).toBe(27);
  });
  it("la reprise la plus récente fait foi", () => {
    const s = soldeConges(FANTA, [conge("reprise_solde", "2025-01-01", 40), conge("reprise_solde", "2026-10-01", 3)], REF);
    expect(s.reprise?.jours).toBe(3);
  });
});

describe("Congé maternité : 18 semaines (Code du travail 2026)", () => {
  it("fin proposée = début + 126 jours − 1", () => expect(finCongeMaternite("2026-01-05")).toBe("2026-05-10"));
});

describe("Solde de tout compte net (estimation)", () => {
  const paie = calculerPaie(FANTA, DEFAULT_PARAMS, REF);
  const stc = calculerSTC(FANTA, paie, 0, "licenciement", "2026-11-15", 24);
  it("net = éléments soumis − retenues + indemnité de licenciement non soumise", () => {
    const n = calculerSTCNet(stc, FANTA, paie, DEFAULT_PARAMS, "2026-11-15", true);
    expect(n.salaireProrata).toBe(Math.round(paie.brut * 15 / 30));
    expect(n.brutSoumis).toBeCloseTo(n.salaireProrata + stc.indPreavis + stc.indCongesNonPris, 6);
    expect(n.totalRetenues).toBeGreaterThan(0);
    expect(n.netAPayer).toBe(Math.round(n.brutSoumis - n.totalRetenues + stc.indLicenciement));
  });
  it("salaire du mois déjà payé : non repris ; démission : ni préavis ni indemnité", () => {
    const d = calculerSTC(FANTA, paie, 0, "demission", "2026-11-15", 24);
    const n = calculerSTCNet(d, FANTA, paie, DEFAULT_PARAMS, "2026-11-15", false);
    expect(n.salaireProrata).toBe(0);
    expect(n.indemniteNonSoumise).toBe(0);
    expect(n.brutSoumis).toBeCloseTo(d.indCongesNonPris, 6);
  });
  it("l'indemnité de licenciement n'entre pas dans la base de l'IR", () => {
    const sans = calculerSTCNet({ ...stc, indLicenciement: 0 }, FANTA, paie, DEFAULT_PARAMS, "2026-11-15", true);
    const avec = calculerSTCNet(stc, FANTA, paie, DEFAULT_PARAMS, "2026-11-15", true);
    expect(avec.ir).toBe(sans.ir);
  });
});
