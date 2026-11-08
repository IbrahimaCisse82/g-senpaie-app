import { describe, it, expect } from "vitest";
import { calculerPaie, primeTransport, joursOuvresDuMois, normaliserParams, type PayrollParams } from "@/lib/payroll";
import { DEFAULT_PARAMS } from "@/lib/constants";
import { FANTA } from "@/lib/__fixtures__/excel";

const NOV_2026 = new Date(2026, 10, 30); // novembre 2026 : 21 jours ouvrés
const avec = (patch: Partial<PayrollParams>): PayrollParams => ({ ...JSON.parse(JSON.stringify(DEFAULT_PARAMS)), ...patch });

describe("Prime de transport : 3 modes au choix de l'entreprise", () => {
  it("jours ouvrés de novembre 2026 = 21", () => expect(joursOuvresDuMois(NOV_2026)).toBe(21));
  it("versée entière : absences sans effet", () => expect(primeTransport(26000, "entiere", 2, NOV_2026)).toBe(26000));
  it("par jour : 1/30 par jour d'absence", () => expect(primeTransport(26000, "jour_calendaire", 2, NOV_2026)).toBe(24267));
  it("par jour ouvré : prorata des jours ouvrés du mois", () => expect(primeTransport(26000, "jour_ouvre", 2, NOV_2026)).toBe(23524));
  it("sans absence : toujours entière ; jamais négative", () => {
    expect(primeTransport(26000, "jour_ouvre", 0, NOV_2026)).toBe(26000);
    expect(primeTransport(26000, "jour_calendaire", 40, NOV_2026)).toBe(0);
  });
  it("dans la paie : 16 h d'absence = 2 jours, maladie comprise", () => {
    const p = avec({ transport: { label: "T", valeur: 26000, mode: "jour_calendaire" } });
    expect(calculerPaie({ ...FANTA, heuresAbsence: 8, heuresAbsMaladie: 8 }, p, NOV_2026).transport).toBe(24267);
    expect(calculerPaie(FANTA, p, NOV_2026).transport).toBe(26000);
  });
  it("paramètres anciens sans mode : versée entière (comportement inchangé)", () => {
    const p = normaliserParams({ transport: { label: "T", valeur: 26000 } } as Partial<PayrollParams>, DEFAULT_PARAMS);
    expect(calculerPaie({ ...FANTA, heuresAbsence: 16 }, p, NOV_2026).transport).toBe(26000);
  });
});

describe("Prime de panier paramétrable", () => {
  it("montant par panier × nombre de paniers", () => {
    expect(calculerPaie({ ...FANTA, nbPaniers: 10 }, avec({ panier: { label: "P", valeur: 1112 } }), NOV_2026).primePanier).toBe(11120);
  });
  it("défaut 3 000 F si l'entreprise n'a rien réglé", () => {
    const p = normaliserParams({} as Partial<PayrollParams>, DEFAULT_PARAMS);
    expect(calculerPaie({ ...FANTA, nbPaniers: 2 }, p, NOV_2026).primePanier).toBe(6000);
  });
});
