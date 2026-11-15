import { describe, it, expect } from "vitest";
import { calculerPaie, calculerIRAnnuel, calculerIR, remiseAZeroVariables, type Employee } from "@/lib/payroll";
import { DEFAULT_PARAMS } from "@/lib/constants";
import { regularisationIR } from "@/lib/regularisation";
import { calculerSTC, calculerSTCNet } from "@/lib/legal";
import type { BulletinArchive } from "@/lib/dads";

const base: Employee = {
  matricule: "T-1", prenom: "Awa", nom: "Diop", sexe: "F", dateNaissance: "1990-01-01", lieuNaissance: "", nationalite: "",
  adresse: "", telephone: "", email: "", situationFamille: "Célibataire", femmes: 0, enfants: 0, fonction: "", convention: "",
  categorie: "", statut: "employés", contrat: "CDI", dateEntree: "2026-01-01", salaireBase: 500000, sursalaire: 0,
  heuresAbsence: 0, heuresAbsMaladie: 0, tauxMaladie: 0, nbPaniers: 0, hs115: 0, hs140: 0, hs160: 0, hs200: 0,
  avanceTabaski: 0, avanceCaisse: 0, avanceFinanciere: 0, retCooperative: 0, fraisMedicaux: 0, indKilometrique: 0,
};
const fin = (m: number) => new Date(2026, m + 1, 0);
const archive = (emp: Employee, mois: number[]): BulletinArchive[] => mois.map((m) => {
  const p = calculerPaie(emp, DEFAULT_PARAMS, fin(m));
  return { matricule: emp.matricule, nom_complet: "Awa Diop", mois: m, annee: 2026, brut: p.brut, data: p };
});

describe("IR annuel et mensuel", () => {
  it("l'IR mensuel reste le douzième de l'IR annuel du salaire × 12", () => {
    expect(calculerIR(500000, 1).ir * 12).toBeCloseTo(calculerIRAnnuel(6000000, 1).ir, 6);
  });
});

describe("gratification / 13e mois", () => {
  const sans = calculerPaie(base, DEFAULT_PARAMS, fin(11));
  const avec = calculerPaie({ ...base, gratification: 500000 }, DEFAULT_PARAMS, fin(11));
  it("entre dans le brut et dans les cotisations", () => {
    expect(avec.brut).toBe(sans.brut + 500000);
    expect(avec.gratification).toBe(500000);
    expect(avec.ipresRG_s).toBeGreaterThanOrEqual(sans.ipresRG_s);
  });
  it("est imposée sur le supplément d'IR annuel, pas comme douze versements", () => {
    const supplement = calculerIRAnnuel(6500000, 1).ir - calculerIRAnnuel(6000000, 1).ir;
    expect(avec.irGratification).toBeCloseTo(supplement, 6);
    expect(avec.ir).toBeCloseTo(sans.ir + supplement, 6);
    // l'ancienne méthode (tout × 12) aurait retenu bien plus
    expect(avec.ir).toBeLessThan(calculerIR(1000000, 1).ir);
  });
  it("ne change pas la TRIMF du mois et augmente le net", () => {
    expect(avec.trimf).toBe(sans.trimf);
    expect(avec.net).toBeGreaterThan(sans.net);
  });
  it("est remise à zéro à la clôture, comme la régularisation", () => {
    const r = remiseAZeroVariables({ ...base, gratification: 500000, regulIR: -1200 });
    expect(r.gratification).toBe(0);
    expect(r.regulIR).toBe(0);
  });
});

describe("régularisation annuelle de l'IR", () => {
  it("année complète à salaire constant : aucun écart", () => {
    const l = regularisationIR(archive(base, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), [base], DEFAULT_PARAMS, 2026, null);
    expect(l).toHaveLength(1);
    expect(l[0].nbMois).toBe(12);
    expect(Math.abs(l[0].ecart)).toBeLessThanOrEqual(1);
  });
  it("salarié entré en juillet : l'IR retenu dépasse l'IR dû, trop-perçu à rembourser", () => {
    const l = regularisationIR(archive(base, [6, 7, 8, 9, 10]), [base], DEFAULT_PARAMS, 2026, 11);
    expect(l[0].nbMois).toBe(6);
    expect(l[0].brutAnnuel).toBe(3000000);
    expect(l[0].irDu).toBe(Math.round(calculerIRAnnuel(3000000, 1).ir));
    expect(l[0].ecart).toBeLessThan(0);
    expect(l[0].ecart).toBe(l[0].irDu - l[0].irRetenu);
  });
  it("la régularisation passe en retenue sur le bulletin et n'est pas comptée deux fois", () => {
    const l = regularisationIR(archive(base, [6, 7, 8, 9, 10]), [base], DEFAULT_PARAMS, 2026, 11)[0];
    const empRegul = { ...base, regulIR: l.ecart };
    const dec = calculerPaie(empRegul, DEFAULT_PARAMS, fin(11));
    const sans = calculerPaie(base, DEFAULT_PARAMS, fin(11));
    expect(dec.net).toBeCloseTo(sans.net - l.ecart, 6);
    expect(dec.ir).toBe(sans.ir);
    // recalcul avec la régularisation déjà saisie : même écart proposé
    expect(regularisationIR(archive(base, [6, 7, 8, 9, 10]), [empRegul], DEFAULT_PARAMS, 2026, 11)[0].ecart).toBe(l.ecart);
    // une fois décembre clôturé avec la régularisation, il ne reste rien à régulariser
    const tout = [...archive(base, [6, 7, 8, 9, 10]), { matricule: "T-1", nom_complet: "Awa Diop", mois: 11, annee: 2026, brut: dec.brut, data: dec }];
    expect(Math.abs(regularisationIR(tout, [base], DEFAULT_PARAMS, 2026, null)[0].ecart)).toBeLessThanOrEqual(1);
  });
  it("ignore les prestataires et les stagiaires", () => {
    const presta = { ...base, matricule: "P-1", contrat: "PRESTATION" };
    expect(regularisationIR(archive(presta, [0, 1]), [presta], DEFAULT_PARAMS, 2026, null)).toHaveLength(0);
  });
});

describe("STC : étalement de l'impôt", () => {
  it("préavis + congés imposés par mois équivalent, pas comme un seul gros salaire", () => {
    const emp = { ...base, dateEntree: "2018-01-01" };
    const paie = calculerPaie(emp, DEFAULT_PARAMS, fin(10));
    const stc = calculerSTC(emp, paie, 0, "licenciement", "2026-11-30");
    const net = calculerSTCNet(stc, emp, paie, DEFAULT_PARAMS, "2026-11-30", true);
    expect(net.moisEquivalents).toBeCloseTo(net.brutSoumis / paie.brut, 6);
    expect(net.moisEquivalents).toBeGreaterThan(1);
    // IR = IR d'un mois au salaire habituel × nombre de mois équivalents
    const irMensuel = calculerIR(net.brutSoumis / net.moisEquivalents, 1).ir;
    expect(net.ir).toBeCloseTo(irMensuel * net.moisEquivalents, 4);
    // bien inférieur à l'imposition du tout sur un seul mois
    expect(net.ir).toBeLessThan(calculerIR(net.brutSoumis, 1).ir);
    expect(net.netAPayer).toBe(Math.round(net.brutSoumis - net.totalRetenues + stc.indLicenciement));
  });
  it("moins d'un mois de salaire : calcul mensuel ordinaire", () => {
    const paie = calculerPaie(base, DEFAULT_PARAMS, fin(10));
    const stc = { ...calculerSTC(base, paie, 0, "demission", "2026-11-10"), indCongesNonPris: 0 };
    const net = calculerSTCNet(stc, base, paie, DEFAULT_PARAMS, "2026-11-10", true);
    expect(net.moisEquivalents).toBe(1);
  });
});
