import { describe, it, expect } from "vitest";
import { calculerPaie, getAnciennete, getTauxAnciennete, type Employee } from "@/lib/payroll";
import { DEFAULT_PARAMS, EMPTY_EMPLOYEE, DEFAULT_EMPLOYEES } from "@/lib/constants";

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

describe("calculerPaie - Plafond CSS", () => {
  it("plafonne la base CSS à 63 000 FCFA", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 800000, dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(r.baseCSS).toBe(63000);
    expect(Math.round(r.css_af)).toBe(Math.round(63000 * 0.07));
    expect(Math.round(r.css_at)).toBe(Math.round(63000 * 0.01));
  });
});

describe("calculerPaie - Plafond IPRES RCC (cadres)", () => {
  it("plafonne la base RCC à 1 296 000 FCFA", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 3000000, statut: "cadres", dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(Math.round(r.ipresRC_s)).toBe(Math.round(1296000 * 0.06 * 0.4));
  });
});

describe("calculerPaie - TRIMF", () => {
  it("applique le TRIMF minimal (900 F/an) sous 600 000 F de brut annuel", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 40000, dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(Math.round(r.trimf)).toBe(75); // 900 / 12
  });
  it("applique la tranche 3 600 F/an au SMIG (1 part)", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 64281, dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(Math.round(r.trimf)).toBe(300); // 3 600 / 12
  });
  it("plafonne le nombre de parts TRIMF à 5", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 64281, femmes: 9, dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(r.partsTRIMFCap).toBe(5);
  });
});

describe("calculerPaie - Prime d'ancienneté", () => {
  it("applique 1% par année à partir de 2 ans", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 100000, dateEntree: "2020-01-01" }), DEFAULT_PARAMS, refDate);
    expect(r.anc).toBe(5);
    expect(r.primeAnc).toBe(5000);
  });
  it("aucune prime avant 2 ans", () => {
    const r = calculerPaie(baseEmp({ salaireBase: 100000, dateEntree: "2024-01-01" }), DEFAULT_PARAMS, refDate);
    expect(r.primeAnc).toBe(0);
  });
});

describe("calculerPaie - Majorations heures supplémentaires", () => {
  it("applique 15 / 40 / 60 / 100 %", () => {
    const emp = baseEmp({ dateEntree: "2024-01-01", hs115: 1, hs140: 1, hs160: 1, hs200: 1 });
    const r = calculerPaie(emp, DEFAULT_PARAMS, refDate);
    const th = 100000 / 173.33;
    expect(r.tauxHoraire).toBeCloseTo(th, 6);
    expect(r.mtHS115).toBeCloseTo(th * 1.15, 6);
    expect(r.mtHS140).toBeCloseTo(th * 1.4, 6);
    expect(r.mtHS160).toBeCloseTo(th * 1.6, 6);
    expect(r.mtHS200).toBeCloseTo(th * 2, 6);
  });
});

describe("Scénario de référence Excel (GROW HUB)", () => {
  it("total net à payer = 338 174 FCFA", () => {
    const ref = new Date("2026-06-01");
    const total = DEFAULT_EMPLOYEES.reduce((s, e) => s + calculerPaie(e, DEFAULT_PARAMS, ref).net, 0);
    expect(Math.round(total)).toBe(338174);
  });
});