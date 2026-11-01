import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MOIS } from "@/lib/constants";
import { fmt } from "@/lib/payroll";
import type { Employee, PayrollResult } from "@/lib/payroll";

type Row = { id: string; matricule: string; nom_complet: string; email: string | null; net: number; statut_envoi: string };
type Paie = Employee & { paie: PayrollResult };

interface Props {
  entrepriseId: string | null;
  allPaies: Paie[];
  onCloseMonth: () => Promise<void>;
  canClose: boolean;
}

const STATUTS: Record<string, string> = {
  en_attente: "⏳ Envoi en attente",
  sans_email: "⚠️ Sans email",
  envoye: "✅ Envoyé",
  echec: "❌ Échec",
};

export default function ClotureMoisPanel({ entrepriseId, allPaies, onCloseMonth, canClose }: Props) {
  const now = new Date();
  const mois = now.getMonth();
  const annee = now.getFullYear();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!entrepriseId) return;
    const { data } = await supabase
      .from("bulletins_mois")
      .select("id, matricule, nom_complet, email, net, statut_envoi")
      .eq("entreprise_id", entrepriseId).eq("mois", mois).eq("annee", annee)
      .order("nom_complet");
    setRows((data ?? []) as Row[]);
  }, [entrepriseId, mois, annee]);

  useEffect(() => { load(); }, [load]);

  const cloturer = async () => {
    if (!entrepriseId || !confirm(`Clôturer ${MOIS[mois]} ${annee} et générer ${allPaies.length} bulletin(s) ?`)) return;
    setBusy(true);
    await onCloseMonth();
    const payload = allPaies.map((e) => ({
      entreprise_id: entrepriseId, mois, annee,
      matricule: e.matricule,
      nom_complet: `${e.prenom} ${e.nom}`,
      email: e.email?.trim() || null,
      brut: Math.round(e.paie.brut),
      net: Math.round(e.paie.net),
      data: JSON.parse(JSON.stringify(e.paie)),
      statut_envoi: e.email?.trim() ? "en_attente" : "sans_email",
    }));
    if (payload.length) {
      await supabase.from("bulletins_mois").upsert(payload, { onConflict: "entreprise_id,mois,annee,matricule" });
    }
    await load();
    setBusy(false);
  };

  const sansEmail = rows.filter((r) => r.statut_envoi === "sans_email").length;

  return (
    <div className="bg-card border border-border rounded-md p-4 mt-4 page-section">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <div className="text-muted-foreground text-[11px] uppercase">Clôture du mois</div>
          <div className="font-bold">{MOIS[mois]} {annee} — {rows.length ? `${rows.length} bulletin(s) générés` : "non clôturé"}</div>
        </div>
        {canClose && (
          <Button onClick={cloturer} disabled={busy || !allPaies.length}>
            {busy ? "Génération…" : rows.length ? "🔁 Régénérer les bulletins" : "💾 Clôturer le mois"}
          </Button>
        )}
      </div>
      {rows.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-2">
            L'envoi par email démarrera dès que le domaine d'envoi sera configuré.{sansEmail ? ` ${sansEmail} salarié(s) sans adresse email.` : ""}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1">Salarié</th><th>Email</th><th className="text-right">Net</th><th className="text-right">Suivi</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-1.5">{r.nom_complet} <span className="text-muted-foreground">({r.matricule})</span></td>
                    <td className="truncate max-w-[180px]">{r.email ?? "—"}</td>
                    <td className="text-right">{fmt(Number(r.net))} F</td>
                    <td className="text-right whitespace-nowrap">{STATUTS[r.statut_envoi] ?? r.statut_envoi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
