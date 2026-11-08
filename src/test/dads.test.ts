import { describe, it, expect } from "vitest";
import { calculerDADS, moisClotures, type BulletinArchive } from "@/lib/dads";
import { EMPTY_EMPLOYEE } from "@/lib/constants";

const b = (matricule: string, mois: number, brut: number, ir: number, annee = 2026): BulletinArchive => ({
  matricule, nom_complet: matricule === "S1" ? "Awa Diallo" : "Moussa Ndiaye", mois, annee, brut,
  data: { brut, ir, trimf: 1000, ipresRG_s: 100, ipresRC_s: 0, css_af: 50, css_at: 10 },
});

describe("DADS : cumul des mois réellement clôturés", () => {
  const bulletins = [b("S1", 0, 300000, 20000), b("S1", 1, 310000, 21000), b("S2", 1, 200000, 5000), b("S1", 1, 999999, 1), b("S1", 0, 1, 1, 2025)];
  const emps = [{ ...EMPTY_EMPLOYEE, matricule: "S1", nom: "Diallo", prenom: "Awa", dateEntree: "2020-01-01" }];
  const dads = calculerDADS(bulletins, emps, 2026);
  it("additionne les bulletins, sans multiplier par 12", () => {
    const s1 = dads.find((l) => l.emp.matricule === "S1")!;
    expect(s1.brutAnnuel).toBe(610000);
    expect(s1.irAnnuel).toBe(41000);
    expect(s1.moisPayes).toEqual([0, 1]);
  });
  it("ignore un bulletin régénéré pour le même mois et les autres années", () => {
    expect(dads.find((l) => l.emp.matricule === "S1")!.brutAnnuel).toBe(610000);
  });
  it("conserve un salarié sorti (absent de la liste actuelle)", () => {
    const s2 = dads.find((l) => l.emp.matricule === "S2")!;
    expect(s2.emp.nom).toBe("Ndiaye");
    expect(s2.brutAnnuel).toBe(200000);
  });
  it("liste les mois clôturés de l'année", () => {
    expect(moisClotures(bulletins, 2026)).toEqual([0, 1]);
  });
});

import { totauxPeriode, moisDeLaPeriode } from "@/lib/dads";
describe("Rapport de période : mois clôturés uniquement", () => {
  const b = (mois: number, brut: number, ir: number) => ({ matricule: "A", nom_complet: "A", mois, annee: 2026, brut, data: { brut, ir, ipresRG_s: 10, ipresRG_p: 15, masse: brut + 100 } });
  it("aucune reconstitution : les mois sans bulletin figé sont exclus et listés", () => {
    const r = totauxPeriode([b(0, 100000, 1000), b(2, 120000, 2000)], 0, 2026, 3, 2026);
    expect(r.lignes.map((l) => l.mois)).toEqual([0, 2]);
    expect(r.nonClotures).toEqual([{ mois: 1, annee: 2026 }, { mois: 3, annee: 2026 }]);
    expect(r.lignes[1].brut).toBe(120000);
    expect(r.lignes[0].ipresRG).toBe(25);
  });
  it("période à cheval sur deux années", () => {
    expect(moisDeLaPeriode(10, 2025, 1, 2026).map((x) => `${x.mois}/${x.annee}`)).toEqual(["10/2025", "11/2025", "0/2026", "1/2026"]);
  });
});
