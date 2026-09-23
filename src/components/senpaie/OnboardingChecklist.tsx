import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Entreprise } from "@/lib/payroll";
import type { TabId } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface OnboardingChecklistProps {
  entreprise: Entreprise;
  employeesCount: number;
  conventionsCount: number;
  historyCount: number;
  hasDemo: boolean;
  demoBusy?: boolean;
  onGoTo: (tab: TabId) => void;
  onLoadDemo: () => void;
  onRemoveDemo: () => void;
}

const DISMISS_KEY = "senpaie_onboarding_dismissed";

export function OnboardingChecklist({
  entreprise,
  employeesCount,
  conventionsCount,
  historyCount,
  hasDemo,
  demoBusy = false,
  onGoTo,
  onLoadDemo,
  onRemoveDemo,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  const steps = useMemo(
    () => [
      {
        id: "entreprise" as TabId,
        label: "Renseigner votre entreprise",
        hint: "Nom, NINEA, RCCM et logo apparaissent sur les bulletins.",
        done: Boolean(entreprise.nom && entreprise.ninea),
        cta: "Compléter",
      },
      {
        id: "conventions" as TabId,
        label: "Vérifier votre convention collective",
        hint: "Les minima conventionnels sécurisent vos salaires.",
        done: conventionsCount > 0,
        cta: "Ouvrir",
      },
      {
        id: "employes" as TabId,
        label: "Ajouter vos salariés",
        hint: "Saisie manuelle ou import Excel en une fois.",
        done: employeesCount > 0,
        cta: "Ajouter",
      },
      {
        id: "parametres" as TabId,
        label: "Choisir votre modèle de bulletin",
        hint: "10 modèles prévisualisables dans les paramètres.",
        done: Boolean(entreprise.bulletinTemplate && entreprise.bulletinTemplate !== "classique"),
        cta: "Choisir",
      },
      {
        id: "dashboard" as TabId,
        label: "Clôturer votre premier mois",
        hint: "La clôture alimente l'historique et les tendances.",
        done: historyCount > 0,
        cta: "Voir",
      },
    ],
    [entreprise, employeesCount, conventionsCount, historyCount]
  );

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  if (dismissed || doneCount === steps.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 mb-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-foreground text-sm font-extrabold">🚀 Démarrage rapide</div>
          <div className="text-muted-foreground text-[11px] mt-0.5">
            {doneCount}/{steps.length} étapes terminées — configurez G-SENPAIE en quelques minutes.
          </div>
        </div>
        <button
          onClick={() => { localStorage.setItem(DISMISS_KEY, "1"); setDismissed(true); }}
          className="text-muted-foreground bg-transparent border-none cursor-pointer text-[11px] hover:text-foreground transition-colors"
          title="Masquer la checklist"
        >
          ✕
        </button>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-4">
        <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-2">
        {steps.map((s, i) => (
          <div
            key={s.id + i}
            className="page-section flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-border transition-all duration-200 hover:border-primary/50 hover:bg-secondary/40"
            style={{ animationDelay: `${i * 55}ms` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                  s.done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <div className="min-w-0">
                <div className={`text-xs font-bold truncate ${s.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {s.label}
                </div>
                <div className="text-muted-foreground text-[10px] truncate">{s.hint}</div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onGoTo(s.id)}
              aria-label={`${s.done ? "Revoir" : s.cta} : ${s.label}`}
              className="group/action h-8 shrink-0 px-2.5 text-[11px] font-bold text-primary hover:bg-primary/15 hover:text-primary"
            >
              {s.done ? "Revoir" : s.cta}
              <ChevronRight className="transition-transform duration-200 group-hover/action:translate-x-0.5" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-muted-foreground text-[11px]">
          {hasDemo
            ? "🧪 Mode démo actif — données d'exemple visibles dans toute l'application."
            : "Envie d'explorer d'abord ? Chargez un jeu de données d'exemple."}
        </div>
        <button
          disabled={demoBusy}
          onClick={hasDemo ? onRemoveDemo : onLoadDemo}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            hasDemo
              ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
              : "bg-senpaie-blue/15 text-senpaie-blue hover:bg-senpaie-blue/25"
          }`}
        >
          {demoBusy ? "…" : hasDemo ? "🗑 Supprimer les données de démo" : "🧪 Charger des données de démo"}
        </button>
      </div>
    </div>
  );
}

export default OnboardingChecklist;
