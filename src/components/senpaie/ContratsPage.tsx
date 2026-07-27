import { useState } from "react";
import type { Employee, Entreprise } from "@/lib/payroll";
import { useContrats, type Contrat } from "@/hooks/useRH";
import { exportHtmlToPdf } from "@/lib/pdfExport";
import { fmt } from "@/lib/payroll";
import { Modal, Field, inputClass } from "./Modal";

interface Props {
  userId: string;
  entrepriseId: string | null;
  employees: Employee[];
  entreprise: Entreprise;
}

export function ContratsPage({ userId, entrepriseId, employees, entreprise }: Props) {
  const { contrats, save, remove } = useContrats(userId, entrepriseId);
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
  const dureeText = c.type === "CDD" && c.dateFin
    ? `déterminée, jusqu'au <b>${c.dateFin}</b>`
    : "indéterminée";
  const salaireBase = emp.salaireBase || 0;
  const sursalaire = emp.sursalaire || 0;
  const autres = Math.max(0, (c.remuneration || 0) - salaireBase - sursalaire);
  const total = c.remuneration || (salaireBase + sursalaire);
  const rep = (ent as Entreprise & { representant?: string; qualiteRepresentant?: string }).representant || "son représentant légal";
  const qualite = (ent as Entreprise & { qualiteRepresentant?: string }).qualiteRepresentant || "Directeur";

  return `<div class="page" style="font-family:'Times New Roman',Georgia,serif;padding:45px 55px;color:#000;background:#fff;width:694px;">
    <h1 style="text-align:center;font-size:16px;font-weight:bold;margin:0;">CONTRAT DE TRAVAIL</h1>
    <h2 style="text-align:center;font-size:14px;font-weight:bold;margin:4px 0 2px;">À DURÉE ${c.type === "CDD" ? "DÉTERMINÉE" : "INDÉTERMINÉE"}</h2>
    <div style="text-align:center;font-size:10px;font-style:italic;margin-bottom:22px;">(${c.type})</div>

    <div style="font-size:12px;line-height:1.6;">
      <p style="text-align:center;"><b>ENTRE LES SOUSSIGNÉS</b></p>
      <p>L'entreprise <b>${ent.nom || "................................."}</b>${ent.ninea ? `, NINEA ${ent.ninea}` : ""}${ent.rccm ? `, RCCM ${ent.rccm}` : ""}, dont le siège se trouve à <b>${ent.adresse || "................................."}</b>, représentée aux fins des présentes par M. <b>${rep}</b>, en sa qualité de <b>${qualite}</b>.</p>
      <p>Ci-après désigné « <b>L'Employeur</b> », <b>D'UNE PART,</b></p>
      <p style="text-align:center;"><b>ET</b></p>
      <p>
        Nom et prénoms du travailleur : <b>${emp.nom} ${emp.prenom}</b><br/>
        Date et lieu de naissance : <b>${emp.dateNaissance || "—"}${emp.lieuNaissance ? " à " + emp.lieuNaissance : ""}</b><br/>
        Nationalité : <b>${emp.nationalite || "—"}</b><br/>
        Situation de famille : <b>${emp.situationFamille || "—"}</b><br/>
        Adresse complète : <b>${emp.adresse || "—"}</b><br/>
        Profession : <b>${emp.fonction || "—"}</b><br/>
        Date de l'engagement : <b>${c.dateDebut}</b><br/>
        Classification professionnelle : <b>${emp.categorie || "—"}</b><br/>
        Convention collective : <b>${emp.convention || "—"}</b><br/>
        Durée de travail : <b>173,33 heures / mois (40h/semaine)</b>
      </p>
      <p>Ci-après dénommé(e) « <b>Le Travailleur</b> », <b>D'AUTRE PART,</b></p>
      <p><b>Il a été convenu et arrêté ce qui suit :</b></p>

      <p><b><u>Article 1</u> : OBJET DU CONTRAT</b><br/>
      Le présent contrat a pour objet de définir les droits et les obligations des contractants pendant la durée des fonctions que le travailleur exercera au service de l'entreprise au regard de la législation sociale sénégalaise (loi n° 97-17 du 1<sup>er</sup> décembre 1997 portant Code du travail), de la Convention collective et des règlements qui en découlent.</p>

      <p><b><u>Article 2</u> : DURÉE DU CONTRAT</b><br/>
      Le présent contrat est conclu pour une durée <b>${dureeText}</b>.<br/>
      Il prend effet à compter du <b>${c.dateDebut}</b>${c.periodeEssaiMois ? `, sous réserve d'une période d'essai de <b>${c.periodeEssaiMois} mois</b>` : ""}.</p>

      <p><b><u>Article 3</u> : DESCRIPTION DU POSTE ET LIEU D'EMPLOI</b><br/>
      Le travailleur <b>${emp.prenom} ${emp.nom}</b>, qui accepte, exercera les fonctions de <b>${emp.fonction}</b>. Celles-ci sont susceptibles d'évolution eu égard au développement du service et concerneront tous les aspects s'attachant directement ou indirectement aux spécifications du poste et correspondant aux capacités du travailleur. Le lieu d'emploi est <b>${c.lieuTravail}</b>.</p>

      <p><b><u>Article 4</u> : CONDITIONS DE SERVICE</b><br/>
      Pendant la durée de validité du présent contrat, <b>${emp.prenom} ${emp.nom}</b> s'engage à consacrer toute son activité professionnelle à son employeur, selon les directives qui lui seront données par écrit ou verbalement. Il respectera scrupuleusement les obligations relatives au secret professionnel. Le travailleur déclare n'être lié à aucun autre employeur et être libre de tout engagement pouvant porter préjudice à la bonne marche du service.</p>

      <p><b><u>Article 5</u> : RÉMUNÉRATION</b><br/>
      Le salaire brut mensuel est ainsi décomposé :</p>
      <ul style="margin:4px 0 4px 20px;">
        <li>Salaire de base : <b>${fmt(salaireBase)} FCFA</b></li>
        <li>Sursalaire : <b>${fmt(sursalaire)} FCFA</b></li>
        <li>Indemnité de transport : <b>26 000 FCFA</b></li>
        <li>Autres : <b>${fmt(autres)} FCFA</b></li>
      </ul>
      <p>Soit un total de <b>${fmt(total)} FCFA</b>, payable mensuellement à terme échu.</p>

      ${c.clausesParticulieres ? `<p><b><u>Article 6</u> : CLAUSES PARTICULIÈRES</b><br/>${c.clausesParticulieres.replace(/\n/g, "<br/>")}</p>` : ""}

      <p><b><u>Article ${c.clausesParticulieres ? 7 : 6}</u> : LITIGES – CONTESTATIONS</b><br/>
      Toutes contestations, tous litiges relatifs à l'interprétation ou à l'exécution du présent contrat doivent faire l'objet d'un règlement amiable. Au cas où un tel règlement ne peut être obtenu à propos du différend, compétence est donnée aux juridictions sociales de Dakar.</p>

      <p style="margin-top:20px;">Fait en <b>quatre (4) exemplaires</b> à Dakar, le <b>${today}</b>.</p>
    </div>

    <table style="width:100%;margin-top:40px;font-size:11px;text-align:center;">
      <tr>
        <td style="width:33%;"><b>Le Travailleur</b><br/><span style="font-size:10px;font-style:italic;">(Signature précédée de la mention manuscrite<br/>« Lu et approuvé »)</span><br/><br/><br/><br/>_________________</td>
        <td style="width:33%;"><b>L'Inspecteur du Travail</b><br/><br/><br/><br/><br/>_________________</td>
        <td style="width:33%;"><b>L'Employeur</b><br/><span style="font-size:10px;font-style:italic;">(Signature & cachet)</span><br/><br/><br/><br/>_________________</td>
      </tr>
    </table>
  </div>`;
}

export default ContratsPage;