import { it } from "vitest";
import { calculerPaie } from "@/lib/payroll";
import { DEFAULT_PARAMS, DEFAULT_EMPLOYEES } from "@/lib/constants";
it("scan", () => {
  const ref = new Date("2025-06-01");
  for (const e of DEFAULT_EMPLOYEES) {
    const r = calculerPaie(e, DEFAULT_PARAMS, ref);
    console.log(e.matricule, "brut", Math.round(r.brut), "net", Math.round(r.net));
  }
  // scan cadre marié 2 enfants
  for (let sb = 200000; sb <= 600000; sb += 1000) {
    const emp = { ...DEFAULT_EMPLOYEES[0], statut: "cadres", situationFamille: "Marié(e)", enfants: 2, femmes: 1, salaireBase: sb, sursalaire: 0, dateEntree: "2015-01-01" };
    const r = calculerPaie(emp as never, DEFAULT_PARAMS, ref);
    if (Math.abs(Math.round(r.net) - 338174) < 600) console.log("MATCH sb", sb, Math.round(r.net));
  }
});
