import { describe, it, expect } from "vitest";
import { calculerPaie, normaliserParams, type Employee, type PayrollParams } from "./payroll";
import { DEFAULT_PARAMS, DEFAULT_EMPLOYEES } from "./constants";

const REF = new Date(2026, 9, 31); // 31 octobre 2026
const base: Employee = { ...DEFAULT_EMPLOYEES[0], dateEntree: "2016-01-01", salaireBase: 100000, sursalaire: 50000 };
const clone = (p: PayrollParams): PayrollParams => JSON.parse(JSON.stringify(p));

describe("Prime d'ancienneté = % × salaire de base", () => {
  it("0 avant 2 ans", () => {
    const r = calculerPaie({ ...base, dateEntree: "2025-06-01" }, DEFAULT_PARAMS, REF);
    expect(r.primeAnc).toBe(0);
  });
  it("10 ans → 10 % du salaire de base (sursalaire exclu)", () => {
    const r = calculerPaie(base, DEFAULT_PARAMS, REF);
    expect(r.anc).toBe(10);
    expect(r.primeAnc).toBeCloseTo(10000, 6);
  });
});

describe("CSS accident du travail paramétrable", () => {
  it("applique le taux saisi (classe 3 = 5 %)", () => {
    const p = clone(DEFAULT_PARAMS); p.CSS_AT.taux = 0.05;
    const r = calculerPaie(base, p, REF);
    expect(r.css_at).toBeCloseTo(63000 * 0.05, 6);
  });
  it("utilise son propre plafond, indépendant des allocations familiales", () => {
    const p = clone(DEFAULT_PARAMS); p.CSS_AT.plafond = 100000; p.CSS_AF.plafond = 63000;
    const r = calculerPaie(base, p, REF);
    expect(r.baseCSS_AT).toBe(100000);
    expect(r.baseCSS).toBe(63000);
  });
});

describe("IPM paramétrable", () => {
  it("taux 0 par défaut → aucune cotisation", () => {
    const r = calculerPaie(base, DEFAULT_PARAMS, REF);
    expect(r.ipm_s).toBe(0); expect(r.ipm_p).toBe(0);
  });
  it("taux, répartition et plafond pris en compte", () => {
    const p = clone(DEFAULT_PARAMS);
    p.IPM = { ...p.IPM, taux: 0.06, tauxSalarial: 0.5, tauxPatronal: 0.5, plafond: 100000 };
    const r = calculerPaie(base, p, REF);
    expect(r.baseIPM).toBe(100000);
    expect(r.ipm_s).toBeCloseTo(3000, 6);
    expect(r.ipm_p).toBeCloseTo(3000, 6);
  });
  it("sans plafond → base = brut", () => {
    const p = clone(DEFAULT_PARAMS); p.IPM = { ...p.IPM, taux: 0.06, plafond: null };
    const r = calculerPaie(base, p, REF);
    expect(r.baseIPM).toBeCloseTo(r.brut, 6);
  });
});

describe("normaliserParams", () => {
  it("complète des paramètres anciens/incomplets avec les valeurs par défaut", () => {
    const n = normaliserParams({ CSS_AT: { taux: 0.03 } } as unknown as Partial<PayrollParams>, DEFAULT_PARAMS);
    expect(n.CSS_AT.taux).toBe(0.03);
    expect(n.CSS_AT.plafond).toBe(DEFAULT_PARAMS.CSS_AT.plafond);
    expect(n.IPM).toEqual(DEFAULT_PARAMS.IPM);
  });
});
