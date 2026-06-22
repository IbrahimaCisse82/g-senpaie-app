import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

function handleError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
  const msg = (error as { message?: string })?.message || "Erreur inconnue";
  toast({ title: "Erreur", description: `${context} : ${msg}`, variant: "destructive" });
}

// ══════════════════════════════════════════════════════════════
// Congés
// ══════════════════════════════════════════════════════════════
export interface Conge {
  id: string;
  matricule: string;
  type: "paye" | "maladie" | "maternite" | "sans_solde";
  dateDebut: string;
  dateFin: string;
  jours: number;
  statut: "demande" | "valide" | "refuse";
  motif: string;
}

export function useConges(userId: string | undefined) {
  const [conges, setConges] = useState<Conge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("conges").select("*").eq("user_id", userId).order("date_debut", { ascending: false });
    if (error) { handleError("Chargement congés", error); setLoading(false); return; }
    setConges((data || []).map((r) => ({
      id: r.id,
      matricule: r.matricule,
      type: (r.type as Conge["type"]) || "paye",
      dateDebut: r.date_debut,
      dateFin: r.date_fin,
      jours: Number(r.jours) || 0,
      statut: (r.statut as Conge["statut"]) || "demande",
      motif: r.motif || "",
    })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const save = useCallback(async (c: Omit<Conge, "id"> & { id?: string }) => {
    if (!userId) return;
    const row = {
      user_id: userId,
      matricule: c.matricule,
      type: c.type,
      date_debut: c.dateDebut,
      date_fin: c.dateFin,
      jours: c.jours,
      statut: c.statut,
      motif: c.motif,
    };
    const { error } = c.id
      ? await supabase.from("conges").update(row).eq("id", c.id)
      : await supabase.from("conges").insert(row);
    if (error) { handleError("Sauvegarde congé", error); return; }
    await fetchAll();
  }, [userId, fetchAll]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("conges").delete().eq("id", id);
    if (error) { handleError("Suppression congé", error); return; }
    await fetchAll();
  }, [fetchAll]);

  return { conges, loading, save, remove, refetch: fetchAll };
}

// ══════════════════════════════════════════════════════════════
// Contrats
// ══════════════════════════════════════════════════════════════
export interface Contrat {
  id: string;
  matricule: string;
  type: "CDI" | "CDD" | "Stage";
  dateDebut: string;
  dateFin: string | null;
  periodeEssaiMois: number;
  lieuTravail: string;
  remuneration: number;
  clausesParticulieres: string;
}

export function useContrats(userId: string | undefined) {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("contrats").select("*").eq("user_id", userId).order("date_debut", { ascending: false });
    if (error) { handleError("Chargement contrats", error); setLoading(false); return; }
    setContrats((data || []).map((r) => ({
      id: r.id,
      matricule: r.matricule,
      type: (r.type as Contrat["type"]) || "CDI",
      dateDebut: r.date_debut,
      dateFin: r.date_fin,
      periodeEssaiMois: r.periode_essai_mois ?? 3,
      lieuTravail: r.lieu_travail || "",
      remuneration: Number(r.remuneration) || 0,
      clausesParticulieres: r.clauses_particulieres || "",
    })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const save = useCallback(async (c: Omit<Contrat, "id"> & { id?: string }) => {
    if (!userId) return;
    const row = {
      user_id: userId,
      matricule: c.matricule,
      type: c.type,
      date_debut: c.dateDebut,
      date_fin: c.dateFin,
      periode_essai_mois: c.periodeEssaiMois,
      lieu_travail: c.lieuTravail,
      remuneration: c.remuneration,
      clauses_particulieres: c.clausesParticulieres,
    };
    const { error } = c.id
      ? await supabase.from("contrats").update(row).eq("id", c.id)
      : await supabase.from("contrats").insert(row);
    if (error) { handleError("Sauvegarde contrat", error); return; }
    await fetchAll();
  }, [userId, fetchAll]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("contrats").delete().eq("id", id);
    if (error) { handleError("Suppression contrat", error); return; }
    await fetchAll();
  }, [fetchAll]);

  return { contrats, loading, save, remove };
}

// ══════════════════════════════════════════════════════════════
// Roles
// ══════════════════════════════════════════════════════════════
export type AppRole = "admin" | "drh" | "comptable" | "manager";

export function useRoles(userId: string | undefined) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase.from("user_roles").select("role").eq("user_id", userId).then(({ data, error }) => {
      if (error) { handleError("Chargement rôles", error); setLoading(false); return; }
      setRoles((data || []).map((r) => r.role as AppRole));
      setLoading(false);
    });
  }, [userId]);

  const hasRole = (r: AppRole) => roles.includes(r);
  return { roles, hasRole, loading };
}

// ══════════════════════════════════════════════════════════════
// Attestations log
// ══════════════════════════════════════════════════════════════
export async function logAttestation(userId: string, matricule: string, type: string) {
  await supabase.from("attestations_log").insert({ user_id: userId, matricule, type });
}