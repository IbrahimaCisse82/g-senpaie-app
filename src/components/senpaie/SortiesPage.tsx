import { useState, useMemo } from "react";
import type { Employee, PayrollParams, Entreprise } from "@/lib/payroll";
import { calculerPaie, fmt } from "@/lib/payroll";
import { calculerSTC } from "@/lib/legal";
import { useConges } from "@/hooks/useRH";
import { exportHtmlToPdf } from "@/lib/pdfExport";
import { Modal, Field, inputClass } from "./Modal";

interface Props {
  userId: string;
  employees: Employee[];
  params: PayrollParams;
  entreprise: Entreprise;
}

type AttestType = "travail" | "salaire" | "presence";

export function SortiesPage({ userId, employees, params, entreprise }: Props) {
  const { conges } = useConges(userId);
  const [showSTC, setShowSTC] = useState<Employee | null>(null);
  const [showAttest, setShowAttest] = useState<{ emp: Employee; type: AttestType } | null>(null);

  const sortieEmps = employees.filter((e) => e.dateSortie);
  const actifs = employees.filter((e) => !e.dateSortie);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-foreground text-xl font-extrabold mb-1">Sorties & Attestations</h1>
        <div className="text-muted-foreground text-[11px]">Solde de tout compte conforme art. L.61 + attestations (travail, salaire, présence)</div>
      </div>

      <div className="bg-card border border-border rounded-lg mb-5">
        <div className="px-4 py-3 border-b border-border text-primary text-[12px] font-bold">📤 Calcul d'un Solde de Tout Compte</div>
        <div className="p-4">
          <div className="text-muted-foreground text-[11px] mb-3">Sélectionnez un salarié pour générer son STC (préavis, indemnité de licenciement, congés non pris).</div>
          <div className="flex flex-wrap gap-2">
            {employees.map((e) => (
              <button key={e.matricule} onClick={() => setShowSTC(e)}
                className="px-3 py-1.5 bg-background border border-border rounded-lg text-[11px] hover:border-primary">
                {e.nom} {e.prenom}
              </button>
            ))}
            {employees.length === 0 && <div className="text-muted-foreground text-[11px]">Aucun employé.</div>}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg mb-5">
        <div className="px-4 py-3 border-b border-border text-primary text-[12px] font-bold">📄 Attestations (1 clic)</div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="text-muted-foreground">
              <th className="py-2 px-2 text-left border-b border-border">Employé</th>
              <th className="py-2 px-2 text-left border-b border-border">Statut</th>
              <th className="py-2 px-2 text-right border-b border-border">Attestations</th>
            </tr></thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.matricule} className="border-b border-border">
                  <td className="py-1.5 px-2">{e.nom} {e.prenom}</td>
                  <td className="py-1.5 px-2">{e.dateSortie ? <span className="text-destructive">Sorti(e) le {e.dateSortie}</span> : <span className="text-primary">Actif</span>}</td>
                  <td className="py-1.5 px-2 text-right">
                    <button onClick={() => setShowAttest({ emp: e, type: "travail" })} className="text-primary mx-1 text-[11px]">🏢 Travail</button>
                    <button onClick={() => setShowAttest({ emp: e, type: "salaire" })} className="text-primary mx-1 text-[11px]">💰 Salaire</button>
                    <button onClick={() => setShowAttest({ emp: e, type: "presence" })} className="text-primary mx-1 text-[11px]">📍 Présence</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border text-muted-foreground text-[12px] font-bold">📊 Récap : {actifs.length} actif(s) · {sortieEmps.length} sortie(s)</div>
      </div>

      {showSTC && (
        <STCModal
          emp={showSTC}
          params={params}
          entreprise={entreprise}
          joursCongesPris={conges.filter((c) => c.matricule === showSTC.matricule && c.type === "paye" && c.statut === "valide").reduce((s, c) => s + c.jours, 0)}
          onClose={() => setShowSTC(null)}
        />
      )}
      {showAttest && (
        <AttestationModal
          emp={showAttest.emp}
          type={showAttest.type}
          params={params}
          entreprise={entreprise}
          onClose={() => setShowAttest(null)}
        />
      )}
    </div>
  );
}

function STCModal({ emp, params, entreprise, joursCongesPris, onClose }: {
  emp: Employee; params: PayrollParams; entreprise: Entreprise; joursCongesPris: number; onClose: () => void;
}) {
  const [motif, setMotif] = useState<"licenciement" | "demission" | "retraite" | "fin_cdd">("licenciement");
  const [dateFin, setDateFin] = useState(emp.dateSortie || new Date().toISOString().slice(0, 10));
  const paie = useMemo(() => calculerPaie(emp, params, new Date(dateFin)), [emp, params, dateFin]);
  const stc = useMemo(() => calculerSTC(emp, paie, joursCongesPris, motif, dateFin), [emp, paie, joursCongesPris, motif, dateFin]);

  const exportPdf = async () => {
    const html = `<div class="page" style="font-family:Arial,sans-serif;padding:30px;color:#111;background:#fff;width:734px;">
      <h1 style="text-align:center;margin:0 0 5px;font-size:18px;">SOLDE DE TOUT COMPTE</h1>
      <div style="text-align:center;font-size:11px;color:#555;margin-bottom:25px;">Conformément aux dispositions du Code du Travail du Sénégal (art. L.61, L.143)</div>
      <div style="margin-bottom:18px;font-size:12px;">
        <b>Employeur :</b> ${entreprise.nom || "—"}${entreprise.ninea ? " · NINEA " + entreprise.ninea : ""}<br/>
        <b>Salarié :</b> ${emp.prenom} ${emp.nom} · Matricule ${emp.matricule}<br/>
        <b>Emploi :</b> ${emp.fonction} · <b>Statut :</b> ${emp.statut}<br/>
        <b>Date d'embauche :</b> ${emp.dateEntree} · <b>Date de sortie :</b> ${dateFin}<br/>
        <b>Motif :</b> ${motif} · <b>Ancienneté :</b> ${stc.anciennete} an(s)
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f0f0f0;"><th style="border:1px solid #999;padding:6px;text-align:left;">Élément</th><th style="border:1px solid #999;padding:6px;text-align:right;">Montant (FCFA)</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #999;padding:5px;">Salaire moyen mensuel</td><td style="border:1px solid #999;padding:5px;text-align:right;">${fmt(stc.salaireMoyenMensuel)}</td></tr>
          <tr><td style="border:1px solid #999;padding:5px;">Indemnité compensatrice de préavis (${stc.preavisMois} mois)</td><td style="border:1px solid #999;padding:5px;text-align:right;">${fmt(stc.indPreavis)}</td></tr>
          <tr><td style="border:1px solid #999;padding:5px;">Indemnité compensatrice de congés payés (${Math.max(0, stc.joursCongesAcquis - stc.joursCongesPris)} j)</td><td style="border:1px solid #999;padding:5px;text-align:right;">${fmt(stc.indCongesNonPris)}</td></tr>
          <tr><td style="border:1px solid #999;padding:5px;">Indemnité de licenciement</td><td style="border:1px solid #999;padding:5px;text-align:right;">${fmt(stc.indLicenciement)}</td></tr>
          <tr style="background:#e8f5e9;font-weight:bold;"><td style="border:1px solid #999;padding:6px;">TOTAL BRUT À VERSER</td><td style="border:1px solid #999;padding:6px;text-align:right;">${fmt(stc.totalBrut)}</td></tr>
        </tbody>
      </table>
      <div style="margin-top:30px;font-size:11px;">
        Le présent reçu est délivré pour solde de tout compte. Toute contestation devra intervenir dans les délais légaux.<br/><br/><br/>
        Fait à ${entreprise.adresse || "Dakar"}, le ${new Date().toLocaleDateString("fr-FR")}<br/><br/><br/>
        <table style="width:100%;"><tr><td style="width:50%;">Signature de l'employeur</td><td style="width:50%;">Signature du salarié<br/>(« Lu et approuvé, bon pour solde de tout compte »)</td></tr></table>
      </div>
    </div>`;
    await exportHtmlToPdf(html, `STC_${emp.matricule}.pdf`);
  };

  return (
    <Modal title={`Solde de tout compte — ${emp.prenom} ${emp.nom}`} onClose={onClose} width={620}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Motif de sortie">
          <select value={motif} onChange={(e) => setMotif(e.target.value as typeof motif)} className={inputClass}>
            <option value="licenciement">Licenciement</option>
            <option value="demission">Démission</option>
            <option value="retraite">Retraite</option>
            <option value="fin_cdd">Fin de CDD</option>
          </select>
        </Field>
        <Field label="Date de fin"><input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className={inputClass} /></Field>
      </div>
      <div className="bg-background border border-border rounded-lg p-4 mt-3 font-mono text-[12px] space-y-1.5">
        <Line l="Ancienneté" v={`${stc.anciennete} an(s)`} />
        <Line l="Salaire moyen mensuel" v={`${fmt(stc.salaireMoyenMensuel)} FCFA`} />
        <hr className="border-border my-2" />
        <Line l={`Préavis (${stc.preavisMois} mois)`} v={`${fmt(stc.indPreavis)} FCFA`} />
        <Line l={`Congés non pris (${Math.max(0, stc.joursCongesAcquis - stc.joursCongesPris)} j)`} v={`${fmt(stc.indCongesNonPris)} FCFA`} />
        <Line l="Indemnité de licenciement" v={`${fmt(stc.indLicenciement)} FCFA`} />
        <hr className="border-border my-2" />
        <div className="flex justify-between font-bold text-primary text-[14px]"><span>TOTAL BRUT</span><span>{fmt(stc.totalBrut)} FCFA</span></div>
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <button onClick={onClose} className="px-4 py-2 border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px]">Fermer</button>
        <button onClick={exportPdf} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[13px]">⬇️ Générer le PDF STC</button>
      </div>
    </Modal>
  );
}

function Line({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="text-foreground">{v}</span></div>;
}

function AttestationModal({ emp, type, params, entreprise, onClose }: {
  emp: Employee; type: AttestType; params: PayrollParams; entreprise: Entreprise; onClose: () => void;
}) {
  const paie = calculerPaie(emp, params);
  const today = new Date().toLocaleDateString("fr-FR");

  const titles: Record<AttestType, string> = {
    travail: "ATTESTATION DE TRAVAIL",
    salaire: "ATTESTATION DE SALAIRE",
    presence: "ATTESTATION DE PRÉSENCE",
  };

  const bodies: Record<AttestType, string> = {
    travail: `Je soussigné(e), responsable de la société <b>${entreprise.nom || "—"}</b>, atteste par la présente que <b>${emp.prenom} ${emp.nom}</b>, né(e) le ${emp.dateNaissance || "—"} à ${emp.lieuNaissance || "—"}, est employé(e) au sein de notre entreprise en qualité de <b>${emp.fonction}</b> depuis le <b>${emp.dateEntree}</b>${emp.dateSortie ? ` jusqu'au <b>${emp.dateSortie}</b>` : ""} sous contrat <b>${emp.contrat}</b>.<br/><br/>La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`,
    salaire: `Je soussigné(e), responsable de la société <b>${entreprise.nom || "—"}</b>, atteste par la présente que <b>${emp.prenom} ${emp.nom}</b>, matricule ${emp.matricule}, employé(e) en qualité de <b>${emp.fonction}</b> depuis le <b>${emp.dateEntree}</b>, perçoit un salaire brut mensuel de <b>${fmt(paie.brut)} FCFA</b> et un salaire net de <b>${fmt(paie.net)} FCFA</b>.<br/><br/>La présente attestation est délivrée pour servir et valoir ce que de droit.`,
    presence: `Je soussigné(e), responsable de la société <b>${entreprise.nom || "—"}</b>, atteste par la présente que <b>${emp.prenom} ${emp.nom}</b>, matricule ${emp.matricule}, est effectivement présent(e) au sein de notre entreprise à ce jour, en qualité de <b>${emp.fonction}</b> depuis le <b>${emp.dateEntree}</b>.<br/><br/>La présente attestation est délivrée pour servir et valoir ce que de droit.`,
  };

  const exportPdf = async () => {
    const html = `<div class="page" style="font-family:Georgia,serif;padding:50px 60px;color:#111;background:#fff;width:674px;min-height:1000px;">
      <div style="text-align:center;margin-bottom:40px;">
        <div style="font-size:14px;font-weight:bold;">${entreprise.nom || "—"}</div>
        <div style="font-size:10px;color:#666;">${entreprise.adresse || ""}${entreprise.telephone ? " · Tél : " + entreprise.telephone : ""}${entreprise.ninea ? " · NINEA " + entreprise.ninea : ""}</div>
      </div>
      <h1 style="text-align:center;text-decoration:underline;font-size:18px;letter-spacing:2px;margin:40px 0;">${titles[type]}</h1>
      <div style="font-size:13px;line-height:1.8;text-align:justify;margin-top:30px;">${bodies[type]}</div>
      <div style="margin-top:80px;font-size:12px;text-align:right;">
        Fait à ${entreprise.adresse || "Dakar"}, le ${today}<br/><br/><br/>
        Signature & cachet
      </div>
    </div>`;
    await exportHtmlToPdf(html, `attestation_${type}_${emp.matricule}.pdf`);
  };

  return (
    <Modal title={`${titles[type]} — ${emp.prenom} ${emp.nom}`} onClose={onClose} width={620}>
      <div className="bg-background border border-border rounded-lg p-5 text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: bodies[type] }} />
      <div className="flex gap-2 justify-end mt-4">
        <button onClick={onClose} className="px-4 py-2 border border-muted-foreground text-muted-foreground rounded-lg font-bold text-[13px]">Fermer</button>
        <button onClick={exportPdf} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[13px]">⬇️ Télécharger</button>
      </div>
    </Modal>
  );
}

export default SortiesPage;