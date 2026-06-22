import { useState, useMemo } from "react";
import type { Employee } from "@/lib/payroll";
import { useConges, type Conge } from "@/hooks/useRH";
import { droitCongesAcquis, joursOuvrables } from "@/lib/legal";
import { Modal, Field, inputClass } from "./Modal";

interface Props {
  userId: string;
  employees: Employee[];
}

const TYPE_LABEL: Record<Conge["type"], string> = {
  paye: "Congé payé",
  maladie: "Arrêt maladie",
  maternite: "Congé maternité",
  sans_solde: "Sans solde",
};

const STATUT_LABEL: Record<Conge["statut"], string> = {
  demande: "🟡 En attente",
  valide: "✅ Validé",
  refuse: "❌ Refusé",
};

export function CongesPage({ userId, employees }: Props) {
  const { conges, save, remove, loading } = useConges(userId);
  const [showForm, setShowForm] = useState<Conge | "new" | null>(null);
  const [filterMat, setFilterMat] = useState("");

  const soldes = useMemo(() => {
    return employees.map((emp) => {
      const acquis = droitCongesAcquis(emp.dateEntree);
      const pris = conges
        .filter((c) => c.matricule === emp.matricule && c.type === "paye" && c.statut === "valide")
        .reduce((s, c) => s + c.jours, 0);
      return { emp, acquis, pris, solde: acquis - pris };
    });
  }, [employees, conges]);

  const displayedConges = filterMat ? conges.filter((c) => c.matricule === filterMat) : conges;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
        <div>
          <h1 className="text-foreground text-xl font-extrabold mb-1">Congés & absences</h1>
          <div className="text-muted-foreground text-[11px]">Suivi des congés payés (2 j/mois soit 24 j/an), arrêts maladie et absences</div>
        </div>
        <button onClick={() => setShowForm("new")} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px]">+ Nouvelle demande</button>
      </div>

      {/* Soldes */}
      <div className="bg-card border border-border rounded-lg mb-5 overflow-x-auto">
        <div className="px-4 py-3 border-b border-border text-primary text-[12px] font-bold">📊 Soldes de congés par employé</div>
        <table className="w-full text-[11px]">
          <thead><tr className="bg-background text-muted-foreground">
            <th className="py-2 px-3 text-left border-b border-border">Matricule</th>
            <th className="py-2 px-3 text-left border-b border-border">Employé</th>
            <th className="py-2 px-3 text-right border-b border-border">Acquis</th>
            <th className="py-2 px-3 text-right border-b border-border">Pris</th>
            <th className="py-2 px-3 text-right border-b border-border">Solde</th>
          </tr></thead>
          <tbody>
            {soldes.map((s) => (
              <tr key={s.emp.matricule} className="border-b border-border">
                <td className="py-1.5 px-3">{s.emp.matricule}</td>
                <td className="py-1.5 px-3">{s.emp.nom} {s.emp.prenom}</td>
                <td className="py-1.5 px-3 text-right">{s.acquis} j</td>
                <td className="py-1.5 px-3 text-right">{s.pris} j</td>
                <td className={`py-1.5 px-3 text-right font-bold ${s.solde < 0 ? "text-destructive" : "text-primary"}`}>{s.solde} j</td>
              </tr>
            ))}
            {soldes.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Aucun employé</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 mb-3">
        <select value={filterMat} onChange={(e) => setFilterMat(e.target.value)} className={`${inputClass} max-w-[260px]`}>
          <option value="">Tous les employés</option>
          {employees.map((e) => <option key={e.matricule} value={e.matricule}>{e.nom} {e.prenom}</option>)}
        </select>
      </div>

      {/* Liste */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead><tr className="bg-background text-muted-foreground">
            <th className="py-2 px-3 text-left border-b border-border">Employé</th>
            <th className="py-2 px-3 text-left border-b border-border">Type</th>
            <th className="py-2 px-3 text-left border-b border-border">Période</th>
            <th className="py-2 px-3 text-right border-b border-border">Jours</th>
            <th className="py-2 px-3 text-left border-b border-border">Statut</th>
            <th className="py-2 px-3 text-right border-b border-border">Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Chargement…</td></tr>
            ) : displayedConges.length === 0 ? (
              <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Aucune demande</td></tr>
            ) : displayedConges.map((c) => {
              const emp = employees.find((e) => e.matricule === c.matricule);
              return (
                <tr key={c.id} className="border-b border-border">
                  <td className="py-1.5 px-3">{emp ? `${emp.nom} ${emp.prenom}` : c.matricule}</td>
                  <td className="py-1.5 px-3">{TYPE_LABEL[c.type]}</td>
                  <td className="py-1.5 px-3">{c.dateDebut} → {c.dateFin}</td>
                  <td className="py-1.5 px-3 text-right">{c.jours}</td>
                  <td className="py-1.5 px-3">{STATUT_LABEL[c.statut]}</td>
                  <td className="py-1.5 px-3 text-right">
                    <button onClick={() => setShowForm(c)} className="text-primary mr-2">✏️</button>
                    <button onClick={() => remove(c.id)} className="text-destructive">🗑</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <CongeForm
          initial={showForm === "new" ? null : showForm}
          employees={employees}
          onClose={() => setShowForm(null)}
          onSave={async (c) => { await save(c); setShowForm(null); }}
        />
      )}
    </div>
  );
}

function CongeForm({ initial, employees, onClose, onSave }: {
  initial: Conge | null;
  employees: Employee[];
  onClose: () => void;
  onSave: (c: Omit<Conge, "id"> & { id?: string }) => Promise<void>;
}) {
  const [matricule, setMat] = useState(initial?.matricule || employees[0]?.matricule || "");
  const [type, setType] = useState<Conge["type"]>(initial?.type || "paye");
  const [dateDebut, setDD] = useState(initial?.dateDebut || "");
  const [dateFin, setDF] = useState(initial?.dateFin || "");
  const [statut, setStatut] = useState<Conge["statut"]>(initial?.statut || "demande");
  const [motif, setMotif] = useState(initial?.motif || "");

  const jours = dateDebut && dateFin ? joursOuvrables(dateDebut, dateFin) : 0;

  return (
    <Modal title={initial ? "Modifier le congé" : "Nouvelle demande de congé"} onClose={onClose} width={520}>
      <Field label="Employé">
        <select value={matricule} onChange={(e) => setMat(e.target.value)} className={inputClass}>
          {employees.map((e) => <option key={e.matricule} value={e.matricule}>{e.nom} {e.prenom} ({e.matricule})</option>)}
        </select>
      </Field>
      <Field label="Type">
        <select value={type} onChange={(e) => setType(e.target.value as Conge["type"])} className={inputClass}>
          <option value="paye">Congé payé</option>
          <option value="maladie">Arrêt maladie</option>
          <option value="maternite">Congé maternité</option>
          <option value="sans_solde">Sans solde</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date début"><input type="date" value={dateDebut} onChange={(e) => setDD(e.target.value)} className={inputClass} /></Field>
        <Field label="Date fin"><input type="date" value={dateFin} onChange={(e) => setDF(e.target.value)} className={inputClass} /></Field>
      </div>
      <Field label={`Durée (jours ouvrables) : ${jours}`}>
        <div className="text-muted-foreground text-[11px]">Calculée automatiquement, hors samedi/dimanche.</div>
      </Field>
      <Field label="Statut">
        <select value={statut} onChange={(e) => setStatut(e.target.value as Conge["statut"])} className={inputClass}>
          <option value="demande">En attente</option>
          <option value="valide">Validé</option>
          <option value="refuse">Refusé</option>
        </select>
      </Field>
      <Field label="Motif (optionnel)"><textarea value={motif} onChange={(e) => setMotif(e.target.value)} className={inputClass} rows={2} /></Field>
      <div className="flex gap-3 justify-end mt-3">
        <button onClick={onClose} className="px-4 py-2 border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px]">Annuler</button>
        <button onClick={() => onSave({ id: initial?.id, matricule, type, dateDebut, dateFin, jours, statut, motif })}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-[13px]" disabled={!matricule || !dateDebut || !dateFin}>
          💾 Enregistrer
        </button>
      </div>
    </Modal>
  );
}

export default CongesPage;