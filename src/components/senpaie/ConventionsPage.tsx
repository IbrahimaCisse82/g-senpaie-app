import { useState } from "react";
import type { Convention, ConventionCategory } from "@/lib/payroll";
import { fmt } from "@/lib/payroll";
import { Modal, Field, inputClass } from "./Modal";
import { STATUT_COLORS } from "@/lib/constants";

interface ConventionsPageProps {
  conventions: Convention[];
  onSaveConvention: (cc: Convention, isNew: boolean) => Promise<void>;
  onDeleteConvention: (id: string) => Promise<void>;
  onSaveCategory: (conventionId: string, cat: ConventionCategory, isNew: boolean) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  showToast: (msg: string) => void;
}

export function ConventionsPage({ conventions, onSaveConvention, onDeleteConvention, onSaveCategory, onDeleteCategory, showToast }: ConventionsPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(conventions[0]?.id || null);
  const [showCCForm, setShowCCForm] = useState<"new" | Convention | null>(null);
  const [showCatForm, setShowCatForm] = useState<"new" | ConventionCategory | null>(null);
  const [showDelCC, setShowDelCC] = useState<string | null>(null);
  const [showDelCat, setShowDelCat] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState("");

  const selectedCC = conventions.find((c) => c.id === selectedId);
  const filteredCats = selectedCC?.categories.filter((c) => `${c.code} ${c.libelle} ${c.statut}`.toLowerCase().includes(catSearch.toLowerCase())) || [];

  const [ccForm, setCcForm] = useState({ nom: "", secteur: "", dateSignature: "", description: "" });
  const [catForm, setCatForm] = useState({ code: "", libelle: "", statut: "employés", salaireMinima: 0 });

  const saveCC = async () => {
    if (showCCForm === "new") {
      await onSaveConvention({ id: "", ...ccForm, categories: [] }, true);
      showToast("✅ Convention ajoutée");
    } else if (showCCForm) {
      await onSaveConvention({ ...(showCCForm as Convention), ...ccForm }, false);
      showToast("✅ Convention modifiée");
    }
    setShowCCForm(null);
  };

  const saveCat = async () => {
    if (!selectedCC) return;
    if (showCatForm === "new") {
      await onSaveCategory(selectedCC.id, { id: "", ...catForm, salaireMinima: +catForm.salaireMinima }, true);
      showToast("✅ Catégorie ajoutée");
    } else if (showCatForm) {
      await onSaveCategory(selectedCC.id, { ...(showCatForm as ConventionCategory), ...catForm, salaireMinima: +catForm.salaireMinima }, false);
      showToast("✅ Catégorie modifiée");
    }
    setShowCatForm(null);
  };

  const deleteCC = async (id: string) => {
    await onDeleteConvention(id);
    if (selectedId === id) setSelectedId(conventions.find((c) => c.id !== id)?.id || null);
    setShowDelCC(null);
    showToast("🗑 Convention supprimée");
  };

  const deleteCat = async (id: string) => {
    await onDeleteCategory(id);
    setShowDelCat(null);
    showToast("🗑 Catégorie supprimée");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-foreground text-xl font-extrabold mb-1">Conventions Collectives</h1>
          <div className="text-muted-foreground text-[11px]">{conventions.length} convention{conventions.length > 1 ? "s" : ""} enregistrée{conventions.length > 1 ? "s" : ""}</div>
        </div>
        <button onClick={() => { setCcForm({ nom: "", secteur: "", dateSignature: "", description: "" }); setShowCCForm("new"); }}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none">
          + Nouvelle Convention
        </button>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-4">
        {/* Liste conventions */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-background">
            <div className="text-primary text-xs font-bold">📋 Conventions</div>
          </div>
          <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
            {conventions.map((cc) => (
              <div key={cc.id} onClick={() => setSelectedId(cc.id)}
                className={`px-4 py-3 cursor-pointer border-b border-border transition-colors ${selectedId === cc.id ? "bg-primary/10 border-l-[3px] border-l-primary" : "hover:bg-secondary"}`}>
                <div className="text-foreground font-bold text-xs">{cc.nom}</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">{cc.secteur} · {cc.categories.length} cat.</div>
              </div>
            ))}
          </div>
        </div>

        {/* Détail convention sélectionnée */}
        {selectedCC && (
          <div>
            <div className="bg-card rounded-lg p-5 border border-border mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-foreground font-extrabold text-base">{selectedCC.nom}</div>
                  <div className="text-muted-foreground text-[11px] mt-1">{selectedCC.secteur} · Signée le {selectedCC.dateSignature}</div>
                  {selectedCC.description && <div className="text-muted-foreground text-[11px] mt-1 italic">{selectedCC.description}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCcForm({ nom: selectedCC.nom, secteur: selectedCC.secteur, dateSignature: selectedCC.dateSignature, description: selectedCC.description }); setShowCCForm(selectedCC); }}
                    className="px-3 py-1.5 bg-transparent border border-senpaie-yellow text-senpaie-yellow rounded-lg text-[11px] font-bold cursor-pointer">✏️</button>
                  <button onClick={() => setShowDelCC(selectedCC.id)} className="px-3 py-1.5 bg-transparent border border-destructive text-destructive rounded-lg text-[11px] font-bold cursor-pointer">🗑</button>
                </div>
              </div>
            </div>

            {/* Catégories */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-background flex justify-between items-center">
                <div className="text-primary text-xs font-bold">📊 Grille des catégories — {selectedCC.nom}</div>
                <div className="flex gap-2 items-center">
                  <input placeholder="🔍 Rechercher…" value={catSearch} onChange={(e) => setCatSearch(e.target.value)}
                    className={`${inputClass} w-48 py-1.5 text-[11px]`} />
                  <button onClick={() => { setCatForm({ code: "", libelle: "", statut: "employés", salaireMinima: 0 }); setShowCatForm("new"); }}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[11px] font-bold cursor-pointer border-none">+ Catégorie</button>
                </div>
              </div>

              {filteredCats.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 text-xs">{catSearch ? "Aucun résultat" : "Aucune catégorie."}</div>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-background">
                      {["Code", "Libellé", "Statut", "Salaire Minima (FCFA)", "Actions"].map((h) => (
                        <th key={h} className={`py-2.5 px-4 text-muted-foreground font-semibold border-b border-border whitespace-nowrap ${h === "Salaire Minima (FCFA)" || h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCats.map((cat, i) => (
                      <tr key={cat.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-senpaie-alt-row"}`}>
                        <td className="py-3 px-4"><span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-bold text-[11px]">{cat.code}</span></td>
                        <td className="py-3 px-4 text-foreground font-semibold">{cat.libelle}</td>
                        <td className="py-3 px-4"><span className={`bg-${STATUT_COLORS[cat.statut] || "muted-foreground"}/20 text-${STATUT_COLORS[cat.statut] || "muted-foreground"} px-2 py-0.5 rounded text-[11px] font-semibold`}>{cat.statut}</span></td>
                        <td className="py-3 px-4 text-right text-senpaie-yellow font-bold">{fmt(cat.salaireMinima)} FCFA</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => { setCatForm({ code: cat.code, libelle: cat.libelle, statut: cat.statut, salaireMinima: cat.salaireMinima }); setShowCatForm(cat); }}
                              className="px-2 py-1 bg-transparent border border-senpaie-yellow text-senpaie-yellow rounded text-[11px] font-bold cursor-pointer">✏️</button>
                            <button onClick={() => setShowDelCat(cat.id)} className="px-2 py-1 bg-transparent border border-destructive text-destructive rounded text-[11px] font-bold cursor-pointer">🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Convention Form */}
      {showCCForm && (
        <Modal title={showCCForm === "new" ? "➕ Nouvelle Convention" : "✏️ Modifier la Convention"} onClose={() => setShowCCForm(null)} width={580}>
          <Field label="Nom *"><input value={ccForm.nom} onChange={(e) => setCcForm((f) => ({ ...f, nom: e.target.value }))} className={inputClass} placeholder="ex: Commerce, BTP…" /></Field>
          <Field label="Secteur"><input value={ccForm.secteur} onChange={(e) => setCcForm((f) => ({ ...f, secteur: e.target.value }))} className={inputClass} /></Field>
          <Field label="Date de signature"><input type="date" value={ccForm.dateSignature} onChange={(e) => setCcForm((f) => ({ ...f, dateSignature: e.target.value }))} className={inputClass} /></Field>
          <Field label="Description"><textarea value={ccForm.description} onChange={(e) => setCcForm((f) => ({ ...f, description: e.target.value }))} rows={3} className={`${inputClass} resize-y`} /></Field>
          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <button onClick={() => setShowCCForm(null)} className="px-4 py-2 bg-transparent border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px] cursor-pointer">Annuler</button>
            <button onClick={saveCC} disabled={!ccForm.nom.trim()} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none disabled:opacity-50">💾 Enregistrer</button>
          </div>
        </Modal>
      )}

      {/* Modal Catégorie Form */}
      {showCatForm && (
        <Modal title={showCatForm === "new" ? "➕ Nouvelle Catégorie" : "✏️ Modifier la Catégorie"} onClose={() => setShowCatForm(null)} width={500}>
          <div className="grid grid-cols-2 gap-x-5">
            <Field label="Code *"><input value={catForm.code} onChange={(e) => setCatForm((f) => ({ ...f, code: e.target.value }))} className={inputClass} /></Field>
            <Field label="Statut">
              <select value={catForm.statut} onChange={(e) => setCatForm((f) => ({ ...f, statut: e.target.value }))} className={inputClass}>
                {["employés", "agents de maîtrise", "cadres", "ouvriers"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Libellé *"><input value={catForm.libelle} onChange={(e) => setCatForm((f) => ({ ...f, libelle: e.target.value }))} className={inputClass} /></Field>
          <Field label="Salaire Minima (FCFA) *"><input type="number" min={0} step={500} value={catForm.salaireMinima} onChange={(e) => setCatForm((f) => ({ ...f, salaireMinima: +e.target.value }))} className={inputClass} /></Field>
          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <button onClick={() => setShowCatForm(null)} className="px-4 py-2 bg-transparent border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px] cursor-pointer">Annuler</button>
            <button onClick={saveCat} disabled={!catForm.code.trim() || !catForm.libelle.trim()} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none disabled:opacity-50">💾 Enregistrer</button>
          </div>
        </Modal>
      )}

      {/* Confirm delete convention */}
      {showDelCC && (
        <Modal title="⚠️ Supprimer la convention" onClose={() => setShowDelCC(null)} width={420}>
          <p className="text-foreground mb-5">Supprimer la convention <strong className="text-destructive">{conventions.find((c) => c.id === showDelCC)?.nom}</strong> ?</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowDelCC(null)} className="px-4 py-2 bg-transparent border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px] cursor-pointer">Annuler</button>
            <button onClick={() => deleteCC(showDelCC)} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none">Supprimer</button>
          </div>
        </Modal>
      )}

      {/* Confirm delete catégorie */}
      {showDelCat && (
        <Modal title="⚠️ Supprimer la catégorie" onClose={() => setShowDelCat(null)} width={420}>
          <p className="text-foreground mb-5">Supprimer cette catégorie ?</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowDelCat(null)} className="px-4 py-2 bg-transparent border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px] cursor-pointer">Annuler</button>
            <button onClick={() => deleteCat(showDelCat!)} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none">Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ConventionsPage;
