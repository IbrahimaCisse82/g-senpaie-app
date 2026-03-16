import { useState } from "react";
import type { PayrollParams } from "@/lib/payroll";
import { BULLETIN_TEMPLATES, type BulletinTemplateId } from "@/lib/bulletinTemplates";
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

  const KEYS = ["CFCE", "BRS", "IPRES_RG", "IPRES_RCC", "CSS_AF", "CSS_AT", "IPM"] as const;
  const selectedTemplate = (local.bulletinTemplate || "classique") as BulletinTemplateId;

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

      {/* Template Bulletin */}
      <div className="bg-card rounded-lg mb-5 overflow-hidden border border-border">
        <div className="px-5 py-3.5 border-b border-border bg-background">
          <div className="text-primary font-bold text-[13px]">📄 Modèle de Bulletin de Paie</div>
          <div className="text-muted-foreground text-[11px] mt-0.5">Choisissez le style de présentation du PDF</div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {BULLETIN_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setLocal((prev) => ({ ...prev, bulletinTemplate: t.id }))}
              className={`relative text-left p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTemplate === t.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-muted-foreground/50 hover:bg-secondary/50"
              }`}
            >
              {selectedTemplate === t.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-bold">✓</div>
              )}
              {/* Preview mini */}
              <div className="w-full h-16 rounded mb-2 overflow-hidden flex flex-col" style={{ border: `1px solid ${t.previewColors.accent}20` }}>
                <div style={{ background: t.previewColors.header, height: "12px" }} className="flex items-center px-1.5">
                  <div className="w-3 h-1.5 rounded-sm" style={{ background: "rgba(255,255,255,0.4)" }}></div>
                </div>
                <div style={{ background: t.previewColors.bg, flex: 1 }} className="p-1 flex flex-col gap-0.5">
                  <div className="h-1 rounded-full w-3/4" style={{ background: `${t.previewColors.accent}30` }}></div>
                  <div className="h-1 rounded-full w-1/2" style={{ background: `${t.previewColors.accent}20` }}></div>
                  <div className="h-1 rounded-full w-2/3" style={{ background: `${t.previewColors.accent}30` }}></div>
                  <div className="mt-auto h-2 rounded-sm" style={{ background: t.previewColors.accent }}></div>
                </div>
              </div>
              <div className="text-[12px] font-bold text-foreground">{t.icon} {t.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t.description}</div>
            </button>
          ))}
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
                    <td className="py-2.5 px-4 text-foreground font-semibold">{p.label}</td>
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
                      {p.plafond !== null ? (
                        <input type="number" step="1000" min="0" value={p.plafond ?? ""} onChange={(e) => setP(key, "plafond", e.target.value)}
                          className={`${inputClass} w-[130px] text-center py-1.5 px-2`} />
                      ) : (
                        <span className="text-senpaie-dim text-[11px]">Sans plafond</span>
                      )}
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
