import { describe, it, expect } from "vitest";
import { calculerPaie } from "./payroll";
import {
  versLigne, livreDePaie, resumeCotisations, journalDePaie, cumulsAnnuels, livreCSV, journalCSV,
  type LigneBulletin, type ArchiveMois,
} from "./etats";
import { FIN_NOV_2024, PARAMS_EXCEL, OUSMANE, FANTA, MANSOUR } from "./__fixtures__/excel";

const lignes: LigneBulletin[] = [OUSMANE, FANTA, MANSOUR].map((e) => versLigne(e, calculerPaie(e, PARAMS_EXCEL, FIN_NOV_2024)));
const tot = (f: (l: LigneBulletin) => number) => lignes.reduce((s, l) => s + f(l), 0);

describe("Livre de paie", () => {
  const livre = livreDePaie(lignes);
  const rub = (code: string) => livre.find((l) => l.rubrique.code === code)!;
  it("une colonne par salarié et un total cohérent", () => {
    expect(rub("199").valeurs).toHaveLength(3);
    expect(rub("199").total).toBeCloseTo(tot((l) => l.paie.brut), 6);
    expect(rub("399").total).toBeCloseTo(tot((l) => l.paie.net), 6);
  });
  it("masque les rubriques nulles pour tous (ex. HS si personne n'en fait)", () => {
    const sansHS = livreDePaie(lignes.slice(1));
    expect(sansHS.find((l) => l.rubrique.code === "130")).toBeUndefined();
    expect(sansHS.find((l) => l.rubrique.code === "199")).toBeDefined();
  });
});

describe("Résumé des cotisations — totaux de l'onglet Excel « ETAT RESUME COTISATIONS »", () => {
  const r = resumeCotisations(lignes, PARAMS_EXCEL);
  const l = (code: string) => r.lignes.find((x) => x.code === code)!;
  it("TRIMF 7 500 (2 salariés)", () => { expect(l("200").montantSalarial).toBeCloseTo(7500, 0); expect(l("200").effectif).toBe(2); });
  it("BRS 26 316 (1 prestataire)", () => { expect(l("400").montantSalarial).toBeCloseTo(26315.79, 0); expect(l("400").effectif).toBe(1); });
  it("IPRES RG : base 864 000, 48 384 salarial / 72 576 patronal", () => {
    expect(l("500").base).toBeCloseTo(864000, 0);
    expect(l("500").montantSalarial).toBeCloseTo(48384, 0);
    expect(l("500").montantPatronal).toBeCloseTo(72576, 0);
  });
  it("IPRES RCC : base 1 296 000, 31 104 / 46 656, 1 cadre", () => {
    expect(l("600").base).toBeCloseTo(1296000, 0);
    expect(l("600").montantSalarial).toBeCloseTo(31104, 0);
    expect(l("600").montantPatronal).toBeCloseTo(46656, 0);
    expect(l("600").effectif).toBe(1);
  });
  it("CSS : base 126 000, AF 8 820, AT 6 300", () => {
    expect(l("700").base).toBeCloseTo(126000, 0);
    expect(l("700").montantPatronal).toBeCloseTo(8820, 0);
    expect(l("800").montantPatronal).toBeCloseTo(6300, 0);
  });
  it("IPM : base 15 000, 15 000 salarial", () => {
    expect(l("900").base).toBeCloseTo(15000, 0);
    expect(l("900").montantSalarial).toBeCloseTo(15000, 0);
  });
  it("le total général égale la somme des bulletins", () => {
    expect(r.total.salarial).toBeCloseTo(tot((x) => x.paie.totalRet), 6);
    expect(r.total.patronal).toBeCloseTo(tot((x) => x.paie.chargesPat), 6);
  });
});

describe("Journal de paie SYSCOHADA", () => {
  const j = journalDePaie(lignes);
  const solde = (compte: string) => j.flatMap((e) => e.lignes).filter((l) => l.compte === compte).reduce((s, l) => s + l.debit - l.credit, 0);
  it("4 écritures, chacune équilibrée", () => {
    expect(j).toHaveLength(4);
    for (const e of j) expect(e.totalDebit).toBe(e.totalCredit);
  });
  it("les comptes 422 et 401 sont soldés après règlement", () => {
    expect(solde("422")).toBe(0);
    expect(solde("401")).toBe(0);
  });
  it("661 = brut des salariés, 6057 = honoraires, 521 = total des nets", () => {
    expect(solde("661")).toBe(Math.round(lignes[0].paie.brut) + Math.round(lignes[1].paie.brut));
    expect(solde("6057")).toBe(Math.round(lignes[2].paie.brut));
    expect(-solde("521")).toBeCloseTo(tot((l) => l.paie.net), -1);
  });
  it("IPRES RG (4313) crédité des parts salariales + patronales", () => {
    expect(-solde("4313")).toBe(48384 + 72576);
  });
  it("export CSV : en-tête et une ligne par mouvement", () => {
    const csv = journalCSV(j, "11-2024", "30/11/2024");
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.split("\n")).toHaveLength(1 + j.reduce((s, e) => s + e.lignes.length, 0));
  });
});

describe("Cumuls annuels", () => {
  const paieOct = calculerPaie(FANTA, PARAMS_EXCEL, new Date(2024, 9, 31));
  const archives: ArchiveMois[] = [
    { mois: 9, annee: 2024, bulletins: [versLigne(FANTA, paieOct)] },
    { mois: 11, annee: 2023, bulletins: [versLigne(FANTA, paieOct)] }, // autre année : ignorée
  ];
  const courant = lignes[1].paie;
  it("additionne les mois clôturés de l'année et la période en cours", () => {
    const c = cumulsAnnuels(archives, "IF0002", 2024, 10, courant);
    expect(c.moisPris).toBe(2);
    expect(c.brut).toBeCloseTo(paieOct.brut + courant.brut, 6);
  });
  it("ne compte pas deux fois une période déjà archivée", () => {
    const c = cumulsAnnuels([...archives, { mois: 10, annee: 2024, bulletins: [versLigne(FANTA, courant)] }], "IF0002", 2024, 10, courant);
    expect(c.moisPris).toBe(2);
  });
});

describe("Export du livre de paie", () => {
  it("contient les salariés en colonnes", () => {
    const csv = livreCSV(lignes, "Novembre 2024");
    expect(csv).toContain("IF0001 OUSMANE DIOP");
    expect(csv).toContain("NET À PAYER");
  });
});
