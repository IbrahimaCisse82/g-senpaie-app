import { describe, it, expect } from "vitest";
import { calculerPaie, getAnciennete, getTauxAnciennete, type Employee } from "@/lib/payroll";
import { DEFAULT_PARAMS, EMPTY_EMPLOYEE } from "@/lib/constants";

const refDate = new Date("2025-06-01");

const baseEmp = (overrides: Partial<Employee> = {}): Employee => ({
  ...EMPTY_EMPLOYEE,
  matricule: "T001",
  prenom: "Test",
  nom: "User",
  fonction: "Testeur",
  dateEntree: "2020-01-01",
  salaireBase: 100000,
  ...overrides,
});

describe("Ancienneté", () => {
  it("calcule 5 ans entre 2020-01-01 et 2025-06-01", () => {
    expect(getAnciennete("2020-01-01", refDate)).toBe(5);
  });
  it("retourne 0 si <2 ans", () => {
    expect(getTauxAnciennete(1)).toBe(0);
  });
  it("retourne anc/100 dès 2 ans", () => {
    expect(getTauxAnciennete(5)).toBe(0.05);
  });
});

describe("calculerPaie - SMIG", () => {
  it("calcule un brut au SMIG sans erreur", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 64281, dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(r.brut).toBe(64281);
    expect(r.net).toBeGreaterThan(0);
  });
});

describe("calculerPaie - IPRES plafond", () => {
  it("plafonne IPRES RG à 432 000", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 1000000, dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    // 432000 * 0.14 * 0.4 = 24 192
    expect(Math.round(r.ipresRG_s)).toBe(24192);
  });
  it("n'applique pas IPRES RC aux non-cadres", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 500000, statut: "employés", dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(r.ipresRC_s).toBe(0);
  });
  it("applique IPRES RC aux cadres", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 500000, statut: "cadres", dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(r.ipresRC_s).toBeGreaterThan(0);
  });
});

describe("calculerPaie - IR progressif", () => {
  it("IR=0 sur très petit brut", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 60000, dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(r.ir).toBe(0);
  });
  it("IR > 0 sur salaire moyen", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 500000, dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(r.ir).toBeGreaterThan(0);
  });
});

describe("calculerPaie - Heures supplémentaires", () => {
  it("ajoute les HS au brut", () => {
    const sans = calculerPaie(baseEmp({ dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    const avec = calculerPaie(baseEmp({ dateEntree: "2024-01-01", hs115: 10 }), DEFAULT_PARAMS, refDate);
    expect(avec.brut).toBeGreaterThan(sans.brut);
    expect(avec.totalHS).toBeCloseTo(10 * (100000 / 173.33) * 1.15, 0);
  });
});

describe("calculerPaie - Avances", () => {
  it("déduit les avances du net", () => {
    const sans = calculerPaie(baseEmp({ dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    const avec = calculerPaie(baseEmp({ dateEntree: "2024-01-01", avanceCaisse: 50000 }), DEFAULT_PARAMS, refDate);
    expect(avec.net).toBe(sans.net - 50000);
  });
});