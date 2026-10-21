import { useState } from "react";
import type { PayrollParams } from "@/lib/payroll";
import { CSS_AT_CLASSES } from "@/lib/payroll";
import { Field, inputClass } from "./Modal";

interface ParametresProps {
  params: PayrollParams;
  onSave: (p: PayrollParams) => void;
  onReset: () => void;
}

export function Parametres({ params, onSave, onReset }: ParametresProps) {
  const [local, setLocal] = useState<PayrollParams>(() => JSON.parse(JSON.stringify(params)));
  const setP = (key: keyof PayrollParams, field: string, value: string) => {
    setLocal((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as Record<string, unknown>), [field]: isNaN(+value) ? value : +value },
    }));
  };

  const setPlafond = (key: keyof PayrollParams, actif: boolean) => {
    setLocal((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as Record<string, unknown>), plafond: actif ? 63000 : null },
    }));
  };

  const KEYS = ["CFCE", "BRS", "IPRES_RG", "IPRES_RCC", "CSS_AF", "CSS_AT", "IPM"] as const;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-foreground text-xl font-extrabold mb-1">Paramètres</h1>
          <div className="text-muted-foreground text-[11px]">Taux des cotisations sociales · République du Sénégal</div>
        </div>
        <div className="flex gap-2.5">
          <button onClick={onReset} className="px-4 py-2 bg-transparent border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px] cursor-pointer">↺ Réinitialiser</button>
          <button onClick={() => onSave(local)} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none">💾 Enregistrer</button>
        </div>
      </div>

      <div className="bg-card rounded-lg mb-5 overflow-hidden border border-border">
        <div className="px-5 py-3.5 border-b border-border bg-background flex justify-between items-center">
          <div>
            <div className="text-primary font-bold text-[13px]">🏛️ Cotisations Sociales</div>
            <div className="text-muted-foreground text-[11px] mt-0.5">Modifier les taux et plafonds appliqués au calcul de la paie</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-background">
                {["Libellé", "Taux total", "dont salarié", "dont patronal", "Plafond (FCFA)"].map((h) => (
                  <th key={h} className={`py-2.5 px-4 text-muted-foreground font-semibold border-b border-border whitespace-nowrap ${h === "Libellé" ? "text-left" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {KEYS.map((key, i) => {
                const p = local[key];
                return (
                  <tr key={key} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-senpaie-alt-row"}`}>
                    <td className="py-2.5 px-4 text-foreground font-semibold">
                      {p.label}
                      {key === "CSS_AT" && (
                        <select
                          value={CSS_AT_CLASSES.find((c) => Math.abs(c.taux - p.taux) < 1e-9)?.taux ?? ""}
                          onChange={(e) => e.target.value && setP(key, "taux", e.target.value)}
                          className={`${inputClass} mt-1.5 py-1 px-2 text-[11px] font-normal w-full max-w-[230px]`}
                        >
                          <option value="">Taux personnalisé</option>
                          {CSS_AT_CLASSES.map((c) => <option key={c.taux} value={c.taux}>{c.label}</option>)}
                        </select>
                      )}
                      {key === "IPM" && p.taux === 0 && (
                        <div className="text-muted-foreground text-[10px] font-normal mt-1">Taux 0 = entreprise sans IPM</div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input type="number" step="0.001" min="0" max="1" value={p.taux} onChange={(e) => setP(key, "taux", e.target.value)}
                          className={`${inputClass} w-20 text-center py-1.5 px-2`} />
                        <span className="text-primary text-[11px] min-w-[36px]">= {(p.taux * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input type="number" step="0.1" min="0" max="1" value={p.tauxSalarial} onChange={(e) => setP(key, "tauxSalarial", e.target.value)}
                          className={`${inputClass} w-[70px] text-center py-1.5 px-2`} />
                        <span className="text-muted-foreground text-[10px]">({(p.tauxSalarial * 100).toFixed(0)}%)</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input type="number" step="0.1" min="0" max="1" value={p.tauxPatronal} onChange={(e) => setP(key, "tauxPatronal", e.target.value)}
                          className={`${inputClass} w-[70px] text-center py-1.5 px-2`} />
                        <span className="text-muted-foreground text-[10px]">({(p.tauxPatronal * 100).toFixed(0)}%)</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer whitespace-nowrap">
                          <input type="checkbox" checked={p.plafond !== null} onChange={(e) => setPlafond(key, e.target.checked)} />
                          Plafonné
                        </label>
                        {p.plafond !== null ? (
                          <input type="number" step="1000" min="0" value={p.plafond ?? ""} onChange={(e) => setP(key, "plafond", e.target.value)}
                            className={`${inputClass} w-[120px] text-center py-1.5 px-2`} />
                        ) : (
                          <span className="text-senpaie-dim text-[11px] w-[120px]">Sans plafond</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transport */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="text-primary text-xs font-bold mb-3.5 pb-2 border-b border-border">🚌 Indemnité de Transport</div>
        <Field label="Montant mensuel (FCFA)">
          <input type="number" step="500" min="0" value={local.transport.valeur}
            onChange={(e) => setLocal((prev) => ({ ...prev, transport: { ...prev.transport, valeur: +e.target.value } }))}
            className={`${inputClass} max-w-[200px]`} />
        </Field>
      </div>
    </div>
  );
}

export default Parametres;
