import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Employee, PayrollParams, Entreprise, Convention, ConventionCategory } from "@/lib/payroll";
import { DEFAULT_PARAMS, DEFAULT_ENTREPRISE, DEFAULT_CONVENTIONS } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";

// ── Error handler ──
function handleError(context: string, error: any) {
  console.error(`[${context}]`, error);
  toast({
    title: "Erreur",
    description: `${context} : ${error?.message || "Erreur inconnue"}`,
    variant: "destructive",
  });
}

// ── Helpers: convert between DB snake_case and app camelCase ──
function dbToEmployee(row: Record<string, unknown>): Employee {
  return {
    matricule: row.matricule as string,
    prenom: row.prenom as string,
    nom: row.nom as string,
    sexe: (row.sexe as "M" | "F") || "M",
    dateNaissance: (row.date_naissance as string) || "",
    lieuNaissance: (row.lieu_naissance as string) || "",
    nationalite: (row.nationalite as string) || "Sénégalaise",
    adresse: (row.adresse as string) || "",
    telephone: (row.telephone as string) || "",
    situationFamille: (row.situation_famille as string) || "Célibataire",
    femmes: Number(row.femmes) || 0,
    enfants: Number(row.enfants) || 0,
    fonction: row.fonction as string,
    convention: (row.convention as string) || "",
    categorie: (row.categorie as string) || "",
    statut: (row.statut as string) || "employés",
    contrat: (row.contrat as string) || "CDI",
    dateEntree: row.date_entree as string,
    salaireBase: Number(row.salaire_base) || 0,
    sursalaire: Number(row.sursalaire) || 0,
    heuresAbsence: Number(row.heures_absence) || 0,
    heuresAbsMaladie: Number(row.heures_abs_maladie) || 0,
    tauxMaladie: Number(row.taux_maladie) || 0,
    nbPaniers: Number(row.nb_paniers) || 0,
    hs115: Number(row.hs115) || 0,
    hs140: Number(row.hs140) || 0,
    hs160: Number(row.hs160) || 0,
    hs200: Number(row.hs200) || 0,
    avanceTabaski: Number(row.avance_tabaski) || 0,
    avanceCaisse: Number(row.avance_caisse) || 0,
    avanceFinanciere: Number(row.avance_financiere) || 0,
    retCooperative: Number(row.ret_cooperative) || 0,
    fraisMedicaux: Number(row.frais_medicaux) || 0,
    indKilometrique: Number(row.ind_kilometrique) || 0,
  };
}

function employeeToDb(emp: Employee, userId: string) {
  return {
    user_id: userId,
    matricule: emp.matricule,
    prenom: emp.prenom,
    nom: emp.nom,
    sexe: emp.sexe,
    date_naissance: emp.dateNaissance,
    lieu_naissance: emp.lieuNaissance,
    nationalite: emp.nationalite,
    adresse: emp.adresse,
    telephone: emp.telephone,
    situation_famille: emp.situationFamille,
    femmes: emp.femmes,
    enfants: emp.enfants,
    fonction: emp.fonction,
    convention: emp.convention,
    categorie: emp.categorie,
    statut: emp.statut,
    contrat: emp.contrat,
    date_entree: emp.dateEntree,
    salaire_base: emp.salaireBase,
    sursalaire: emp.sursalaire,
    heures_absence: emp.heuresAbsence,
    heures_abs_maladie: emp.heuresAbsMaladie,
    taux_maladie: emp.tauxMaladie,
    nb_paniers: emp.nbPaniers,
    hs115: emp.hs115,
    hs140: emp.hs140,
    hs160: emp.hs160,
    hs200: emp.hs200,
    avance_tabaski: emp.avanceTabaski,
    avance_caisse: emp.avanceCaisse,
    avance_financiere: emp.avanceFinanciere,
    ret_cooperative: emp.retCooperative,
    frais_medicaux: emp.fraisMedicaux,
    ind_kilometrique: emp.indKilometrique,
  };
}

// ══════════════════════════════════════════════════════════════
// useEmployees
// ══════════════════════════════════════════════════════════════
export function useEmployees(userId: string | undefined) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.from("employees").select("*").eq("user_id", userId);
    if (error) { handleError("Chargement des employés", error); setLoading(false); return; }
    if (data) setEmployees(data.map(dbToEmployee));
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const saveEmployee = useCallback(async (emp: Employee, isNew: boolean) => {
    if (!userId) return;
    const row = employeeToDb(emp, userId);
    const { error } = isNew
      ? await supabase.from("employees").insert(row)
      : await supabase.from("employees").update(row).eq("user_id", userId).eq("matricule", emp.matricule);
    if (error) { handleError("Sauvegarde employé", error); return; }
    await fetchEmployees();
  }, [userId, fetchEmployees]);

  const deleteEmployee = useCallback(async (matricule: string) => {
    if (!userId) return;
    const { error } = await supabase.from("employees").delete().eq("user_id", userId).eq("matricule", matricule);
    if (error) { handleError("Suppression employé", error); return; }
    await fetchEmployees();
  }, [userId, fetchEmployees]);

  return { employees, loading, saveEmployee, deleteEmployee, refetch: fetchEmployees };
}

// ══════════════════════════════════════════════════════════════
// useEntreprise (with Storage for logo)
// ══════════════════════════════════════════════════════════════
export function useEntreprise(userId: string | undefined) {
  const [entreprise, setEntreprise] = useState<Entreprise>(DEFAULT_ENTREPRISE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase.from("entreprises").select("*").eq("user_id", userId).maybeSingle().then(({ data, error }) => {
      if (error) { handleError("Chargement entreprise", error); setLoading(false); return; }
      if (data) {
        setEntreprise({
          nom: data.nom, logo: data.logo || "", adresse: data.adresse || "",
          telephone: data.telephone || "", email: data.email || "",
          ninea: data.ninea || "", rccm: data.rccm || "",
        });
      }
      setLoading(false);
    });
  }, [userId]);

  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    if (!userId) return null;
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/logo.${ext}`;

    // Remove old logo
    await supabase.storage.from("logos").remove([path]);

    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) { handleError("Upload logo", error); return null; }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    return urlData.publicUrl + `?t=${Date.now()}`;
  }, [userId]);

  const saveEntreprise = useCallback(async (ent: Entreprise) => {
    if (!userId) return;
    const row = { user_id: userId, ...ent };
    const { data: existing, error: fetchErr } = await supabase.from("entreprises").select("id").eq("user_id", userId).maybeSingle();
    if (fetchErr) { handleError("Vérification entreprise", fetchErr); return; }

    const { error } = existing
      ? await supabase.from("entreprises").update(ent).eq("user_id", userId)
      : await supabase.from("entreprises").insert(row);
    if (error) { handleError("Sauvegarde entreprise", error); return; }
    setEntreprise(ent);
  }, [userId]);

  return { entreprise, loading, saveEntreprise, uploadLogo };
}

// ══════════════════════════════════════════════════════════════
// usePayrollParams
// ══════════════════════════════════════════════════════════════
export function usePayrollParams(userId: string | undefined) {
  const [params, setParams] = useState<PayrollParams>(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase.from("payroll_params").select("*").eq("user_id", userId).maybeSingle().then(({ data, error }) => {
      if (error) { handleError("Chargement paramètres", error); setLoading(false); return; }
      if (data?.params) setParams(data.params as unknown as PayrollParams);
      setLoading(false);
    });
  }, [userId]);

  const saveParams = useCallback(async (p: PayrollParams) => {
    if (!userId) return;
    const { data: existing, error: fetchErr } = await supabase.from("payroll_params").select("id").eq("user_id", userId).maybeSingle();
    if (fetchErr) { handleError("Vérification paramètres", fetchErr); return; }

    const { error } = existing
      ? await supabase.from("payroll_params").update({ params: p as unknown as Record<string, unknown> }).eq("user_id", userId)
      : await supabase.from("payroll_params").insert({ user_id: userId, params: p as unknown as Record<string, unknown> });
    if (error) { handleError("Sauvegarde paramètres", error); return; }
    setParams(p);
  }, [userId]);

  const resetParams = useCallback(async () => {
    if (!userId) return;
    const { error } = await supabase.from("payroll_params").update({ params: DEFAULT_PARAMS as unknown as Record<string, unknown> }).eq("user_id", userId);
    if (error) { handleError("Réinitialisation paramètres", error); return; }
    setParams(DEFAULT_PARAMS);
  }, [userId]);

  return { params, loading, saveParams, resetParams };
}

// ══════════════════════════════════════════════════════════════
// useConventions — persisted in database
// ══════════════════════════════════════════════════════════════
function dbToConvention(row: Record<string, unknown>, categories: ConventionCategory[]): Convention {
  return {
    id: row.id as string,
    nom: row.nom as string,
    secteur: (row.secteur as string) || "",
    dateSignature: (row.date_signature as string) || "",
    description: (row.description as string) || "",
    categories,
  };
}

function dbToCategory(row: Record<string, unknown>): ConventionCategory {
  return {
    id: row.id as string,
    code: row.code as string,
    libelle: row.libelle as string,
    statut: (row.statut as string) || "employés",
    salaireMinima: Number(row.salaire_minima) || 0,
  };
}

export function useConventions(userId: string | undefined) {
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchConventions = useCallback(async () => {
    if (!userId) return;
    const { data: convRows, error: convErr } = await supabase
      .from("conventions").select("*").eq("user_id", userId).order("nom");
    if (convErr) { handleError("Chargement conventions", convErr); setLoading(false); return; }

    const { data: catRows, error: catErr } = await supabase
      .from("convention_categories").select("*");
    if (catErr) { handleError("Chargement catégories", catErr); setLoading(false); return; }

    const catsMap = new Map<string, ConventionCategory[]>();
    (catRows || []).forEach((r) => {
      const convId = r.convention_id as string;
      if (!catsMap.has(convId)) catsMap.set(convId, []);
      catsMap.get(convId)!.push(dbToCategory(r as Record<string, unknown>));
    });

    const result = (convRows || []).map((r) =>
      dbToConvention(r as Record<string, unknown>, catsMap.get(r.id as string) || [])
    );

    setConventions(result);
    setLoading(false);
    setInitialized(true);
  }, [userId]);

  // Seed default conventions on first use
  const seedDefaults = useCallback(async () => {
    if (!userId) return;
    for (const cc of DEFAULT_CONVENTIONS) {
      const { data: inserted, error } = await supabase
        .from("conventions")
        .insert({ user_id: userId, nom: cc.nom, secteur: cc.secteur, date_signature: cc.dateSignature, description: cc.description })
        .select("id")
        .single();
      if (error || !inserted) continue;

      const catRows = cc.categories.map((cat) => ({
        convention_id: inserted.id,
        code: cat.code,
        libelle: cat.libelle,
        statut: cat.statut,
        salaire_minima: cat.salaireMinima,
      }));
      if (catRows.length > 0) {
        await supabase.from("convention_categories").insert(catRows);
      }
    }
    await fetchConventions();
  }, [userId, fetchConventions]);

  useEffect(() => { fetchConventions(); }, [fetchConventions]);

  // Seed defaults if user has no conventions
  useEffect(() => {
    if (initialized && conventions.length === 0 && userId) {
      seedDefaults();
    }
  }, [initialized, conventions.length, userId, seedDefaults]);

  const saveConvention = useCallback(async (cc: Convention, isNew: boolean) => {
    if (!userId) return;
    if (isNew) {
      const { data, error } = await supabase
        .from("conventions")
        .insert({ user_id: userId, nom: cc.nom, secteur: cc.secteur, date_signature: cc.dateSignature, description: cc.description })
        .select("id")
        .single();
      if (error || !data) { handleError("Sauvegarde convention", error); return; }
    } else {
      const { error } = await supabase
        .from("conventions")
        .update({ nom: cc.nom, secteur: cc.secteur, date_signature: cc.dateSignature, description: cc.description })
        .eq("id", cc.id);
      if (error) { handleError("Modification convention", error); return; }
    }
    await fetchConventions();
  }, [userId, fetchConventions]);

  const deleteConvention = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from("conventions").delete().eq("id", id);
    if (error) { handleError("Suppression convention", error); return; }
    await fetchConventions();
  }, [userId, fetchConventions]);

  const saveCategory = useCallback(async (conventionId: string, cat: ConventionCategory, isNew: boolean) => {
    if (!userId) return;
    if (isNew) {
      const { error } = await supabase.from("convention_categories").insert({
        convention_id: conventionId, code: cat.code, libelle: cat.libelle, statut: cat.statut, salaire_minima: cat.salaireMinima,
      });
      if (error) { handleError("Ajout catégorie", error); return; }
    } else {
      const { error } = await supabase.from("convention_categories").update({
        code: cat.code, libelle: cat.libelle, statut: cat.statut, salaire_minima: cat.salaireMinima,
      }).eq("id", cat.id);
      if (error) { handleError("Modification catégorie", error); return; }
    }
    await fetchConventions();
  }, [userId, fetchConventions]);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from("convention_categories").delete().eq("id", id);
    if (error) { handleError("Suppression catégorie", error); return; }
    await fetchConventions();
  }, [fetchConventions]);

  return { conventions, loading, saveConvention, deleteConvention, saveCategory, deleteCategory, refetch: fetchConventions };
}
