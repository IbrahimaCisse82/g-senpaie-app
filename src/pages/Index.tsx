import { useState, useMemo, useCallback } from "react";
import { Navigate } from "react-router-dom";
import type { Employee, PayrollParams, PayrollResult, Convention, Entreprise } from "@/lib/payroll";
import { calculerPaie, fmt } from "@/lib/payroll";
import { DEFAULT_CONVENTIONS, NAV_ITEMS, type TabId } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees, useEntreprise, usePayrollParams } from "@/hooks/useSupabaseData";
import { Dashboard } from "@/components/senpaie/Dashboard";
import { EmployeeList, EmployeeForm } from "@/components/senpaie/EmployeeList";
import { BulletinModal } from "@/components/senpaie/BulletinModal";
import { Parametres } from "@/components/senpaie/Parametres";
import { Simulateur } from "@/components/senpaie/Simulateur";
import { CotisationsTable } from "@/components/senpaie/CotisationsTable";
import { TendancesPage } from "@/components/senpaie/TendancesPage";
import { ConventionsPage } from "@/components/senpaie/ConventionsPage";
import { EntreprisePage } from "@/components/senpaie/EntreprisePage";
import { Modal } from "@/components/senpaie/Modal";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { employees, saveEmployee, deleteEmployee, loading: empLoading } = useEmployees(user?.id);
  const { entreprise, saveEntreprise } = useEntreprise(user?.id);
  const { params, saveParams, resetParams } = usePayrollParams(user?.id);

  const [conventions, setConventions] = useState<Convention[]>(DEFAULT_CONVENTIONS);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [showBulletin, setShowBulletin] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState<"new" | Employee | null>(null);
  const [showDel, setShowDel] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); }, []);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-primary text-lg font-bold animate-pulse font-mono">Chargement…</div>
    </div>
  );

  if (!user) return <Navigate to="/auth" replace />;

  const allPaies = employees.map((e) => ({ ...e, paie: calculerPaie(e, params) }));
  const filtered = allPaies.filter((e) => `${e.prenom} ${e.nom} ${e.matricule} ${e.fonction}`.toLowerCase().includes(search.toLowerCase()));
  const totaux = {
    brut: allPaies.reduce((s, e) => s + e.paie.brut, 0),
    net: allPaies.reduce((s, e) => s + e.paie.net, 0),
    ch: allPaies.reduce((s, e) => s + e.paie.chargesPat, 0),
    mass: allPaies.reduce((s, e) => s + e.paie.masse, 0),
  };

  const handleSaveEmp = async (emp: Employee) => {
    const isNew = !employees.some((e) => e.matricule === emp.matricule);
    await saveEmployee(emp, isNew);
    setShowForm(null);
    showToast("✅ Employé enregistré");
  };

  const handleDelEmp = async (mat: string) => {
    await deleteEmployee(mat);
    setShowDel(null);
    showToast("🗑 Employé supprimé");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono text-[13px]">
      {toast && (
        <div className="fixed top-5 right-5 bg-card border border-primary rounded-lg px-5 py-3 text-primary font-bold z-[9999] animate-in fade-in">
          {toast}
        </div>
      )}

      <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-sidebar border-r border-border flex flex-col z-[100]">
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="text-primary text-[17px] font-black tracking-[3px]">G-SENPAIE</div>
          <div className="text-muted-foreground text-[10px] mt-1 tracking-wider">GESTION DE LA PAIE</div>
        </div>
        <nav className="flex-1 py-2.5">
          {NAV_ITEMS.map((n) => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full text-left px-5 py-3 border-none cursor-pointer text-xs flex items-center justify-between transition-all ${
                tab === n.id
                  ? "bg-primary/10 text-primary border-l-[3px] border-l-primary"
                  : "text-muted-foreground border-l-[3px] border-l-transparent hover:bg-secondary"
              }`}>
              <span className="flex items-center gap-2.5"><span>{n.icon}</span>{n.label}</span>
              {n.id === "employes" && <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-black">{employees.length}</span>}
              {n.id === "conventions" && <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-black">{conventions.length}</span>}
            </button>
          ))}
        </nav>
        <div className="px-5 py-3.5 border-t border-border space-y-2">
          <div className="text-muted-foreground text-[10px] truncate">{user.email}</div>
          <button onClick={signOut} className="w-full px-3 py-1.5 bg-transparent border border-destructive text-destructive rounded-lg text-[11px] font-bold cursor-pointer hover:bg-destructive/10 transition-colors">
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      <main className="ml-[220px] p-7 min-h-screen">
        {empLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-primary animate-pulse">Chargement des données…</div>
          </div>
        ) : (
          <>
            {tab === "dashboard" && <Dashboard allPaies={allPaies} totaux={totaux} />}
            {tab === "employes" && (
              <EmployeeList employees={filtered} search={search} onSearchChange={setSearch}
                onAdd={() => setShowForm("new")} onEdit={(emp) => setShowForm(emp)}
                onDelete={(mat) => setShowDel(mat)} onBulletin={(emp) => setShowBulletin(emp)} />
            )}
            {tab === "cotisations" && <CotisationsTable allPaies={allPaies} totaux={totaux} />}
            {tab === "tendances" && <TendancesPage allPaies={allPaies} totaux={totaux} />}
            {tab === "simulateur" && <Simulateur params={params} />}
            {tab === "conventions" && <ConventionsPage conventions={conventions} setConventions={setConventions} showToast={showToast} />}
            {tab === "entreprise" && <EntreprisePage entreprise={entreprise} onSave={async (d) => { await saveEntreprise(d); showToast("✅ Entreprise enregistrée"); }} />}
            {tab === "parametres" && <Parametres params={params} onSave={async (p) => { await saveParams(p); showToast("✅ Paramètres enregistrés"); }} onReset={async () => { await resetParams(); showToast("↺ Paramètres réinitialisés"); }} />}
          </>
        )}
      </main>

      {showForm && (
        <Modal title={showForm === "new" ? "➕ Nouvel Employé" : `✏️ Modifier — ${(showForm as Employee).prenom} ${(showForm as Employee).nom}`} onClose={() => setShowForm(null)} width={740}>
          <EmployeeForm initial={showForm === "new" ? null : showForm as Employee} onSave={handleSaveEmp} onClose={() => setShowForm(null)} existingMats={employees.map((e) => e.matricule)} conventions={conventions} />
        </Modal>
      )}
      {showBulletin && <BulletinModal emp={showBulletin} params={params} entreprise={entreprise} onClose={() => setShowBulletin(null)} />}
      {showDel && (
        <Modal title="⚠️ Confirmation de suppression" onClose={() => setShowDel(null)} width={420}>
          <p className="text-foreground mb-5">
            Supprimer définitivement <strong className="text-destructive">{employees.find((e) => e.matricule === showDel)?.prenom} {employees.find((e) => e.matricule === showDel)?.nom}</strong> ?
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowDel(null)} className="px-4 py-2 bg-transparent border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px] cursor-pointer">Annuler</button>
            <button onClick={() => handleDelEmp(showDel)} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none">Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Index;
