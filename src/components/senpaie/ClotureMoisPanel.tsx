import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MOIS, fmt } from "@/lib/payroll";
import type { Employee, PayrollResult } from "@/lib/payroll";

type Row = { id: string; matricule: string; nom_complet: string; email: string | null; net: number; statut_envoi: string; erreur?: string | null };
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
  const [envoi, setEnvoi] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!entrepriseId) return;
    const { data } = await supabase
      .from("bulletins_mois")
      .select("id, matricule, nom_complet, email, net, statut_envoi, erreur")
      .eq("entreprise_id", entrepriseId).eq("mois", mois).eq("annee", annee)
      .order("nom_complet");
    setRows((data ?? []) as Row[]);
  }, [entrepriseId, mois, annee]);

  useEffect(() => { load(); }, [load]);

  // La clôture (archivage, bulletins figés, remise à zéro des variables) est faite par onCloseMonth,
  // la même fonction que le bouton du tableau de bord.
  const cloturer = async () => {
    if (!entrepriseId) return;
    setBusy(true);
    await onCloseMonth();
    await load();
    setBusy(false);
  };

  const sansEmail = rows.filter((r) => r.statut_envoi === "sans_email").length;
  const aEnvoyer = rows.filter((r) => r.statut_envoi === "en_attente" || r.statut_envoi === "echec").length;

  // Avis par e-mail : le message ne contient aucun montant, le salarié consulte le bulletin dans son espace
  const envoyer = async () => {
    if (!entrepriseId) return;
    setEnvoi(true); setMsg("");
    const { data, error } = await supabase.functions.invoke("envoyer-bulletins", { body: { entrepriseId, mois, annee } });
    if (error) setMsg("❌ Envoi impossible : la fonction d'envoi ne répond pas (est-elle déployée ?).");
    else if (data?.code === "non_configure") setMsg("⚠️ " + data.message + " Ajoutez la clé dans les secrets du projet, puis réessayez.");
    else if (data?.error) setMsg("❌ " + data.error);
    else setMsg(`✅ ${data?.envoyes ?? 0} avis envoyé(s)${data?.echecs ? ` · ${data.echecs} échec(s)` : ""}.`);
    await load();
    setEnvoi(false);
  };

  return (
    <div className="bg-card border border-border rounded-md p-4 mt-4 page-section">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <div className="text-muted-foreground text-[11px] uppercase">Clôture du mois</div>
          <div className="font-bold">{MOIS[mois]} {annee} — {rows.length ? `${rows.length} bulletin(s) générés` : "non clôturé"}</div>
        </div>
        {rows.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-primary font-bold" title="Pour corriger, rouvrez le mois depuis le tableau de bord">🔒 Mois clôturé · bulletins figés</span>
            {canClose && aEnvoyer > 0 && (
              <Button size="sm" onClick={envoyer} disabled={envoi}>{envoi ? "Envoi…" : `📧 Prévenir les salariés (${aEnvoyer})`}</Button>
            )}
          </div>
        ) : canClose && (
          <Button onClick={cloturer} disabled={busy || !allPaies.length}>
            {busy ? "Génération…" : "💾 Clôturer le mois"}
          </Button>
        )}
      </div>
      {rows.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-2">
            Chaque salarié reçoit un avis par e-mail (sans montant) et consulte son bulletin dans son espace salarié.{sansEmail ? ` ${sansEmail} salarié(s) sans adresse e-mail.` : ""}
          </p>
          {msg && <p className="text-xs font-bold mb-2">{msg}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1">Salarié</th><th>Email</th><th className="text-right">Net</th><th className="text-right">Suivi</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-1.5">{r.nom_complet} <span className="text-muted-foreground">({r.matricule})</span></td>
                    <td className="truncate max-w-[180px]">{r.email ?? "—"}</td>
                    <td className="text-right">{fmt(Number(r.net))} F</td>
                    <td className="text-right whitespace-nowrap" title={r.erreur ?? undefined}>{STATUTS[r.statut_envoi] ?? r.statut_envoi}</td>
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
