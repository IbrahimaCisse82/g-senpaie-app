import { describe, it, expect } from "vitest";
import { entrepriseSchema, employeeSchema, formatZodError } from "@/lib/validation";

const ent = (o: Record<string, string>) => entrepriseSchema.safeParse({ nom: "GROW HUB SARL", ...o });
describe("Validation entreprise (zod 4)", () => {
  it("NINEA : 9 chiffres, avec ou sans code COFI ; ancien format 7 chiffres", () => {
    expect(ent({ ninea: "006760210" }).success).toBe(true);
    expect(ent({ ninea: "006760210 2G3" }).success).toBe(true);
    expect(ent({ ninea: "0012345" }).success).toBe(true);
    expect(ent({ ninea: "12AB" }).success).toBe(false);
  });
  it("RCCM : format officiel et variantes d'écriture", () => {
    for (const r of ["SN-DKR-2020-B-12345", "SN DKR 2010 B 1234", "SN.THS.2019.A.567"]) expect(ent({ rccm: r }).success).toBe(true);
    expect(ent({ rccm: "12345" }).success).toBe(false);
  });
  it("message d'erreur avec le libellé du champ en français", () => {
    const r = ent({ ninea: "12AB" });
    expect(r.success).toBe(false);
    if (!r.success) expect(formatZodError(r.error)).toMatch(/^• NINEA : /);
  });
  it("salarié : coercition des nombres et e-mail vide accepté", () => {
    const r = employeeSchema.safeParse({ matricule: "A1", prenom: "A", nom: "B", dateEntree: "2024-01-01", salaireBase: "150000", sursalaire: "0", femmes: "0", enfants: "2", email: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.salaireBase).toBe(150000);
  });
});
