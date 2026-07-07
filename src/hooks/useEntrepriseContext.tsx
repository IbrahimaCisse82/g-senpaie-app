import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "drh" | "comptable" | "manager";

interface Ctx {
  entrepriseId: string | null;
  role: AppRole | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const EntrepriseCtx = createContext<Ctx | null>(null);

export function EntrepriseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setEntrepriseId(null); setRole(null); setLoading(false); return; }
    setLoading(true);

    // 1. Look for a membership
    const { data: mem } = await supabase
      .from("entreprise_members" as never)
      .select("entreprise_id, role")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle() as { data: { entreprise_id: string; role: AppRole } | null };

    if (mem) {
      setEntrepriseId(mem.entreprise_id);
      setRole(mem.role);
      setLoading(false);
      return;
    }

    // 2. No membership → check if user owns an entreprise (created before migration/backfill)
    const { data: ent } = await supabase
      .from("entreprises").select("id").eq("user_id", user.id).maybeSingle();

    if (ent) {
      // Backfill missing membership
      await supabase.from("entreprise_members" as never).insert({
        entreprise_id: ent.id,
        user_id: user.id,
        role: "admin",
      } as never);
      setEntrepriseId(ent.id);
      setRole("admin");
      setLoading(false);
      return;
    }

    // 3. No entreprise yet → create one on the fly
    const { data: created } = await supabase
      .from("entreprises")
      .insert({ user_id: user.id, nom: "Mon entreprise" })
      .select("id").single();

    if (created) {
      await supabase.from("entreprise_members" as never).insert({
        entreprise_id: created.id,
        user_id: user.id,
        role: "admin",
      } as never);
      setEntrepriseId(created.id);
      setRole("admin");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <EntrepriseCtx.Provider value={{ entrepriseId, role, loading, refetch: load }}>
      {children}
    </EntrepriseCtx.Provider>
  );
}

export function useEntrepriseCtx() {
  const c = useContext(EntrepriseCtx);
  if (!c) throw new Error("useEntrepriseCtx must be used inside EntrepriseProvider");
  return c;
}

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  drh: "DRH",
  comptable: "Comptable",
  manager: "Manager",
};

export function canWrite(role: AppRole | null) {
  return role === "admin" || role === "drh";
}