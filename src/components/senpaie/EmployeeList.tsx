import { useState } from "react";
import type { Employee, PayrollResult, Convention } from "@/lib/payroll";
import { fmt, getAnciennete } from "@/lib/payroll";
import { Modal, Field, inputClass } from "./Modal";
import { EMPTY_EMPLOYEE } from "@/lib/constants";

interface EmployeeListProps {
  employees: (Employee & { paie: PayrollResult })[];
  search: string;
  onSearchChange: (s: string) => void;
  onAdd: () => void;
  onEdit: (emp: Employee) => void;
  onDelete: (matricule: string) => void;
  onBulletin: (emp: Employee) => void;
}

export function EmployeeList({ employees, search, onSearchChange, onAdd, onEdit, onDelete, onBulletin }: EmployeeListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-foreground text-xl font-extrabold mb-1">Gestion des Employés</h1>
          <div className="text-muted-foreground text-[11px]">{employees.length} employé{employees.length > 1 ? "s" : ""} enregistré{employees.length > 1 ? "s" : ""}</div>
        </div>
        <button onClick={onAdd} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none whitespace-nowrap">
          + Nouvel Employé
        </button>
      </div>

      <input
        placeholder="🔍  Rechercher par nom, matricule, fonction…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`${inputClass} max-w-full sm:max-w-[420px] mb-4`}
      />

      {employees.length === 0 && (
        <div className="text-center text-muted-foreground py-16 bg-card rounded-lg">
          {search ? "Aucun résultat" : "Aucun employé. Cliquez sur « + Nouvel Employé »."}
        </div>
      )}

      <div className="grid gap-2.5">
        {employees.map((emp) => (
          <div key={emp.matricule} className={`bg-card rounded-lg border overflow-hidden transition-colors ${expanded === emp.matricule ? "border-primary" : "border-border"}`}>
            <div
              className="px-4 md:px-5 py-3.5 flex flex-col sm:flex-row justify-between gap-3 cursor-pointer"
              onClick={() => setExpanded(expanded === emp.matricule ? null : emp.matricule)}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-base shrink-0 ${emp.sexe === "F" ? "bg-senpaie-purple/20" : "bg-senpaie-blue/20"}`}>
                  {emp.sexe === "F" ? "♀" : "♂"}
                </div>
                <div className="min-w-0">
                  <div className="text-foreground font-bold truncate">{emp.prenom} {emp.nom}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5 truncate">{emp.matricule} · {emp.fonction} · {emp.contrat}</div>
                </div>
              </div>
              <div className="flex gap-3 items-center justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-primary font-extrabold text-sm">{fmt(emp.paie.net)} F</div>
                  <div className="text-muted-foreground text-[10px]">Brut {fmt(emp.paie.brut)}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); onBulletin(emp); }} className="px-2.5 py-1.5 bg-senpaie-blue text-background rounded-lg text-[11px] font-bold cursor-pointer border-none">📄</button>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(emp); }} className="px-2.5 py-1.5 bg-transparent border border-senpaie-yellow text-senpaie-yellow rounded-lg text-[11px] font-bold cursor-pointer">✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(emp.matricule); }} className="px-2.5 py-1.5 bg-transparent border border-destructive text-destructive rounded-lg text-[11px] font-bold cursor-pointer">🗑</button>
                </div>
                <span className="text-muted-foreground hidden sm:inline">{expanded === emp.matricule ? "▲" : "▼"}</span>
              </div>
            </div>

            {expanded === emp.matricule && (
              <div className="px-4 md:px-5 pb-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3.5">
                  {([
                    ["Ancienneté", `${getAnciennete(emp.dateEntree)} ans`],
                    ["Salaire base", `${fmt(emp.salaireBase)} F`],
                    ["Sursalaire", `${fmt(emp.sursalaire)} F`],
                    ["Prime anc.", `${fmt(emp.paie.primeAnc)} F`],
                    ["IR", `${fmt(emp.paie.ir)} F`],
                    ["TRIMF", `${fmt(emp.paie.trimf)} F`],
                    ["IPRES RG sal.", `${fmt(emp.paie.ipresRG_s)} F`],
                    ["Charges pat.", `${fmt(emp.paie.chargesPat)} F`],
                  ] as [string, string][]).map(([l, v]) => (
                    <div key={l} className="bg-background rounded-lg p-2.5">
                      <div className="text-muted-foreground text-[10px]">{l}</div>
                      <div className="text-foreground text-[13px] font-semibold mt-1">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Employee Form ─────────────────────────────────────────────────────────────
interface EmpFormProps {
  initial: Employee | null;
  onSave: (emp: Employee) => void;
  onClose: () => void;
  existingMats: string[];
  conventions: Convention[];
}

export function EmployeeForm({ initial, onSave, onClose, existingMats, conventions }: EmpFormProps) {
  const [form, setForm] = useState<Employee>({ ...EMPTY_EMPLOYEE, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof Employee, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const selectedCC = conventions.find((c) => c.nom === form.convention);
  const availableCats = selectedCC ? selectedCC.categories : [];

  const handleCatChange = (catCode: string) => {
    set("categorie", catCode);
    const cat = availableCats.find((c) => c.code === catCode);
    if (cat) {
      set("statut", cat.statut);
      if (!form.salaireBase || form.salaireBase === 0) set("salaireBase", cat.salaireMinima);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.matricule.trim()) e.matricule = "Requis";
    if (!initial?.matricule && existingMats.includes(form.matricule.trim())) e.matricule = "Matricule déjà existant";
    if (!form.prenom.trim()) e.prenom = "Requis";
    if (!form.nom.trim()) e.nom = "Requis";
    if (!form.fonction.trim()) e.fonction = "Requis";
    if (!form.dateEntree) e.dateEntree = "Requis";
    if (!(form.salaireBase > 0)) e.salaireBase = "Doit être > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave({
      ...form, salaireBase: +form.salaireBase, sursalaire: +form.sursalaire,
      enfants: +form.enfants, femmes: +form.femmes,
      heuresAbsence: +(form.heuresAbsence || 0), heuresAbsMaladie: +(form.heuresAbsMaladie || 0),
      tauxMaladie: +(form.tauxMaladie || 0), nbPaniers: +(form.nbPaniers || 0),
      hs115: +(form.hs115 || 0), hs140: +(form.hs140 || 0), hs160: +(form.hs160 || 0), hs200: +(form.hs200 || 0),
      avanceTabaski: +(form.avanceTabaski || 0), avanceCaisse: +(form.avanceCaisse || 0),
      avanceFinanciere: +(form.avanceFinanciere || 0), retCooperative: +(form.retCooperative || 0),
      fraisMedicaux: +(form.fraisMedicaux || 0), indKilometrique: +(form.indKilometrique || 0),
    });
  };

  return (
    <div>
      {/* Infos personnelles */}
      <div className="mb-5">
        <div className="text-primary text-xs font-bold mb-3 pb-2 border-b border-border">🪪 Informations personnelles</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
          {([
            { label: "Matricule *", key: "matricule" as const, disabled: !!initial?.matricule },
            { label: "Prénom *", key: "prenom" as const },
            { label: "Nom *", key: "nom" as const },
            { label: "Lieu de naissance", key: "lieuNaissance" as const },
            { label: "Nationalité", key: "nationalite" as const },
            { label: "Téléphone", key: "telephone" as const },
            { label: "Adresse", key: "adresse" as const },
          ]).map((f) => (
            <Field key={f.key} label={f.label}>
              <input type="text" value={String(form[f.key])} onChange={(e) => set(f.key, e.target.value)} disabled={f.disabled}
                className={`${inputClass} ${f.disabled ? "opacity-50" : ""} ${errors[f.key] ? "border-destructive" : ""}`} />
              {errors[f.key] && <div className="text-destructive text-[11px] mt-1">⚠ {errors[f.key]}</div>}
            </Field>
          ))}
          <Field label="Sexe">
            <select value={form.sexe} onChange={(e) => set("sexe", e.target.value)} className={inputClass}>
              <option value="M">M</option><option value="F">F</option>
            </select>
          </Field>
          <Field label="Date de naissance">
            <input type="date" value={form.dateNaissance} onChange={(e) => set("dateNaissance", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>

      {/* Situation familiale */}
      <div className="mb-5">
        <div className="text-primary text-xs font-bold mb-3 pb-2 border-b border-border">👨‍👩‍👧 Situation familiale</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5">
          <Field label="Situation de famille">
            <select value={form.situationFamille} onChange={(e) => set("situationFamille", e.target.value)} className={inputClass}>
              {["Célibataire", "Marié(e)", "Veuf(ve)", "Divorcé(e)"].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Nombre de femmes">
            <input type="number" value={form.femmes} onChange={(e) => set("femmes", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Nombre d'enfants">
            <input type="number" value={form.enfants} onChange={(e) => set("enfants", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>

      {/* Infos professionnelles */}
      <div className="mb-5">
        <div className="text-primary text-xs font-bold mb-3 pb-2 border-b border-border">💼 Informations professionnelles</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
          <Field label="Fonction *">
            <input value={form.fonction} onChange={(e) => set("fonction", e.target.value)} className={`${inputClass} ${errors.fonction ? "border-destructive" : ""}`} />
            {errors.fonction && <div className="text-destructive text-[11px] mt-1">⚠ {errors.fonction}</div>}
          </Field>
          <Field label="Type de contrat">
            <select value={form.contrat} onChange={(e) => set("contrat", e.target.value)} className={inputClass}>
              {["CDI", "CDD", "Stage", "Prestation"].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Convention collective">
            <select value={form.convention} onChange={(e) => { set("convention", e.target.value); set("categorie", ""); }} className={inputClass}>
              <option value="">— Aucune —</option>
              {conventions.map((cc) => <option key={cc.id} value={cc.nom}>{cc.nom} · {cc.secteur}</option>)}
            </select>
          </Field>
          <Field label="Catégorie">
            {availableCats.length > 0 ? (
              <select value={form.categorie} onChange={(e) => handleCatChange(e.target.value)} className={inputClass}>
                <option value="">— Sélectionner —</option>
                {availableCats.map((cat) => <option key={cat.id} value={cat.code}>{cat.code} · {cat.libelle} (min. {fmt(cat.salaireMinima)} F)</option>)}
              </select>
            ) : (
              <input value={form.categorie} onChange={(e) => set("categorie", e.target.value)} placeholder="ex: 3_ème" className={inputClass} />
            )}
          </Field>
          <Field label="Statut">
            <select value={form.statut} onChange={(e) => set("statut", e.target.value)} className={inputClass}>
              {["employés", "agents de maîtrise", "cadres", "ouvriers"].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Date d'entrée *">
            <input type="date" value={form.dateEntree} onChange={(e) => set("dateEntree", e.target.value)} className={`${inputClass} ${errors.dateEntree ? "border-destructive" : ""}`} />
            {errors.dateEntree && <div className="text-destructive text-[11px] mt-1">⚠ {errors.dateEntree}</div>}
          </Field>
        </div>
      </div>

      {/* Rémunération */}
      <div className="mb-5">
        <div className="text-primary text-xs font-bold mb-3 pb-2 border-b border-border">💰 Rémunération</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
          <Field label="Salaire de base (FCFA) *">
            <input type="number" value={form.salaireBase} onChange={(e) => set("salaireBase", e.target.value)} className={`${inputClass} ${errors.salaireBase ? "border-destructive" : ""}`} />
            {errors.salaireBase && <div className="text-destructive text-[11px] mt-1">⚠ {errors.salaireBase}</div>}
          </Field>
          <Field label="Sursalaire (FCFA)">
            <input type="number" value={form.sursalaire} onChange={(e) => set("sursalaire", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>

      {/* Heures supplémentaires */}
      <div className="mb-5">
        <div className="text-primary text-xs font-bold mb-3 pb-2 border-b border-border">⏱️ Heures Supplémentaires</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5">
          <Field label="HS 115%">
            <input type="number" min="0" value={form.hs115 || ""} onChange={(e) => set("hs115", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="HS 140%">
            <input type="number" min="0" value={form.hs140 || ""} onChange={(e) => set("hs140", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="HS 160%">
            <input type="number" min="0" value={form.hs160 || ""} onChange={(e) => set("hs160", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="HS 200%">
            <input type="number" min="0" value={form.hs200 || ""} onChange={(e) => set("hs200", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
        </div>
      </div>

      {/* Absences & Maladie */}
      <div className="mb-5">
        <div className="text-primary text-xs font-bold mb-3 pb-2 border-b border-border">🏥 Absences & Maladie</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5">
          <Field label="Heures d'absence">
            <input type="number" min="0" value={form.heuresAbsence || ""} onChange={(e) => set("heuresAbsence", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="Heures abs. maladie">
            <input type="number" min="0" value={form.heuresAbsMaladie || ""} onChange={(e) => set("heuresAbsMaladie", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="Taux maladie (0 à 1)">
            <input type="number" min="0" max="1" step="0.01" value={form.tauxMaladie || ""} onChange={(e) => set("tauxMaladie", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
        </div>
      </div>

      {/* Indemnités supplémentaires */}
      <div className="mb-5">
        <div className="text-primary text-xs font-bold mb-3 pb-2 border-b border-border">🎫 Indemnités supplémentaires</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
          <Field label="Nombre de paniers">
            <input type="number" min="0" value={form.nbPaniers || ""} onChange={(e) => set("nbPaniers", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="Indemnité kilométrique (FCFA)">
            <input type="number" min="0" value={form.indKilometrique || ""} onChange={(e) => set("indKilometrique", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
        </div>
      </div>

      {/* Avances & Retenues */}
      <div className="mb-5">
        <div className="text-primary text-xs font-bold mb-3 pb-2 border-b border-border">💸 Avances & Retenues Diverses</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5">
          <Field label="Avance Tabaski/Noël">
            <input type="number" min="0" value={form.avanceTabaski || ""} onChange={(e) => set("avanceTabaski", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="Avance caisse">
            <input type="number" min="0" value={form.avanceCaisse || ""} onChange={(e) => set("avanceCaisse", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="Avance financière">
            <input type="number" min="0" value={form.avanceFinanciere || ""} onChange={(e) => set("avanceFinanciere", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="Retenue coopérative">
            <input type="number" min="0" value={form.retCooperative || ""} onChange={(e) => set("retCooperative", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
          <Field label="Frais médicaux">
            <input type="number" min="0" value={form.fraisMedicaux || ""} onChange={(e) => set("fraisMedicaux", e.target.value)} placeholder="0" className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-border">
        <button onClick={onClose} className="px-4 py-2 bg-transparent border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px] cursor-pointer">Annuler</button>
        <button onClick={handleSave} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none">💾 Enregistrer</button>
      </div>
    </div>
  );
}

export default EmployeeList;
