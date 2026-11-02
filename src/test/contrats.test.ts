import { describe, it, expect } from "vitest";
import { controlerContrat, periodeEssaiMaxMois, majorationAncienneteConges, dureePreavisMois } from "@/lib/legal";

describe("Période d'essai (CCNI 2019, art. 23)", () => {
  it("employés et ouvriers 1 mois, agents de maîtrise 2, cadres 3 — statuts saisis librement", () => {
    expect(periodeEssaiMaxMois("Employé")).toBe(1);
    expect(periodeEssaiMaxMois("ouvriers")).toBe(1);
    expect(periodeEssaiMaxMois("Agent de maîtrise")).toBe(2);
    expect(periodeEssaiMaxMois("CADRES")).toBe(3);
  });
  it("3 mois d'essai refusés pour une employée", () => {
    const r = controlerContrat({ matricule: "A", type: "CDI", dateDebut: "2026-01-01", periodeEssaiMois: 3 }, "employés");
    expect(r.erreurs.join()).toMatch(/art\. 23/);
  });
});

describe("CDD (Code du travail 2026, art. 100)", () => {
  const ok = (dateFin: string) => controlerContrat({ matricule: "A", type: "CDD", dateDebut: "2026-01-01", dateFin, periodeEssaiMois: 1 }, "employés");
  it("2 ans exactement : accepté", () => expect(ok("2027-12-31").erreurs).toEqual([]));
  it("au-delà de 2 ans : refusé", () => expect(ok("2028-01-31").erreurs.join()).toMatch(/2 ans/));
  it("4 ans d'un seul tenant : refusé", () => expect(ok("2029-12-31").erreurs.length).toBeGreaterThan(0));
  it("CDD sans date de fin : refusé", () => expect(controlerContrat({ matricule: "A", type: "CDD", dateDebut: "2026-01-01" }, "employés").erreurs.join()).toMatch(/date de fin/));
  it("cumul de CDD au-delà de 4 ans : refusé", () => {
    const anciens = [{ id: "1", matricule: "A", type: "CDD", dateDebut: "2022-01-01", dateFin: "2023-12-31" },
      { id: "2", matricule: "A", type: "CDD", dateDebut: "2024-01-01", dateFin: "2025-12-31" }];
    const r = controlerContrat({ matricule: "A", type: "CDD", dateDebut: "2026-01-01", dateFin: "2026-06-30" }, "employés", anciens);
    expect(r.erreurs.join()).toMatch(/4 ans/);
    expect(r.alertes.join()).toMatch(/un seul renouvellement/);
  });
  it("premier renouvellement : alerte de dépôt à l'inspection du travail", () => {
    const r = controlerContrat({ matricule: "A", type: "CDD", dateDebut: "2026-01-01", dateFin: "2026-12-31" }, "employés",
      [{ id: "1", matricule: "A", type: "CDD", dateDebut: "2025-01-01", dateFin: "2025-12-31" }]);
    expect(r.erreurs).toEqual([]);
    expect(r.alertes.join()).toMatch(/inspection du travail/);
  });
});

describe("Congés et préavis (CCNI 2019, art. 70 et 75)", () => {
  it("majoration d'ancienneté : 0 / 1 / 2 / 3 / 7 jours", () => {
    expect([9, 10, 15, 20, 25].map(majorationAncienneteConges)).toEqual([0, 1, 2, 3, 7]);
  });
  it("préavis : employée 1 mois, agent de maîtrise 2, cadre 3", () => {
    expect(dureePreavisMois("Employé")).toBe(1);
    expect(dureePreavisMois("agents de maîtrise")).toBe(2);
    expect(dureePreavisMois("Cadre")).toBe(3);
  });
});
