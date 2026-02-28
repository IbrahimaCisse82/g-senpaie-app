import { useState, useMemo, useCallback } from "react";
import type { Employee, PayrollParams, PayrollResult, Convention, Entreprise } from "@/lib/payroll";
import { calculerPaie, fmt } from "@/lib/payroll";
import { DEFAULT_EMPLOYEES, DEFAULT_PARAMS, DEFAULT_CONVENTIONS, DEFAULT_ENTREPRISE, NAV_ITEMS, type TabId } from "@/lib/constants";
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
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);
  const [params, setParams] = useState<PayrollParams>(DEFAULT_PARAMS);
  const [conventions, setConventions] = useState<Convention[]>(DEFAULT_CONVENTIONS);
  const [entreprise, setEntreprise] = useState<Entreprise>(DEFAULT_ENTREPRISE);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [showBulletin, setShowBulletin] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState<"new" | Employee | null>(null);
  const [showDel, setShowDel] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); }, []);

  const allPaies = useMemo(() => employees.map((e) => ({ ...e, paie: calculerPaie(e, params) })), [employees, params]);
  const filtered = useMemo(() => allPaies.filter((e) => `${e.prenom} ${e.nom} ${e.matricule} ${e.fonction}`.toLowerCase().includes(search.toLowerCase())), [allPaies, search]);
  const totaux = useMemo(() => ({
    brut: allPaies.reduce((s, e) => s + e.paie.brut, 0),
    net: allPaies.reduce((s, e) => s + e.paie.net, 0),
    ch: allPaies.reduce((s, e) => s + e.paie.chargesPat, 0),
    mass: allPaies.reduce((s, e) => s + e.paie.masse, 0),
  }), [allPaies]);

  const saveEmp = (emp: Employee) => {
    setEmployees((prev) => {
      const ex = prev.find((e) => e.matricule === emp.matricule);
      return ex ? prev.map((e) => e.matricule === emp.matricule ? emp : e) : [...prev, emp];
    });
    setShowForm(null);
    showToast("✅ Employé enregistré");
  };

  const delEmp = (mat: string) => {
    setEmployees((prev) => prev.filter((e) => e.matricule !== mat));
    setShowDel(null);
    showToast("🗑 Employé supprimé");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono text-[13px]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 bg-card border border-primary rounded-lg px-5 py-3 text-primary font-bold z-[9999] animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Sidebar */}
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
        <div className="px-5 py-3.5 border-t border-border">
          <div className="text-senpaie-dim text-[9px] text-center">G-SENPAIE · GROW HUB SARL · {employees.length} employé{employees.length > 1 ? "s" : ""}</div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[220px] p-7 min-h-screen">
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
        {tab === "entreprise" && <EntreprisePage entreprise={entreprise} onSave={(d) => { setEntreprise(d); showToast("✅ Entreprise enregistrée"); }} />}
        {tab === "parametres" && <Parametres params={params} onSave={(p) => { setParams(p); showToast("✅ Paramètres enregistrés"); }} onReset={() => { setParams(DEFAULT_PARAMS); showToast("↺ Paramètres réinitialisés"); }} />}
      </main>

      {/* Modals */}
      {showForm && (
        <Modal title={showForm === "new" ? "➕ Nouvel Employé" : `✏️ Modifier — ${(showForm as Employee).prenom} ${(showForm as Employee).nom}`} onClose={() => setShowForm(null)} width={740}>
          <EmployeeForm initial={showForm === "new" ? null : showForm as Employee} onSave={saveEmp} onClose={() => setShowForm(null)} existingMats={employees.map((e) => e.matricule)} conventions={conventions} />
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
            <button onClick={() => delEmp(showDel)} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none">Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Index;
