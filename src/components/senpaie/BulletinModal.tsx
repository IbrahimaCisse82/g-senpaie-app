import { useState } from "react";
import type { Employee, PayrollParams, PayrollResult, Entreprise } from "@/lib/payroll";
import { calculerPaie, getAnciennete, fmt, MOIS } from "@/lib/payroll";
import { getTemplate } from "@/lib/bulletinTemplates";
import { Modal } from "./Modal";

interface BulletinModalProps {
  emp: Employee;
  params: PayrollParams;
  entreprise: Entreprise;
  templateId?: string;
  onClose: () => void;
}

function exportBulletinCSV(emp: Employee, p: PayrollResult, mois: number, annee: number) {
  const rows = [
    ["Bulletin de Paie", `${MOIS[mois]} ${annee}`],
    ["Employé", `${emp.prenom} ${emp.nom}`],
    ["Matricule", emp.matricule],
    ["Fonction", emp.fonction],
    [],
    ["Élément", "Montant (FCFA)"],
    ["Salaire de base", Math.round(p.salaireBase)],
    ["Sursalaire", Math.round(p.sursalaire)],
    ["Prime ancienneté", Math.round(p.primeAnc)],
    ["Heures supplémentaires", Math.round(p.totalHS)],
    ["Retenue absences", -Math.round(p.retAbsence)],
    ["Indemnité maladie", Math.round(p.indMaladie)],
    ["SALAIRE BRUT", Math.round(p.brut)],
    [],
    ["IR", -Math.round(p.ir)],
    ["TRIMF", -Math.round(p.trimf)],
    ["IPRES RG salarié", -Math.round(p.ipresRG_s)],
    ["IPRES RC salarié", -Math.round(p.ipresRC_s)],
    ["IPM salarié", -Math.round(p.ipm_s)],
    ["Total retenues", -Math.round(p.totalRet)],
    [],
    ["Transport", Math.round(p.transport)],
    ["Prime panier", Math.round(p.primePanier)],
    ["Indemnité kilométrique", Math.round(p.indKilometrique)],
    ["Avances & retenues", -Math.round(p.totalAvances)],
    [],
    ["NET À PAYER", Math.round(p.net)],
    [],
    ["Charges patronales", Math.round(p.chargesPat)],
    ["Masse salariale", Math.round(p.masse)],
  ];

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bulletin_${emp.matricule}_${MOIS[mois]}_${annee}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BulletinModal({ emp, params, entreprise, templateId, onClose }: BulletinModalProps) {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth());
  const [annee, setAnnee] = useState(now.getFullYear());

  const refDate = new Date(annee, mois + 1, 0);
  const p = calculerPaie(emp, params, refDate);
  const anc = getAnciennete(emp.dateEntree, refDate);
  const periodeLabel = `${MOIS[mois]} ${annee}`;
  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - i);

  const [generating, setGenerating] = useState(false);

  const template = getTemplate(templateId || "classique");

  const downloadPDF = async () => {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const html = template.generate(emp, p, mois, annee, anc, entreprise);
      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.width = "794px";
      document.body.appendChild(container);

      const pageEl = container.querySelector(".page") as HTMLElement || container;

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
        windowWidth: 794,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);

      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `bulletin_${emp.matricule}_${MOIS[mois]}_${annee}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      console.error("Erreur PDF:", e);
      const html = template.generate(emp, p, mois, annee, anc, entreprise);
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); }
      else { alert("Erreur lors de la génération du PDF. Veuillez autoriser les popups."); }
    } finally {
      setGenerating(false);
    }
  };

  const Row = ({ l, v, c = "text-foreground", bold = false, neg = false }: { l: string; v: number; c?: string; bold?: boolean; neg?: boolean }) => (
    <div className="flex justify-between py-1 border-b border-border">
      <span className="text-muted-foreground text-xs">{l}</span>
      <span className={`text-xs ${c} ${bold ? "font-bold" : ""}`}>{neg ? "– " : ""}{fmt(v)} FCFA</span>
    </div>
  );

  return (
    <Modal title="📄 Bulletin de Paie" onClose={onClose} width={680}>
      {/* Période + Boutons */}
      <div className="flex gap-2 items-center mb-5 p-3.5 bg-background rounded-lg flex-wrap">
        <div className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Période :</div>
        <select value={mois} onChange={(e) => setMois(+e.target.value)} className="py-1.5 px-2.5 bg-background border border-border rounded-lg text-foreground text-[13px] font-mono outline-none">
          {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={annee} onChange={(e) => setAnnee(+e.target.value)} className="py-1.5 px-2.5 bg-background border border-border rounded-lg text-foreground text-[13px] font-mono outline-none w-24">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex-1" />
        <div className="flex items-center gap-1 mr-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: template.couleurPrimaire }} />
          <span className="text-muted-foreground text-[10px]">{template.nom}</span>
        </div>
        <button onClick={() => exportBulletinCSV(emp, p, mois, annee)} className="px-3 py-2 bg-transparent border border-primary text-primary rounded-lg font-bold text-[12px] cursor-pointer whitespace-nowrap">
          📥 CSV
        </button>
        <button onClick={downloadPDF} disabled={generating} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[12px] cursor-pointer border-none whitespace-nowrap disabled:opacity-50">
          {generating ? "⏳ Génération..." : "⬇️ PDF"}
        </button>
      </div>

      {/* Aperçu */}
      <div className="font-mono">
        <div className="bg-background rounded-lg p-3 mb-3.5 flex justify-between items-center border border-border">
          <div>
            <div className="text-primary text-[15px] font-black tracking-widest">G-SENPAIE</div>
            <div className="text-muted-foreground text-[9px] mt-0.5">BULLETIN DE PAIE</div>
          </div>
          <div className="text-right text-muted-foreground text-[11px]">
            <div>Période : <strong className="text-foreground">{periodeLabel}</strong></div>
            <div className="text-[10px] mt-0.5">Émis le : {now.toLocaleDateString("fr-FR")}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-3.5 bg-background rounded-lg p-3 border border-border">
          {([
            ["Matricule", emp.matricule], ["Fonction", emp.fonction],
            ["Employé", `${emp.prenom} ${emp.nom}`], ["Catégorie", emp.categorie || "—"],
            ["Convention", emp.convention || "—"], ["Contrat", emp.contrat],
            ["Date d'entrée", emp.dateEntree], ["Ancienneté", `${anc} an${anc > 1 ? "s" : ""}`],
          ] as [string, string][]).map(([l, v], i) => (
            <div key={i}>
              <span className="text-senpaie-dim text-[10px]">{l} : </span>
              <span className="text-foreground text-[11px] font-semibold">{v}</span>
            </div>
          ))}
        </div>

        {/* Éléments de salaire */}
        <div className="mb-2.5">
          <div className="text-senpaie-blue text-[10px] font-bold mb-1 uppercase tracking-wider">Éléments de salaire</div>
          <Row l="Salaire de base" v={p.salaireBase} />
          {p.sursalaire > 0 && <Row l="Sursalaire" v={p.sursalaire} />}
          {p.primeAnc > 0 && <Row l={`Prime ancienneté (${anc}%)`} v={p.primeAnc} c="text-senpaie-blue" />}
          {p.totalHS > 0 && (
            <>
              {p.mtHS115 > 0 && <Row l={`HS 115% (${emp.hs115}h)`} v={p.mtHS115} />}
              {p.mtHS140 > 0 && <Row l={`HS 140% (${emp.hs140}h)`} v={p.mtHS140} />}
              {p.mtHS160 > 0 && <Row l={`HS 160% (${emp.hs160}h)`} v={p.mtHS160} />}
              {p.mtHS200 > 0 && <Row l={`HS 200% (${emp.hs200}h)`} v={p.mtHS200} />}
            </>
          )}
          {p.retAbsence > 0 && <Row l={`Retenue absences (${emp.heuresAbsence}h)`} v={p.retAbsence} c="text-destructive" neg />}
          {p.indMaladie > 0 && <Row l="Indemnité maladie" v={p.indMaladie} />}
          <Row l="SALAIRE BRUT" v={p.brut} c="text-senpaie-blue" bold />
        </div>

        {/* Retenues */}
        <div className="mb-2.5">
          <div className="text-destructive text-[10px] font-bold mb-1 uppercase tracking-wider">Retenues salariales</div>
          <Row l="Impôt sur le Revenu (IR)" v={p.ir} c="text-destructive" neg />
          <Row l="TRIMF" v={p.trimf} c="text-destructive" neg />
          <Row l="IPRES R.G. salarié (5,6%)" v={p.ipresRG_s} c="text-destructive" neg />
          {p.ipresRC_s > 0 && <Row l="IPRES R.C.C. salarié (2,4%)" v={p.ipresRC_s} c="text-destructive" neg />}
          {p.ipm_s > 0 && <Row l="IPM salarié" v={p.ipm_s} c="text-destructive" neg />}
          <Row l="TOTAL RETENUES" v={p.totalRet} c="text-destructive" bold neg />
        </div>

        {/* Avances & Retenues Diverses */}
        {p.totalAvances > 0 && (
          <div className="mb-2.5">
            <div className="text-senpaie-yellow text-[10px] font-bold mb-1 uppercase tracking-wider">Avances & Retenues Diverses</div>
            {p.avanceTabaski > 0 && <Row l="Avance Tabaski/Noël" v={p.avanceTabaski} c="text-senpaie-yellow" neg />}
            {p.avanceCaisse > 0 && <Row l="Avance caisse" v={p.avanceCaisse} c="text-senpaie-yellow" neg />}
            {p.avanceFinanciere > 0 && <Row l="Avance financière" v={p.avanceFinanciere} c="text-senpaie-yellow" neg />}
            {p.retCooperative > 0 && <Row l="Retenue coopérative" v={p.retCooperative} c="text-senpaie-yellow" neg />}
            {p.fraisMedicaux > 0 && <Row l="Frais médicaux" v={p.fraisMedicaux} c="text-senpaie-yellow" neg />}
            <Row l="TOTAL AVANCES" v={p.totalAvances} c="text-senpaie-yellow" bold neg />
          </div>
        )}

        {/* Indemnités */}
        <div className="mb-3">
          <div className="text-primary text-[10px] font-bold mb-1 uppercase tracking-wider">Indemnités</div>
          <Row l="Indemnité de transport" v={p.transport} c="text-primary" />
          {p.primePanier > 0 && <Row l={`Prime de panier (${emp.nbPaniers}j)`} v={p.primePanier} c="text-primary" />}
          {p.indKilometrique > 0 && <Row l="Indemnité kilométrique" v={p.indKilometrique} c="text-primary" />}
        </div>

        {/* NET */}
        <div className="bg-primary/10 border border-primary rounded-lg px-4 py-3 flex justify-between items-center mb-3">
          <div>
            <div className="text-foreground font-bold text-sm">NET À PAYER</div>
            <div className="text-muted-foreground text-[10px] mt-0.5">Période : {periodeLabel}</div>
          </div>
          <div className="text-primary text-[22px] font-black">{fmt(p.net)} FCFA</div>
        </div>

        {/* Charges patronales */}
        <div className="bg-background rounded-lg p-3 border border-border">
          <div className="text-senpaie-yellow text-[10px] font-bold mb-2 uppercase">Charges patronales (informatif)</div>
          {([
            ["CFCE", p.cfce], ["IPRES R.G. patronal", p.ipresRG_p],
            ["IPRES R.C.C. patronal", p.ipresRC_p], ["CSS Alloc. Fam.", p.css_af],
            ["CSS Acc. Trav.", p.css_at], ["IPM patronal", p.ipm_p],
          ] as [string, number][]).filter(([, v]) => v > 0).map(([l, v]) => (
            <div key={l} className="flex justify-between text-muted-foreground text-[11px] py-0.5">
              <span>{l}</span><span>{fmt(v)} F</span>
            </div>
          ))}
          <div className="flex justify-between text-senpaie-yellow font-bold border-t border-border pt-1.5 mt-1 text-xs">
            <span>Total charges patronales</span><span>{fmt(p.chargesPat)} FCFA</span>
          </div>
          <div className="flex justify-between text-senpaie-purple font-bold mt-1 text-xs">
            <span>Masse salariale totale</span><span>{fmt(p.masse)} FCFA</span>
          </div>
        </div>

        <div className="mt-3.5 px-3.5 py-2.5 bg-senpaie-blue/10 rounded-lg border border-senpaie-blue text-senpaie-blue text-[11px]">
          💡 <strong>PDF</strong> : téléchargement avec le modèle « {template.nom} ». <strong>CSV</strong> : téléchargement direct pour Excel.
        </div>
      </div>
    </Modal>
  );
}

export default BulletinModal;
