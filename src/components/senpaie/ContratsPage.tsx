import { useState } from "react";
import type { Employee, Entreprise } from "@/lib/payroll";
import { useContrats, type Contrat } from "@/hooks/useRH";
import { exportHtmlToPdf } from "@/lib/pdfExport";
import { fmt } from "@/lib/payroll";
import { Modal, Field, inputClass } from "./Modal";

interface Props {
  userId: string;
  employees: Employee[];
  entreprise: Entreprise;
}

export function ContratsPage({ userId, employees, entreprise }: Props) {
  const { contrats, save, remove } = useContrats(userId);
  const [showForm, setShowForm] = useState<Contrat | "new" | null>(null);

  const exportContratPdf = async (c: Contrat) => {
    const emp = employees.find((e) => e.matricule === c.matricule);
    if (!emp) return;
    const html = buildContratHtml(emp, c, entreprise);
    await exportHtmlToPdf(html, `contrat_${c.type}_${c.matricule}.pdf`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
        <div>
          <h1 className="text-foreground text-xl font-extrabold mb-1">Contrats de travail</h1>
          <div className="text-muted-foreground text-[11px]">CDI, CDD et stages — génération PDF conforme aux mentions légales du Sénégal</div>
        </div>
        <button onClick={() => setShowForm("new")} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px]">+ Nouveau contrat</button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead><tr className="bg-background text-muted-foreground">
            <th className="py-2 px-3 text-left border-b border-border">Employé</th>
            <th className="py-2 px-3 text-left border-b border-border">Type</th>
            <th className="py-2 px-3 text-left border-b border-border">Période</th>
            <th className="py-2 px-3 text-right border-b border-border">Rémunération</th>
            <th className="py-2 px-3 text-right border-b border-border">Actions</th>
          </tr></thead>
          <tbody>
            {contrats.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Aucun contrat enregistré</td></tr>
            ) : contrats.map((c) => {
              const emp = employees.find((e) => e.matricule === c.matricule);
              return (
                <tr key={c.id} className="border-b border-border">
                  <td className="py-1.5 px-3">{emp ? `${emp.nom} ${emp.prenom}` : c.matricule}</td>
                  <td className="py-1.5 px-3"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">{c.type}</span></td>
                  <td className="py-1.5 px-3">{c.dateDebut}{c.dateFin ? ` → ${c.dateFin}` : " · durée indéterminée"}</td>
                  <td className="py-1.5 px-3 text-right">{fmt(c.remuneration)} F</td>
                  <td className="py-1.5 px-3 text-right">
                    <button onClick={() => exportContratPdf(c)} className="text-destructive mx-1">⬇️ PDF</button>
                    <button onClick={() => setShowForm(c)} className="text-primary mx-1">✏️</button>
                    <button onClick={() => remove(c.id)} className="text-destructive mx-1">🗑</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ContratForm
          initial={showForm === "new" ? null : showForm}
          employees={employees}
          onClose={() => setShowForm(null)}
          onSave={async (c) => { await save(c); setShowForm(null); }}
        />
      )}
    </div>
  );
}

function ContratForm({ initial, employees, onClose, onSave }: {
  initial: Contrat | null;
  employees: Employee[];
  onClose: () => void;
  onSave: (c: Omit<Contrat, "id"> & { id?: string }) => Promise<void>;
}) {
  const [matricule, setMat] = useState(initial?.matricule || employees[0]?.matricule || "");
  const [type, setType] = useState<Contrat["type"]>(initial?.type || "CDI");
  const [dateDebut, setDD] = useState(initial?.dateDebut || "");
  const [dateFin, setDF] = useState(initial?.dateFin || "");
  const [periodeEssaiMois, setPE] = useState(initial?.periodeEssaiMois ?? 3);
  const [lieuTravail, setLT] = useState(initial?.lieuTravail || "Dakar");
  const [remuneration, setRem] = useState(initial?.remuneration || 0);
  const [clausesParticulieres, setCP] = useState(initial?.clausesParticulieres || "");

  return (
    <Modal title={initial ? "Modifier le contrat" : "Nouveau contrat"} onClose={onClose} width={620}>
      <Field label="Employé">
        <select value={matricule} onChange={(e) => setMat(e.target.value)} className={inputClass}>
          {employees.map((e) => <option key={e.matricule} value={e.matricule}>{e.nom} {e.prenom} ({e.matricule})</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as Contrat["type"])} className={inputClass}>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="Stage">Stage</option>
          </select>
        </Field>
        <Field label="Date début"><input type="date" value={dateDebut} onChange={(e) => setDD(e.target.value)} className={inputClass} /></Field>
        <Field label="Date fin (CDD)"><input type="date" value={dateFin || ""} onChange={(e) => setDF(e.target.value)} className={inputClass} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Période d'essai (mois)"><input type="number" min={0} max={12} value={periodeEssaiMois} onChange={(e) => setPE(+e.target.value)} className={inputClass} /></Field>
        <Field label="Rémunération brute (FCFA)"><input type="number" value={remuneration} onChange={(e) => setRem(+e.target.value)} className={inputClass} /></Field>
      </div>
      <Field label="Lieu de travail"><input value={lieuTravail} onChange={(e) => setLT(e.target.value)} className={inputClass} /></Field>
      <Field label="Clauses particulières"><textarea value={clausesParticulieres} onChange={(e) => setCP(e.target.value)} className={inputClass} rows={3} /></Field>
      <div className="flex gap-3 justify-end mt-3">
        <button onClick={onClose} className="px-4 py-2 border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px]">Annuler</button>
        <button onClick={() => onSave({ id: initial?.id, matricule, type, dateDebut, dateFin: dateFin || null, periodeEssaiMois, lieuTravail, remuneration, clausesParticulieres })}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-[13px]" disabled={!matricule || !dateDebut}>
          💾 Enregistrer
        </button>
      </div>
    </Modal>
  );
}

function buildContratHtml(emp: Employee, c: Contrat, ent: Entreprise): string {
  const today = new Date().toLocaleDateString("fr-FR");
  const finText = c.type === "CDD" && c.dateFin ? `jusqu'au <b>${c.dateFin}</b>` : "à durée indéterminée";
  return `<div class="page" style="font-family:Georgia,serif;padding:40px 50px;color:#111;background:#fff;width:694px;">
    <h1 style="text-align:center;text-decoration:underline;font-size:18px;letter-spacing:2px;margin:0 0 8px;">CONTRAT DE TRAVAIL — ${c.type}</h1>
    <div style="text-align:center;font-size:10px;color:#666;margin-bottom:25px;">Régi par le Code du Travail de la République du Sénégal (loi n°97-17) et la Convention collective applicable</div>

    <div style="font-size:12px;margin-bottom:18px;">
      <b>ENTRE LES SOUSSIGNÉS :</b><br/><br/>
      <b>${ent.nom || "—"}</b>${ent.ninea ? ", NINEA " + ent.ninea : ""}${ent.rccm ? ", RCCM " + ent.rccm : ""}, dont le siège social est situé à ${ent.adresse || "—"},<br/>
      Représentée par son représentant légal, ci-après dénommée <b>« L'EMPLOYEUR »</b>,
      <br/><br/><b>D'UNE PART,</b><br/><br/>
      Et <b>${emp.prenom} ${emp.nom}</b>, né(e) le ${emp.dateNaissance || "—"} à ${emp.lieuNaissance || "—"}, de nationalité ${emp.nationalite || "—"}, demeurant ${emp.adresse || "—"},<br/>
      Ci-après dénommé(e) <b>« LE SALARIÉ »</b>,
      <br/><br/><b>D'AUTRE PART,</b><br/>
      <br/><b>IL A ÉTÉ CONVENU CE QUI SUIT :</b>
    </div>

    <div style="font-size:12px;line-height:1.7;">
      <p><b>Article 1 — Engagement</b><br/>L'Employeur engage le Salarié à compter du <b>${c.dateDebut}</b>, ${finText}, en qualité de <b>${emp.fonction}</b>.</p>
      <p><b>Article 2 — Période d'essai</b><br/>Le présent contrat est conclu avec une période d'essai de <b>${c.periodeEssaiMois} mois</b>, durant laquelle chacune des parties pourra rompre le contrat sans préavis ni indemnité.</p>
      <p><b>Article 3 — Lieu de travail</b><br/>Le Salarié exercera ses fonctions à <b>${c.lieuTravail}</b>.</p>
      <p><b>Article 4 — Rémunération</b><br/>Le Salarié percevra une rémunération brute mensuelle de <b>${fmt(c.remuneration)} FCFA</b>, payable mensuellement, à terme échu.</p>
      <p><b>Article 5 — Durée du travail</b><br/>La durée du travail est fixée conformément au Code du Travail (40h/semaine, soit 173,33h/mois).</p>
      <p><b>Article 6 — Congés payés</b><br/>Le Salarié bénéficiera de congés payés à raison de 2 jours ouvrables par mois de service effectif.</p>
      <p><b>Article 7 — Cotisations sociales</b><br/>Le Salarié sera affilié à l'IPRES et à la CSS, conformément à la réglementation en vigueur.</p>
      ${c.clausesParticulieres ? `<p><b>Article 8 — Clauses particulières</b><br/>${c.clausesParticulieres.replace(/\n/g, "<br/>")}</p>` : ""}
      <p><b>Article ${c.clausesParticulieres ? 9 : 8} — Convention collective applicable</b><br/>Le présent contrat est régi par la Convention collective <b>${emp.convention || "—"}</b>${emp.categorie ? `, catégorie ${emp.categorie}` : ""}.</p>
    </div>

    <div style="margin-top:50px;font-size:12px;">Fait en double exemplaire à ${ent.adresse || "Dakar"}, le ${today}.</div>
    <table style="width:100%;margin-top:50px;font-size:12px;"><tr>
      <td style="width:50%;"><b>L'EMPLOYEUR</b><br/><br/><br/><br/>Signature & cachet</td>
      <td style="width:50%;"><b>LE SALARIÉ</b><br/><br/><br/><br/>« Lu et approuvé »</td>
    </tr></table>
  </div>`;
}

export default ContratsPage;