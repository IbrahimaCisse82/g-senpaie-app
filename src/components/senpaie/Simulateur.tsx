import { useState, useMemo } from "react";
import type { PayrollParams } from "@/lib/payroll";
import { calculerPaie, fmt, MOIS } from "@/lib/payroll";
import { EMPTY_EMPLOYEE } from "@/lib/constants";
import { Field, inputClass } from "./Modal";

interface SimulateurProps {
  params: PayrollParams;
}

export function Simulateur({ params }: SimulateurProps) {
  const [sim, setSim] = useState({
    salaireBase: 300000, anciennete: 5, enfants: 2, femmes: 1,
    statut: "agents de maîtrise", situationFamille: "Marié(e)",
    hs115: 0, hs140: 0, sursalaire: 0,
  });

  const [compareMode, setCompareMode] = useState(false);
  const [sim2, setSim2] = useState({
    salaireBase: 500000, anciennete: 10, enfants: 3, femmes: 1,
    statut: "cadres", situationFamille: "Marié(e)",
    hs115: 0, hs140: 0, sursalaire: 0,
  });

  const makeEmp = (s: typeof sim) => ({
    ...EMPTY_EMPLOYEE,
    ...s,
    dateEntree: new Date(Date.now() - s.anciennete * 365.25 * 86400000).toISOString().slice(0, 10),
  });

  const simEmp = useMemo(() => makeEmp(sim), [sim]);
  const simRes = useMemo(() => calculerPaie(simEmp, params), [simEmp, params]);

  const simEmp2 = useMemo(() => makeEmp(sim2), [sim2]);
  const simRes2 = useMemo(() => calculerPaie(simEmp2, params), [simEmp2, params]);

  const SimPanel = ({ s, setS, res, label }: { s: typeof sim; setS: (fn: (prev: typeof sim) => typeof sim) => void; res: typeof simRes; label: string }) => (
    <div className="flex-1 min-w-0">
      <div className="bg-card rounded-lg p-4 md:p-5 mb-3">
        <div className="text-muted-foreground text-[11px] uppercase mb-4">{label}</div>

        <Field label={`Salaire de base : ${fmt(s.salaireBase)} F`}>
          <input type="range" min={50000} max={2000000} step={5000} value={s.salaireBase}
            onChange={(e) => setS((p) => ({ ...p, salaireBase: +e.target.value }))}
            className="w-full accent-primary h-2 cursor-pointer" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>50k</span><span>2M</span>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Ancienneté (ans)">
            <input type="number" value={s.anciennete} min={0} max={40} onChange={(e) => setS((p) => ({ ...p, anciennete: +e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Enfants">
            <input type="number" value={s.enfants} min={0} onChange={(e) => setS((p) => ({ ...p, enfants: +e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Femmes">
            <input type="number" value={s.femmes} min={0} max={4} onChange={(e) => setS((p) => ({ ...p, femmes: +e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Sursalaire">
            <input type="number" value={s.sursalaire} min={0} onChange={(e) => setS((p) => ({ ...p, sursalaire: +e.target.value }))} className={inputClass} />
          </Field>
        </div>

        <Field label="Statut">
          <select value={s.statut} onChange={(e) => setS((p) => ({ ...p, statut: e.target.value }))} className={inputClass}>
            {["employés", "agents de maîtrise", "cadres"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Situation familiale">
          <select value={s.situationFamille} onChange={(e) => setS((p) => ({ ...p, situationFamille: e.target.value }))} className={inputClass}>
            {["Célibataire", "Marié(e)", "Veuf(ve)", "Divorcé(e)"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
      </div>

      <div className="bg-card rounded-lg p-4 md:p-5">
        <div className="text-muted-foreground text-[11px] uppercase mb-4">Résultat</div>
        {([
          ["Salaire de base", res.salaireBase, "text-foreground", false],
          ["Sursalaire", res.sursalaire, "text-foreground", false],
          ["Prime d'ancienneté", res.primeAnc, "text-senpaie-blue", false],
          ["SALAIRE BRUT", res.brut, "text-senpaie-blue", true],
          ["— IR", -res.ir, "text-destructive", false],
          ["— TRIMF", -res.trimf, "text-destructive", false],
          ["— IPRES RG salarié", -res.ipresRG_s, "text-destructive", false],
          ["— IPRES RC salarié", -res.ipresRC_s, "text-destructive", false],
          ["— IPM salarié", -res.ipm_s, "text-destructive", false],
          ["+ Transport", res.transport, "text-primary", false],
        ] as [string, number, string, boolean][]).filter(([, v]) => Math.abs(v) > 0).map(([l, v, c, b]) => (
          <div key={l} className="flex justify-between py-1.5 border-b border-border">
            <span className="text-muted-foreground text-xs">{l}</span>
            <span className={`text-xs ${c} ${b ? "font-extrabold" : ""}`}>{v < 0 ? `- ${fmt(-v)}` : fmt(v)} F</span>
          </div>
        ))}

        <div className="bg-primary/10 border border-primary rounded-lg px-4 py-3 mt-3 flex justify-between items-center">
          <span className="text-foreground font-bold text-sm">NET À PAYER</span>
          <span className="text-primary text-lg md:text-xl font-black">{fmt(res.net)} F</span>
        </div>

        <div className="mt-2.5 p-3 bg-background rounded-lg">
          <div className="flex justify-between mb-1.5">
            <span className="text-muted-foreground text-xs">Charges patronales</span>
            <span className="text-senpaie-yellow font-bold text-xs">{fmt(res.chargesPat)} F</span>
          </div>
          <div className="flex justify-between mb-1.5">
            <span className="text-muted-foreground text-xs">Masse salariale</span>
            <span className="text-senpaie-purple font-bold text-xs">{fmt(res.masse)} F</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Taux retenues / brut</span>
            <span className="text-destructive font-bold text-xs">{res.brut > 0 ? ((res.totalRet / res.brut) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <h1 className="text-foreground text-xl font-extrabold mb-1">Simulateur de Paie</h1>
          <div className="text-muted-foreground text-[11px]">Basé sur les paramètres actifs · Utilisez le curseur pour ajuster le salaire</div>
        </div>
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={`px-4 py-2 rounded-lg font-bold text-[12px] cursor-pointer border transition-colors ${
            compareMode ? "bg-senpaie-blue/10 border-senpaie-blue text-senpaie-blue" : "bg-transparent border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {compareMode ? "✕ Fermer comparaison" : "⚖️ Mode comparaison"}
        </button>
      </div>

      <div className={`flex flex-col ${compareMode ? "lg:flex-row" : ""} gap-4`}>
        <SimPanel s={sim} setS={setSim} res={simRes} label={compareMode ? "📊 Scénario A" : "Paramètres de simulation"} />
        {compareMode && (
          <>
            <div className="hidden lg:flex items-center text-muted-foreground text-xl">⇄</div>
            <SimPanel s={sim2} setS={setSim2} res={simRes2} label="📊 Scénario B" />
          </>
        )}
      </div>

      {/* Comparison summary */}
      {compareMode && (
        <div className="mt-4 bg-card rounded-lg p-4 md:p-5 border border-border">
          <div className="text-muted-foreground text-[11px] uppercase mb-3">Comparaison</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              ["Δ Net", simRes2.net - simRes.net],
              ["Δ Brut", simRes2.brut - simRes.brut],
              ["Δ Retenues", simRes2.totalRet - simRes.totalRet],
              ["Δ Charges pat.", simRes2.chargesPat - simRes.chargesPat],
            ] as [string, number][]).map(([l, v]) => (
              <div key={l} className="bg-background rounded-lg p-3 text-center">
                <div className="text-muted-foreground text-[10px]">{l}</div>
                <div className={`text-sm font-extrabold mt-1 ${v > 0 ? "text-primary" : v < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {v > 0 ? "+" : ""}{fmt(v)} F
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Simulateur;
