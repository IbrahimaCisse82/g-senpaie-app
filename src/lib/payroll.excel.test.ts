/**
 * Non-régression contre le fichier de référence SENEXCELPAIE « LOGICIEL GESTION DE LA PAIE »
 * (onglet « élements de salaires », période de paie : novembre 2024).
 * Valeurs attendues = valeurs calculées par Excel, comparées au franc près.
 */
import { describe, it, expect } from "vitest";
import { calculerPaie, calculerIR, getPartsIR, getAnciennete, type Employee } from "./payroll";
import { FIN_NOV_2024, PARAMS_EXCEL, OUSMANE, FANTA, MANSOUR } from "./__fixtures__/excel";

const AU_FRANC = 0; // toBeCloseTo(x, 0) : écart < 0,5 F

describe("Excel — FANTA GAYE (CDD, célibataire, agent de maîtrise) : reproduction exacte", () => {
  const r = calculerPaie(FANTA, PARAMS_EXCEL, FIN_NOV_2024);
  it("ancienneté et prime", () => { expect(r.anc).toBe(4); expect(r.primeAnc).toBeCloseTo(4559.36, AU_FRANC); });
  it("brut", () => expect(r.brut).toBeCloseTo(675025.3333, AU_FRANC));
  it("IR", () => expect(r.ir).toBeCloseTo(170333.3333, AU_FRANC));
  it("TRIMF", () => expect(r.trimf).toBeCloseTo(1500, AU_FRANC));
  it("IPRES RG salarié / patronal", () => { expect(r.ipresRG_s).toBeCloseTo(24192, AU_FRANC); expect(r.ipresRG_p).toBeCloseTo(36288, AU_FRANC); });
  it("pas d'IPRES RCC (non cadre)", () => expect(r.ipresRC_s).toBe(0));
  it("CSS AF / AT, CFCE, IPM", () => {
    expect(r.css_af).toBeCloseTo(4410, AU_FRANC); expect(r.css_at).toBeCloseTo(3150, AU_FRANC);
    expect(r.cfce).toBeCloseTo(20250.76, AU_FRANC); expect(r.ipm_s).toBeCloseTo(5000, AU_FRANC);
  });
  it("total retenues, charges patronales", () => {
    expect(r.totalRet).toBeCloseTo(201025.3333, AU_FRANC); expect(r.chargesPat).toBeCloseTo(64098.76, AU_FRANC);
  });
  it("net à payer = 500 000", () => expect(r.net).toBeCloseTo(500000, AU_FRANC));
});

describe("Excel — MANSOUR GAYE (prestataire, veuf 4 enfants) : reproduction exacte", () => {
  const r = calculerPaie(MANSOUR, PARAMS_EXCEL, FIN_NOV_2024);
  it("parts IR = 3,5", () => expect(r.partsIR).toBe(3.5));
  it("aucun IR / TRIMF / IPRES / CSS / CFCE / prime d'ancienneté", () => {
    expect(r.ir + r.trimf + r.ipresRG_s + r.ipresRG_p + r.css_af + r.css_at + r.cfce + r.primeAnc).toBe(0);
  });
  it("BRS 5 %", () => expect(r.brs).toBeCloseTo(26315.7895, AU_FRANC));
  it("net à payer = 495 000 (pas de transport)", () => { expect(r.transport).toBe(0); expect(r.net).toBeCloseTo(495000, AU_FRANC); });
});

describe("Excel — OUSMANE DIOP (CDI cadre, marié 3 enfants, absences et heures sup)", () => {
  const r = calculerPaie(OUSMANE, PARAMS_EXCEL, FIN_NOV_2024);
  it("ancienneté 3 ans à fin novembre 2024", () => expect(r.anc).toBe(3));
  it("taux horaire sur base + sursalaire", () => expect(r.tauxHoraire).toBeCloseTo(5428.9846, 3));
  it("heures supplémentaires", () => {
    expect(r.mtHS115).toBeCloseTo(199786.6338, AU_FRANC); expect(r.mtHS140).toBeCloseTo(91206.9415, AU_FRANC);
    expect(r.mtHS160).toBeCloseTo(138982.0062, AU_FRANC); expect(r.mtHS200).toBeCloseTo(86863.7538, AU_FRANC);
  });
  it("retenue d'absence", () => expect(r.retAbsence).toBeCloseTo(43432.7122, AU_FRANC));
  it("prime d'ancienneté = 3 % × salaire de base (choix retenu, l'Excel la proratise)", () =>
    expect(r.primeAnc).toBeCloseTo(141024 * 0.03, AU_FRANC));
  it("brut = brut Excel − écart de prime d'ancienneté", () =>
    expect(r.brut).toBeCloseTo(1420125.8514 - (5695.2282 - 141024 * 0.03), AU_FRANC));
  it("IR Excel sur le brut Excel : 338 462,5", () => expect(calculerIR(1420125.851380692, 3).ir).toBeCloseTo(338462.5, AU_FRANC));
  it("TRIMF (2 parts)", () => expect(r.trimf).toBeCloseTo(6000, AU_FRANC));
  it("IPRES RG et RCC plafonnés", () => {
    expect(r.ipresRG_s).toBeCloseTo(24192, AU_FRANC); expect(r.ipresRC_s).toBeCloseTo(31104, AU_FRANC);
    expect(r.ipresRC_p).toBeCloseTo(46656, AU_FRANC);
  });
});

describe("Règles fiscales", () => {
  it("parts IR : marié(e), veuf avec enfants, plafond 5", () => {
    expect(getPartsIR("Marié(e)", 0)).toBe(1.5);
    expect(getPartsIR("Marié(e)", 3)).toBe(3);
    expect(getPartsIR("Veuf(ve)", 0)).toBe(1);
    expect(getPartsIR("Veuf(ve)", 4)).toBe(3.5);
    expect(getPartsIR("Célibataire", 2)).toBe(2);
    expect(getPartsIR("Marié(e)", 10)).toBe(5);
  });
  it("réduction pour charges de famille bornée par son minimum", () => {
    // 2 parts, impôt brut faible : réduction minimale 200 000 → IR nul
    expect(calculerIR(150000, 2).ir).toBe(0);
  });
  it("réduction bornée par son maximum (1,5 part : 300 000)", () => {
    const { impotBrut, reduction } = calculerIR(5000000, 1.5);
    expect(impotBrut * 0.1).toBeGreaterThan(300000);
    expect(reduction).toBe(300000);
  });
  it("ancienneté = années révolues au lendemain de la fin de mois (DATEDIF)", () => {
    expect(getAnciennete("2022-12-01", new Date(2024, 10, 30))).toBe(2);
    expect(getAnciennete("2022-12-02", new Date(2024, 10, 30))).toBe(1);
  });
});

describe("Maladie : pas de double paiement", () => {
  const base: Employee = { ...FANTA, heuresAbsMaladie: 16 };
  it("taux 0 : heures déduites, rien d'indemnisé", () => {
    const r = calculerPaie({ ...base, tauxMaladie: 0 }, PARAMS_EXCEL, FIN_NOV_2024);
    const ref = calculerPaie(FANTA, PARAMS_EXCEL, FIN_NOV_2024);
    expect(r.brut).toBeLessThan(ref.brut);
  });
  it("taux 1 : salaire intégralement maintenu", () => {
    const r = calculerPaie({ ...base, tauxMaladie: 1 }, PARAMS_EXCEL, FIN_NOV_2024);
    const ref = calculerPaie(FANTA, PARAMS_EXCEL, FIN_NOV_2024);
    expect(r.brut).toBeCloseTo(ref.brut, 6);
  });
});
