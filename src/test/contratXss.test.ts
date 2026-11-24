import { describe, it, expect } from "vitest";
import { buildContratHtml } from "@/components/senpaie/ContratsPage";
import { DEMO_EMPLOYEES } from "@/lib/demoData";
import type { Contrat } from "@/hooks/useRH";
import type { Entreprise } from "@/lib/payroll";

describe("contrat : données saisies échappées", () => {
  it("ne laisse passer aucune balise issue du nom, de la fonction ou de l'entreprise", () => {
    const piege = '<img src=x onerror="alert(1)">';
    const emp = { ...DEMO_EMPLOYEES[0], nom: piege, fonction: piege, lieuNaissance: piege };
    const ent = { nom: piege, adresse: piege, ninea: "", rccm: "" } as unknown as Entreprise;
    const c = { matricule: emp.matricule, type: "CDI", dateDebut: "2026-01-01" } as unknown as Contrat;
    const html = buildContratHtml(emp, c, ent);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
