import { useState, useMemo } from "react";
import type { Employee, PayrollParams, PayrollResult } from "@/lib/payroll";
import { calculerPaie, fmt, MOIS } from "@/lib/payroll";
import { EMPTY_EMPLOYEE } from "@/lib/constants";
import { Field, inputClass } from "./Modal";

interface SimulateurProps {
  params: PayrollParams;
}

export function Simulateur({ params }: SimulateurProps) {
  const [sim, setSim] = useState({
    salaireBase: 300000, anciennete: 5, enfants: 2,
    statut: "agents de maîtrise", situationFamille: "Marié(e)",
  });

  const simEmp = useMemo(() => ({
    ...EMPTY_EMPLOYEE,
    ...sim,
    dateEntree: new Date(Date.now() - sim.anciennete * 365.25 * 86400000).toISOString().slice(0, 10),
  }), [sim]);

  const simRes = useMemo(() => calculerPaie(simEmp, params), [simEmp, params]);

  return (
    <div>
      <h1 className="text-foreground text-xl font-extrabold mb-1">Simulateur de Paie</h1>
      <div className="text-muted-foreground text-[11px] mb-5">Basé sur les paramètres actifs</div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-card rounded-lg p-5">
          <div className="text-muted-foreground text-[11px] uppercase mb-4">Paramètres de simulation</div>
          <Field label="Salaire de base (FCFA)">
            <input type="number" value={sim.salaireBase} onChange={(e) => setSim((s) => ({ ...s, salaireBase: +e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Ancienneté (années)">
            <input type="number" value={sim.anciennete} min={0} max={40} onChange={(e) => setSim((s) => ({ ...s, anciennete: +e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Nombre d'enfants">
            <input type="number" value={sim.enfants} min={0} onChange={(e) => setSim((s) => ({ ...s, enfants: +e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Statut">
            <select value={sim.statut} onChange={(e) => setSim((s) => ({ ...s, statut: e.target.value }))} className={inputClass}>
              {["employés", "agents de maîtrise", "cadres"].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Situation de famille">
            <select value={sim.situationFamille} onChange={(e) => setSim((s) => ({ ...s, situationFamille: e.target.value }))} className={inputClass}>
              {["Célibataire", "Marié(e)", "Veuf(ve)", "Divorcé(e)"].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div className="bg-card rounded-lg p-5">
          <div className="text-muted-foreground text-[11px] uppercase mb-4">Résultat</div>
          {([
            ["Salaire de base", simRes.salaireBase, "text-foreground", false],
            ["Prime d'ancienneté", simRes.primeAnc, "text-senpaie-blue", false],
            ["SALAIRE BRUT", simRes.brut, "text-senpaie-blue", true],
            ["— IR", -simRes.ir, "text-destructive", false],
            ["— TRIMF", -simRes.trimf, "text-destructive", false],
            ["— IPRES RG salarié", -simRes.ipresRG_s, "text-destructive", false],
            ["— IPRES RC salarié", -simRes.ipresRC_s, "text-destructive", false],
            ["— IPM salarié", -simRes.ipm_s, "text-destructive", false],
            ["+ Transport", simRes.transport, "text-primary", false],
          ] as [string, number, string, boolean][]).filter(([, v]) => Math.abs(v) > 0).map(([l, v, c, b]) => (
            <div key={l} className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground text-xs">{l}</span>
              <span className={`text-xs ${c} ${b ? "font-extrabold" : ""}`}>{v < 0 ? `- ${fmt(-v)}` : fmt(v)} F</span>
            </div>
          ))}

          <div className="bg-primary/10 border border-primary rounded-lg px-4 py-3 mt-3 flex justify-between items-center">
            <span className="text-foreground font-bold">NET À PAYER</span>
            <span className="text-primary text-xl font-black">{fmt(simRes.net)} FCFA</span>
          </div>

          <div className="mt-2.5 p-3 bg-background rounded-lg">
            <div className="flex justify-between mb-1.5">
              <span className="text-muted-foreground text-xs">Charges patronales</span>
              <span className="text-senpaie-yellow font-bold text-xs">{fmt(simRes.chargesPat)} F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs">Masse salariale</span>
              <span className="text-senpaie-purple font-bold text-xs">{fmt(simRes.masse)} F</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Simulateur;
