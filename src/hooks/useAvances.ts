import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

function handleError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
  const msg = (error as { message?: string })?.message || "Erreur inconnue";
  toast({ title: "Erreur", description: `${context} : ${msg}`, variant: "destructive" });
}

export interface Echeance {
  id: string;
  avanceId: string;
  mois: number;
  annee: number;
  montant: number;
  statut: "en_attente" | "paye";
}

export interface Avance {
  id: string;
  employeeId: string;
  type: "avance" | "pret";
  montant: number;
  dateOctroi: string;
  nbMensualites: number;
  statut: "en_cours" | "solde" | "annule";
  motif: string;
  echeances: Echeance[];
}

interface AvanceRow {
  id: string;
  employee_id: string;
  type: string;
  montant: number;
  date_octroi: string;
  nb_mensualites: number;
  statut: string;
  motif: string | null;
}

interface EcheanceRow {
  id: string;
  avance_id: string;
  mois: number;
  annee: number;
  montant: number;
  statut: string;
}

export function useAvances(entrepriseId: string | null) {
  const [avances, setAvances] = useState<Avance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!entrepriseId) return;
    const [{ data: av, error: e1 }, { data: ec, error: e2 }] = await Promise.all([
      supabase.from("avances_pret").select("*").eq("entreprise_id" as never, entrepriseId as never).order("date_octroi", { ascending: false }),
      supabase.from("echeances_avance").select("*").eq("entreprise_id" as never, entrepriseId as never).order("annee").order("mois"),
    ]);
    if (e1 || e2) { handleError("Chargement avances", e1 || e2); setLoading(false); return; }
    const echByAvance = new Map<string, Echeance[]>();
    ((ec || []) as EcheanceRow[]).forEach((r) => {
      const list = echByAvance.get(r.avance_id) || [];
      list.push({ id: r.id, avanceId: r.avance_id, mois: r.mois, annee: r.annee, montant: Number(r.montant), statut: r.statut as Echeance["statut"] });
      echByAvance.set(r.avance_id, list);
    });
    setAvances(((av || []) as AvanceRow[]).map((r) => ({
      id: r.id,
      employeeId: r.employee_id,
      type: (r.type as Avance["type"]) || "avance",
      montant: Number(r.montant),
      dateOctroi: r.date_octroi,
      nbMensualites: r.nb_mensualites,
      statut: (r.statut as Avance["statut"]) || "en_cours",
      motif: r.motif || "",
      echeances: echByAvance.get(r.id) || [],
    })));
    setLoading(false);
  }, [entrepriseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /** Crée une avance et génère son échéancier (mensualités égales, 1re échéance le mois suivant). */
  const create = useCallback(async (a: Omit<Avance, "id" | "statut" | "echeances">) => {
    if (!entrepriseId) return;
    const { data, error } = await supabase.from("avances_pret").insert({
      entreprise_id: entrepriseId,
      employee_id: a.employeeId,
      type: a.type,
      montant: a.montant,
      date_octroi: a.dateOctroi,
      nb_mensualites: a.nbMensualites,
      motif: a.motif,
    } as never).select("id").single();
    if (error || !data) { handleError("Création avance", error); return; }
    const avanceId = (data as { id: string }).id;
    const base = Math.floor(a.montant / a.nbMensualites);
    const reste = a.montant - base * a.nbMensualites;
    const d = new Date(a.dateOctroi);
    const rows = Array.from({ length: a.nbMensualites }, (_, i) => {
      const m = new Date(d.getFullYear(), d.getMonth() + 1 + i, 1);
      return {
        avance_id: avanceId,
        entreprise_id: entrepriseId,
        mois: m.getMonth() + 1,
        annee: m.getFullYear(),
        montant: base + (i === a.nbMensualites - 1 ? reste : 0),
      };
    });
    const { error: e2 } = await supabase.from("echeances_avance").insert(rows as never);
    if (e2) { handleError("Création échéancier", e2); return; }
    toast({ title: "Avance enregistrée", description: `${a.nbMensualites} échéance(s) générée(s).` });
    await fetchAll();
  }, [entrepriseId, fetchAll]);

  const markEcheancePayee = useCallback(async (echeanceId: string) => {
    const { error } = await supabase.from("echeances_avance").update({ statut: "paye" } as never).eq("id", echeanceId);
    if (error) { handleError("Échéance", error); return; }
    await fetchAll();
  }, [fetchAll]);

  const setStatut = useCallback(async (id: string, statut: Avance["statut"]) => {
    const { error } = await supabase.from("avances_pret").update({ statut, updated_at: new Date().toISOString() } as never).eq("id", id);
    if (error) { handleError("Statut avance", error); return; }
    await fetchAll();
  }, [fetchAll]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("avances_pret").delete().eq("id", id);
    if (error) { handleError("Suppression avance", error); return; }
    await fetchAll();
  }, [fetchAll]);

  return { avances, loading, create, markEcheancePayee, setStatut, remove, refetch: fetchAll };
}

/** Montant à retenir sur la paie d'un salarié pour un mois/année donnés. */
export function retenueDuMois(avances: Avance[], employeeId: string, mois: number, annee: number): number {
  return avances
    .filter((a) => a.employeeId === employeeId && a.statut === "en_cours")
    .flatMap((a) => a.echeances)
    .filter((e) => e.statut === "en_attente" && e.mois === mois && e.annee === annee)
    .reduce((s, e) => s + e.montant, 0);
}
