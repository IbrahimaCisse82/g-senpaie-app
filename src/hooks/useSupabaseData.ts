import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Employee, PayrollParams, Entreprise } from "@/lib/payroll";
import { DEFAULT_PARAMS, DEFAULT_ENTREPRISE } from "@/lib/constants";

// ── Helpers: convert between DB snake_case and app camelCase ──
function dbToEmployee(row: any): Employee {
  return {
    matricule: row.matricule,
    prenom: row.prenom,
    nom: row.nom,
    sexe: row.sexe,
    dateNaissance: row.date_naissance || "",
    lieuNaissance: row.lieu_naissance || "",
    nationalite: row.nationalite || "Sénégalaise",
    adresse: row.adresse || "",
    telephone: row.telephone || "",
    situationFamille: row.situation_famille || "Célibataire",
    femmes: row.femmes || 0,
    enfants: row.enfants || 0,
    fonction: row.fonction,
    convention: row.convention || "",
    categorie: row.categorie || "",
    statut: row.statut || "employés",
    contrat: row.contrat || "CDI",
    dateEntree: row.date_entree,
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
    const { data } = await supabase.from("employees").select("*").eq("user_id", userId);
    if (data) setEmployees(data.map(dbToEmployee));
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const saveEmployee = useCallback(async (emp: Employee, isNew: boolean) => {
    if (!userId) return;
    const row = employeeToDb(emp, userId);
    if (isNew) {
      await supabase.from("employees").insert(row);
    } else {
      await supabase.from("employees").update(row).eq("user_id", userId).eq("matricule", emp.matricule);
    }
    await fetchEmployees();
  }, [userId, fetchEmployees]);

  const deleteEmployee = useCallback(async (matricule: string) => {
    if (!userId) return;
    await supabase.from("employees").delete().eq("user_id", userId).eq("matricule", matricule);
    await fetchEmployees();
  }, [userId, fetchEmployees]);

  return { employees, loading, saveEmployee, deleteEmployee, refetch: fetchEmployees };
}

// ══════════════════════════════════════════════════════════════
// useEntreprise
// ══════════════════════════════════════════════════════════════
export function useEntreprise(userId: string | undefined) {
  const [entreprise, setEntreprise] = useState<Entreprise>(DEFAULT_ENTREPRISE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase.from("entreprises").select("*").eq("user_id", userId).maybeSingle().then(({ data }) => {
      if (data) {
        setEntreprise({ nom: data.nom, logo: data.logo || "", adresse: data.adresse || "", telephone: data.telephone || "", email: data.email || "", ninea: data.ninea || "", rccm: data.rccm || "" });
      }
      setLoading(false);
    });
  }, [userId]);

  const saveEntreprise = useCallback(async (ent: Entreprise) => {
    if (!userId) return;
    const row = { user_id: userId, ...ent };
    const { data: existing } = await supabase.from("entreprises").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await supabase.from("entreprises").update(ent).eq("user_id", userId);
    } else {
      await supabase.from("entreprises").insert(row);
    }
    setEntreprise(ent);
  }, [userId]);

  return { entreprise, loading, saveEntreprise };
}

// ══════════════════════════════════════════════════════════════
// usePayrollParams
// ══════════════════════════════════════════════════════════════
export function usePayrollParams(userId: string | undefined) {
  const [params, setParams] = useState<PayrollParams>(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase.from("payroll_params").select("*").eq("user_id", userId).maybeSingle().then(({ data }) => {
      if (data?.params) setParams(data.params as unknown as PayrollParams);
      setLoading(false);
    });
  }, [userId]);

  const saveParams = useCallback(async (p: PayrollParams) => {
    if (!userId) return;
    const { data: existing } = await supabase.from("payroll_params").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await supabase.from("payroll_params").update({ params: p as any }).eq("user_id", userId);
    } else {
      await supabase.from("payroll_params").insert({ user_id: userId, params: p as any });
    }
    setParams(p);
  }, [userId]);

  const resetParams = useCallback(async () => {
    if (!userId) return;
    await supabase.from("payroll_params").update({ params: DEFAULT_PARAMS as any }).eq("user_id", userId);
    setParams(DEFAULT_PARAMS);
  }, [userId]);

  return { params, loading, saveParams, resetParams };
}
