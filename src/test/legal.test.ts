import { describe, it, expect } from "vitest";
import {
  droitCongesAcquis,
  joursCongesPrisSurPeriode,
  dureePreavisMois,
  indemniteLicenciement,
  indemnitePreavis,
  indemniteCongesNonPris,
  joursOuvrables,
  joursOuvrablesDansMois,
  absencesDuMois,
  HEURES_PAR_JOUR,
} from "@/lib/legal";

describe("Congés payés — 2 jours ouvrables par mois", () => {
  it("cumule 24 jours après 12 mois", () => {
    expect(droitCongesAcquis("2025-01-15", new Date("2026-01-20"))).toBe(24);
  });
  it("retourne 0 sans date d'entrée", () => {
    expect(droitCongesAcquis("")).toBe(0);
  });
  it("ne descend jamais sous 0 pour une entrée future", () => {
    expect(droitCongesAcquis("2027-01-01", new Date("2026-01-01"))).toBe(0);
  });
});

describe("Préavis légal", () => {
  it("cadre : 3 mois quelle que soit l'ancienneté", () => {
    expect(dureePreavisMois("cadres", 1)).toBe(3);
    expect(dureePreavisMois("cadres", 12)).toBe(3);
  });
  // CCNI 2019, art. 75 : la durée dépend de la catégorie, pas de l'ancienneté
  it("ouvriers et employés : 1 mois, quelle que soit l'ancienneté", () => {
    expect(dureePreavisMois("employés", 3)).toBe(1);
    expect(dureePreavisMois("employés", 12)).toBe(1);
    expect(dureePreavisMois("Ouvrier", 8)).toBe(1);
  });
  it("agents de maîtrise : 2 mois", () => {
    expect(dureePreavisMois("agents de maîtrise", 1)).toBe(2);
    expect(dureePreavisMois("Agent de maîtrise", 9)).toBe(2);
  });
});

describe("Indemnité de licenciement (art. L.61)", () => {
  const smm = 400000;
  it("nulle avant 1 an d'ancienneté", () => {
    expect(indemniteLicenciement(smm, 0)).toBe(0);
  });
  it("25% par année sur les 5 premières années", () => {
    expect(indemniteLicenciement(smm, 5)).toBe(smm * 0.25 * 5);
  });
  it("30% de la 6e à la 10e année", () => {
    expect(indemniteLicenciement(smm, 8)).toBe(smm * 0.25 * 5 + smm * 0.3 * 3);
  });
  it("40% au-delà de la 10e année", () => {
    expect(indemniteLicenciement(smm, 13)).toBe(
      smm * 0.25 * 5 + smm * 0.3 * 5 + smm * 0.4 * 3,
    );
  });
});

describe("Indemnités compensatrices", () => {
  it("préavis = mois × salaire", () => {
    expect(indemnitePreavis(300000, 2)).toBe(600000);
  });
  // Allocation de congé = 1/12 de la rémunération annuelle pour 24 jours ouvrables
  it("congés non pris = reliquat × salaire/24", () => {
    expect(indemniteCongesNonPris(240000, 30, 6)).toBeCloseTo(240000 / 24 * 24, 6);
    expect(indemniteCongesNonPris(240000, 5, 10)).toBe(0);
  });
  it("aucun reliquat négatif", () => {
    expect(indemniteCongesNonPris(260000, 5, 12)).toBe(0);
  });
});

describe("Jours ouvrables", () => {
  it("exclut samedi et dimanche", () => {
    // lundi 2026-08-03 → dimanche 2026-08-09 = 5 jours ouvrables
    expect(joursOuvrables("2026-08-03", "2026-08-09")).toBe(5);
  });
  it("intersecte correctement avec un mois donné", () => {
    // congé du 28/07 au 05/08 → part d'août (03,04,05) = 3 jours
    expect(joursOuvrablesDansMois("2026-07-28", "2026-08-05", 7, 2026)).toBe(3);
  });
  it("retourne 0 hors du mois", () => {
    expect(joursOuvrablesDansMois("2026-07-01", "2026-07-10", 7, 2026)).toBe(0);
  });
});

describe("Répercussion congés → paie", () => {
  const conges = [
    { matricule: "E001", type: "sans_solde", statut: "valide", dateDebut: "2026-08-03", dateFin: "2026-08-07" },
    { matricule: "E001", type: "maladie", statut: "valide", dateDebut: "2026-08-10", dateFin: "2026-08-11" },
    { matricule: "E001", type: "paye", statut: "valide", dateDebut: "2026-08-17", dateFin: "2026-08-21" },
    { matricule: "E001", type: "sans_solde", statut: "demande", dateDebut: "2026-08-24", dateFin: "2026-08-25" },
    { matricule: "E002", type: "sans_solde", statut: "valide", dateDebut: "2026-08-03", dateFin: "2026-08-07" },
  ];
  it("ne retient que les congés validés du bon salarié", () => {
    const r = absencesDuMois(conges, "E001", 7, 2026);
    expect(r.joursNonPayes).toBe(5);
    expect(r.joursMaladie).toBe(2);
  });
  it("convertit en heures sur base 8h/jour", () => {
    const r = absencesDuMois(conges, "E001", 7, 2026);
    expect(r.heuresAbsence).toBe(5 * HEURES_PAR_JOUR);
    expect(r.heuresAbsMaladie).toBe(2 * HEURES_PAR_JOUR);
  });
  it("les congés payés n'impactent pas la paie", () => {
    const r = absencesDuMois(
      [{ matricule: "E001", type: "paye", statut: "valide", dateDebut: "2026-08-03", dateFin: "2026-08-07" }],
      "E001", 7, 2026,
    );
    expect(r.heuresAbsence).toBe(0);
  });
});

describe("Cumul des congés limité à 36 mois", () => {
  it("un salarié embauché il y a 11 ans n'accumule pas 264 jours", () => {
    const acquis = droitCongesAcquis("2015-01-05", new Date(2026, 10, 30));
    expect(acquis).toBe(36 * 2 + 1 * 3); // 72 j + majoration d'1 j/an (≥ 10 ans) sur 3 ans
  });
  it("un embauché récent cumule depuis son entrée", () => {
    expect(droitCongesAcquis("2026-01-01", new Date(2026, 10, 30))).toBe(20);
  });
  it("les congés pris avant la période de cumul ne sont pas décomptés", () => {
    const conges = [
      { matricule: "A", type: "paye", statut: "valide", dateDebut: "2020-08-01", jours: 24 },
      { matricule: "A", type: "paye", statut: "valide", dateDebut: "2025-08-01", jours: 12 },
      { matricule: "A", type: "paye", statut: "refuse", dateDebut: "2025-09-01", jours: 5 },
      { matricule: "B", type: "paye", statut: "valide", dateDebut: "2025-08-01", jours: 7 },
    ];
    expect(joursCongesPrisSurPeriode(conges, "A", "2015-01-05", new Date(2026, 10, 30))).toBe(12);
  });
});
