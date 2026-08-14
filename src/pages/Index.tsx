import { useState, useCallback, lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import type { Employee, PayrollResult, Convention } from "@/lib/payroll";
import { calculerPaie, fmt, MOIS } from "@/lib/payroll";
import { NAV_ITEMS, type TabId } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees, useEntreprise, usePayrollParams, useConventions, usePayrollHistory } from "@/hooks/useSupabaseData";
import { useEntrepriseCtx, ROLE_LABEL, type AppRole } from "@/hooks/useEntrepriseContext";
import { useConges, useContrats } from "@/hooks/useRH";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/useTheme";
import { Dashboard } from "@/components/senpaie/Dashboard";
import { EmployeeList, EmployeeForm } from "@/components/senpaie/EmployeeList";
const BulletinModal = lazy(() => import("@/components/senpaie/BulletinModal").then((m) => ({ default: m.BulletinModal })));
const Parametres = lazy(() => import("@/components/senpaie/Parametres").then((m) => ({ default: m.Parametres })));
const Simulateur = lazy(() => import("@/components/senpaie/Simulateur").then((m) => ({ default: m.Simulateur })));
const CotisationsTable = lazy(() => import("@/components/senpaie/CotisationsTable").then((m) => ({ default: m.CotisationsTable })));
const RapportCotisationsModal = lazy(() => import("@/components/senpaie/RapportCotisationsModal").then((m) => ({ default: m.RapportCotisationsModal })));
const TendancesPage = lazy(() => import("@/components/senpaie/TendancesPage").then((m) => ({ default: m.TendancesPage })));
const ConventionsPage = lazy(() => import("@/components/senpaie/ConventionsPage").then((m) => ({ default: m.ConventionsPage })));
const EntreprisePage = lazy(() => import("@/components/senpaie/EntreprisePage").then((m) => ({ default: m.EntreprisePage })));
const DeclarationsPage = lazy(() => import("@/components/senpaie/DeclarationsPage").then((m) => ({ default: m.DeclarationsPage })));
const CongesPage = lazy(() => import("@/components/senpaie/CongesPage").then((m) => ({ default: m.CongesPage })));
const SortiesPage = lazy(() => import("@/components/senpaie/SortiesPage").then((m) => ({ default: m.SortiesPage })));
const ContratsPage = lazy(() => import("@/components/senpaie/ContratsPage").then((m) => ({ default: m.ContratsPage })));
const EquipePage = lazy(() => import("@/components/senpaie/EquipePage").then((m) => ({ default: m.EquipePage })));
import { Modal } from "@/components/senpaie/Modal";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { employeeSchema, entrepriseSchema, formatZodError } from "@/lib/validation";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { entrepriseId, role, loading: entLoading } = useEntrepriseCtx();
  const { employees, saveEmployee, deleteEmployee, loading: empLoading } = useEmployees(user?.id, entrepriseId);
  const { entreprise, saveEntreprise, uploadLogo } = useEntreprise(user?.id, entrepriseId);
  const { params, saveParams, resetParams } = usePayrollParams(user?.id, entrepriseId);
  const { conventions, saveConvention, deleteConvention, saveCategory, deleteCategory } = useConventions(user?.id, entrepriseId);
  const { history, saveSnapshot, deleteSnapshot } = usePayrollHistory(user?.id, entrepriseId);
  const { conges } = useConges(user?.id, entrepriseId);
  const { contrats } = useContrats(user?.id, entrepriseId);
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();

  const [tab, setTab] = useState<TabId>("dashboard");
  const [showBulletin, setShowBulletin] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState<"new" | Employee | null>(null);
  const [showDel, setShowDel] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRapport, setShowRapport] = useState(false);
  const bulletinTemplateId = entreprise.bulletinTemplate || "classique";

  // Role-based nav gating
  // Matrice d'habilitations (CDC §1). « equipe » = Admin uniquement.
  const ALLOWED_TABS: Record<AppRole, TabId[]> = {
    admin: NAV_ITEMS.map((n) => n.id),
    drh: NAV_ITEMS.filter((n) => n.id !== "equipe").map((n) => n.id),
    comptable: ["dashboard", "employes", "cotisations", "declarations", "tendances"],
    manager: ["dashboard", "employes", "conges"],
  };
  const allowedTabs = role ? ALLOWED_TABS[role] : NAV_ITEMS.map((n) => n.id);
  const navItems = NAV_ITEMS.filter((n) => allowedTabs.includes(n.id));
  const activeTab: TabId = allowedTabs.includes(tab) ? tab : "dashboard";
  // Écriture employés : Admin & DRH uniquement (aligné sur les politiques RLS)
  const canWriteEmployees = role === "admin" || role === "drh";

  const handleTemplateChange = async (id: string) => {
    const updated = { ...entreprise, bulletinTemplate: id };
    await saveEntreprise(updated);
    showToast("✅ Modèle de bulletin mis à jour");
  };

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); }, []);

  if (authLoading || entLoading) return (
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
    const parsed = employeeSchema.safeParse(emp);
    if (!parsed.success) {
      showToast("⚠️ " + formatZodError(parsed.error).split("\n")[0]);
      return;
    }
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

  const handleImportEmps = async (emps: Employee[]) => {
    for (const emp of emps) {
      const parsed = employeeSchema.safeParse(emp);
      if (!parsed.success) continue;
      await saveEmployee(emp, true);
    }
    showToast(`✅ ${emps.length} employé(s) importé(s)`);
  };

  const handleSaveSnapshot = async () => {
    const now = new Date();
    await saveSnapshot(now.getMonth(), now.getFullYear(), totaux, allPaies.length);
    showToast("💾 Mois clôturé et sauvegardé");
  };

  const handleReopenMonth = async (mois: number, annee: number) => {
    await deleteSnapshot(mois, annee);
    showToast(`🔓 ${MOIS[mois]} ${annee} rouvert`);
  };

  const handleTabChange = (id: TabId) => {
    setTab(id);
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="text-primary text-[17px] font-black tracking-[3px]">G-SENPAIE</div>
        <div className="text-muted-foreground text-[10px] mt-1 tracking-wider">GESTION DE LA PAIE</div>
      </div>
      <nav className="flex-1 py-2.5 overflow-y-auto">
        {navItems.map((n) => (
          <button key={n.id} onClick={() => handleTabChange(n.id)}
            className={`w-full text-left px-5 py-3 border-none cursor-pointer text-xs flex items-center justify-between transition-all ${
              activeTab === n.id
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
        <button onClick={toggleTheme} className="w-full px-3 py-1.5 bg-secondary text-foreground rounded-lg text-[11px] font-bold cursor-pointer border border-border hover:bg-accent transition-colors flex items-center justify-center gap-2">
          {theme === "dark" ? "☀️ Mode clair" : "🌙 Mode sombre"}
        </button>
        <div className="text-muted-foreground text-[10px] truncate">{user.email}</div>
        {role && <div className="text-primary text-[10px] font-bold uppercase">{ROLE_LABEL[role]}</div>}
        <button onClick={signOut} className="w-full px-3 py-1.5 bg-transparent border border-destructive text-destructive rounded-lg text-[11px] font-bold cursor-pointer hover:bg-destructive/10 transition-colors">
          🚪 Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-mono text-[13px]">
      {toast && (
        <div className="fixed top-5 right-5 bg-card border border-primary rounded-lg px-5 py-3 text-primary font-bold z-[9999] animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Mobile header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-border flex items-center justify-between px-4 z-[100]">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground bg-transparent border-none cursor-pointer text-xl p-1">
            ☰
          </button>
          <div className="text-primary text-[15px] font-black tracking-[2px]">G-SENPAIE</div>
          <div className="w-8" />
        </header>
      )}

      {/* Mobile sidebar via Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[260px] p-0 bg-sidebar flex flex-col">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-sidebar border-r border-border flex flex-col z-[100]">
          {sidebarContent}
        </aside>
      )}

      <main className={`${isMobile ? "pt-14 px-3 pb-5" : "ml-[220px] p-7"} min-h-screen`}>
        {empLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-primary animate-pulse">Chargement des données…</div>
          </div>
        ) : (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-primary animate-pulse">Chargement du module…</div></div>}>
            {activeTab === "dashboard" && (
              <Dashboard
                allPaies={allPaies}
                totaux={totaux}
                history={history}
                conges={conges}
                contrats={contrats}
                onSaveSnapshot={handleSaveSnapshot}
                onReopenMonth={handleReopenMonth}
              />
            )}
            {activeTab === "employes" && (
              <EmployeeList employees={filtered} search={search} onSearchChange={setSearch}
                onAdd={() => setShowForm("new")} onEdit={(emp) => setShowForm(emp)}
                onDelete={(mat) => setShowDel(mat)} onBulletin={(emp) => setShowBulletin(emp)}
                canWrite={canWriteEmployees}
                onImport={canWriteEmployees ? handleImportEmps : undefined} />
            )}
            {activeTab === "cotisations" && <CotisationsTable allPaies={allPaies} totaux={totaux} onOpenRapport={() => setShowRapport(true)} />}
            {activeTab === "tendances" && <TendancesPage allPaies={allPaies} totaux={totaux} history={history} />}
            {activeTab === "simulateur" && <Simulateur params={params} />}
            {activeTab === "conges" && (
              <CongesPage
                userId={user.id}
                entrepriseId={entrepriseId}
                employees={employees}
                canWrite={role !== "comptable"}
                onApplyAbsences={canWriteEmployees ? async (emp) => { await saveEmployee(emp, false); } : undefined}
                showToast={showToast}
              />
            )}
            {activeTab === "contrats" && <ContratsPage userId={user.id} entrepriseId={entrepriseId} employees={employees} entreprise={entreprise} />}
            {activeTab === "declarations" && <DeclarationsPage employees={employees} params={params} entreprise={entreprise} history={history} />}
            {activeTab === "sorties" && <SortiesPage userId={user.id} entrepriseId={entrepriseId} employees={employees} params={params} entreprise={entreprise} />}
            {activeTab === "equipe" && <EquipePage userId={user.id} userEmail={user.email || ""} entrepriseId={entrepriseId} role={role} />}
            {activeTab === "conventions" && (
              <ConventionsPage
                conventions={conventions}
                onSaveConvention={saveConvention}
                onDeleteConvention={deleteConvention}
                onSaveCategory={saveCategory}
                onDeleteCategory={deleteCategory}
                showToast={showToast}
              />
            )}
            {activeTab === "entreprise" && (
              <EntreprisePage
                entreprise={entreprise}
                onSave={async (d) => {
                  const parsed = entrepriseSchema.safeParse(d);
                  if (!parsed.success) {
                    showToast("⚠️ " + formatZodError(parsed.error).split("\n")[0]);
                    return;
                  }
                  await saveEntreprise(d);
                  showToast("✅ Entreprise enregistrée");
                }}
                onUploadLogo={uploadLogo}
              />
            )}
            {activeTab === "parametres" && <Parametres params={params} onSave={async (p) => { await saveParams(p); showToast("✅ Paramètres enregistrés"); }} onReset={async () => { await resetParams(); showToast("↺ Paramètres réinitialisés"); }} bulletinTemplateId={bulletinTemplateId} onBulletinTemplateChange={handleTemplateChange} />}
          </Suspense>
        )}
      </main>

      {showForm && (
        <Modal title={showForm === "new" ? "➕ Nouvel Employé" : `✏️ Modifier — ${(showForm as Employee).prenom} ${(showForm as Employee).nom}`} onClose={() => setShowForm(null)} width={740}>
          <EmployeeForm initial={showForm === "new" ? null : showForm as Employee} onSave={handleSaveEmp} onClose={() => setShowForm(null)} existingMats={employees.map((e) => e.matricule)} conventions={conventions} />
        </Modal>
      )}
      <Suspense fallback={null}>
        {showBulletin && <BulletinModal emp={showBulletin} params={params} entreprise={entreprise} templateId={bulletinTemplateId} onClose={() => setShowBulletin(null)} />}
        {showRapport && <RapportCotisationsModal employees={employees} params={params} entreprise={entreprise} onClose={() => setShowRapport(false)} />}
      </Suspense>
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
