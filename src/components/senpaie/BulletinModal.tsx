import { useState } from "react";
import html2pdf from "html2pdf.js";
import type { Employee, PayrollParams, PayrollResult, Entreprise } from "@/lib/payroll";
import { calculerPaie, getAnciennete, fmt, MOIS } from "@/lib/payroll";
import { Modal } from "./Modal";

interface BulletinModalProps {
  emp: Employee;
  params: PayrollParams;
  entreprise: Entreprise;
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

export function BulletinModal({ emp, params, entreprise, onClose }: BulletinModalProps) {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth());
  const [annee, setAnnee] = useState(now.getFullYear());

  const refDate = new Date(annee, mois + 1, 0);
  const p = calculerPaie(emp, params, refDate);
  const anc = getAnciennete(emp.dateEntree, refDate);
  const periodeLabel = `${MOIS[mois]} ${annee}`;
  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - i);

  const [generating, setGenerating] = useState(false);

  const downloadPDF = async () => {
    setGenerating(true);
    try {
      const html = genererBulletinHTML(emp, p, mois, annee, anc, entreprise);
      const container = document.createElement("div");
      container.innerHTML = html;
      // Extract just the .page content for clean PDF
      const page = container.querySelector(".page") || container;
      document.body.appendChild(container);
      container.style.position = "absolute";
      container.style.left = "-9999px";

      await html2pdf().set({
        margin: 0,
        filename: `bulletin_${emp.matricule}_${MOIS[mois]}_${annee}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(page).save();

      document.body.removeChild(container);
    } catch (e) {
      console.error("Erreur PDF:", e);
      alert("Erreur lors de la génération du PDF.");
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
        <button onClick={() => exportBulletinCSV(emp, p, mois, annee)} className="px-3 py-2 bg-transparent border border-primary text-primary rounded-lg font-bold text-[12px] cursor-pointer whitespace-nowrap">
          📥 CSV
        </button>
        <button onClick={openPDF} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[12px] cursor-pointer border-none whitespace-nowrap">
          ⬇️ PDF
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
          💡 <strong>PDF</strong> : un nouvel onglet s'ouvre, utilisez <strong>Ctrl+P</strong> → "Enregistrer en PDF". <strong>CSV</strong> : téléchargement direct pour Excel.
        </div>
      </div>
    </Modal>
  );
}

function genererBulletinHTML(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const fmtN = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
  const date_emission = new Date().toLocaleDateString("fr-FR");

  const row = (label: string, val: number, opts: any = {}) => {
    const { neg = false, bold = false, color = "#1f2937", bg = "transparent", indent = false } = opts;
    return `<tr style="background:${bg}">
      <td style="padding:5px 8px 5px ${indent ? '20px' : '8px'};font-size:11px;color:#374151;border-bottom:1px solid #e5e7eb;font-weight:${bold ? 700 : 400}">${label}</td>
      <td style="padding:5px 10px;text-align:right;font-size:11px;color:${color};border-bottom:1px solid #e5e7eb;font-weight:${bold ? 700 : 400}">${neg ? '– ' : ''}<b>${fmtN(val)} FCFA</b></td>
    </tr>`;
  };

  const section = (title: string, bgColor: string, rows: string) => `
    <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
      <thead><tr><th colspan="2" style="background:${bgColor};color:#fff;padding:6px 10px;text-align:left;font-size:9px;letter-spacing:1px;text-transform:uppercase">${title}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  const infoRows: [string, string][] = [
    ["Matricule", emp.matricule], ["Fonction", emp.fonction],
    ["Nom & Prénom", `${emp.prenom} ${emp.nom}`], ["Catégorie", emp.categorie || "—"],
    ["Convention", emp.convention || "—"], ["Contrat", emp.contrat],
    ["Date d'entrée", emp.dateEntree], ["Ancienneté", `${anc} an${anc > 1 ? "s" : ""}`],
    ["Situation fam.", emp.situationFamille], ["Enfants à charge", String(emp.enfants || 0)],
  ];

  const headerLogo = ent.logo
    ? `<img src="${ent.logo}" alt="logo" style="height:52px;max-width:130px;object-fit:contain;display:block"/>`
    : `<div style="width:52px;height:52px;background:rgba(255,255,255,0.1);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px">🏢</div>`;

  const headerLeft = `<div style="display:flex;align-items:center;gap:14px">${headerLogo}<div><div style="font-size:15px;font-weight:900;color:#fff;letter-spacing:1px;text-transform:uppercase">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#a7f3d0;margin-top:2px">NINEA : ${ent.ninea}</div>` : ""}</div></div>`;

  const footerItems = [
    ent.adresse && `<span>📍 ${ent.adresse}</span>`,
    ent.telephone && `<span>📞 ${ent.telephone}</span>`,
    ent.email && `<span>✉ ${ent.email}</span>`,
    ent.ninea && `<span>NINEA : ${ent.ninea}</span>`,
    ent.rccm && `<span>RCCM : ${ent.rccm}</span>`,
  ].filter(Boolean).join(`<span style="color:#d1d5db"> | </span>`);

  // Build HS rows
  const hsRows = [
    p.mtHS115 > 0 ? row(`HS 115% (${emp.hs115}h)`, p.mtHS115, { indent: true, bg: "#f9fafb" }) : "",
    p.mtHS140 > 0 ? row(`HS 140% (${emp.hs140}h)`, p.mtHS140, { indent: true }) : "",
    p.mtHS160 > 0 ? row(`HS 160% (${emp.hs160}h)`, p.mtHS160, { indent: true, bg: "#f9fafb" }) : "",
    p.mtHS200 > 0 ? row(`HS 200% (${emp.hs200}h)`, p.mtHS200, { indent: true }) : "",
  ].join("");

  const avancesRows = [
    p.avanceTabaski > 0 ? row("Avance Tabaski/Noël", p.avanceTabaski, { neg: true, indent: true, color: "#b45309" }) : "",
    p.avanceCaisse > 0 ? row("Avance caisse", p.avanceCaisse, { neg: true, indent: true, color: "#b45309" }) : "",
    p.avanceFinanciere > 0 ? row("Avance financière", p.avanceFinanciere, { neg: true, indent: true, color: "#b45309" }) : "",
    p.retCooperative > 0 ? row("Retenue coopérative", p.retCooperative, { neg: true, indent: true, color: "#b45309" }) : "",
    p.fraisMedicaux > 0 ? row("Frais médicaux", p.fraisMedicaux, { neg: true, indent: true, color: "#b45309" }) : "",
  ].filter(Boolean).join("");

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Bulletin – ${emp.prenom} ${emp.nom} – ${periode}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#1f2937;background:#fff}.page{width:210mm;min-height:297mm;margin:0 auto;padding:12mm 14mm;display:flex;flex-direction:column}.content{flex:1}.header{background:#064e3b;color:#fff;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-radius:6px}.bul-title{text-align:right}.bul-title h2{font-size:15px;font-weight:900;color:#fff;letter-spacing:1px}.bul-title .periode{font-size:11px;color:#a7f3d0;margin-top:3px}.bul-title .emis{font-size:9px;color:#6ee7b7;margin-top:2px}.emp-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:11px}.emp-cell{padding:5px 10px;font-size:10px;border-bottom:1px solid #e5e7eb}.emp-cell:nth-child(4n+1),.emp-cell:nth-child(4n+2){background:#f9fafb}.emp-label{color:#9ca3af;font-size:8px;text-transform:uppercase;letter-spacing:.5px;display:block}.emp-val{color:#1f2937;font-weight:700}.net-box{background:#ecfdf5;border:2px solid #10b981;border-radius:6px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin:10px 0}.net-label{font-size:14px;font-weight:800;color:#064e3b}.net-val{font-size:20px;font-weight:900;color:#10b981}.masse-box{background:#f5f3ff;border:1px solid #ddd6fe;border-radius:4px;padding:7px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:12px 0 8px}.sig{text-align:center}.sig-name{font-size:9px;color:#6b7280;margin-bottom:24px}.sig-line{border-top:1px solid #d1d5db;padding-top:5px;font-size:8px;color:#9ca3af}.footer{margin-top:auto;padding-top:10px;border-top:2px solid #10b981}.footer-coords{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 0;font-size:9px;color:#4b5563;padding:6px 0;text-align:center;line-height:1.8}.footer-doc{text-align:center;font-size:8px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:5px;margin-top:4px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:10mm 12mm}.no-print{display:none!important}}</style></head><body>
<div class="no-print" style="background:#1f2937;color:#fff;padding:10px 20px;text-align:center;font-family:Arial;font-size:13px;position:sticky;top:0;z-index:99;display:flex;align-items:center;justify-content:center;gap:16px">
  <span>📄 Bulletin prêt à imprimer</span>
  <button onclick="window.print()" style="background:#10b981;color:#fff;border:none;padding:8px 22px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer">🖨️ Enregistrer en PDF</button>
</div>
<div class="page"><div class="content">
  <div class="header">${headerLeft}<div class="bul-title"><h2>BULLETIN DE PAIE</h2><div class="periode">Période : <b>${periode}</b></div><div class="emis">Émis le : ${date_emission}</div></div></div>
  <div class="emp-grid">${infoRows.map(([l, v]) => `<div class="emp-cell"><span class="emp-label">${l}</span><span class="emp-val">${v}</span></div>`).join("")}</div>
  ${section("Éléments de Salaire", "#1d4ed8",
    row("Salaire de base", p.salaireBase, { bg: "#f9fafb" }) +
    (p.sursalaire > 0 ? row("Sursalaire", p.sursalaire) : "") +
    (p.primeAnc > 0 ? row(`Prime d'ancienneté (${anc}%)`, p.primeAnc, { indent: true, color: "#1d4ed8", bg: "#f9fafb" }) : "") +
    hsRows +
    (p.retAbsence > 0 ? row(`Retenue absences (${emp.heuresAbsence}h)`, p.retAbsence, { neg: true, color: "#dc2626" }) : "") +
    (p.indMaladie > 0 ? row("Indemnité maladie", p.indMaladie, { color: "#059669" }) : "") +
    row("SALAIRE BRUT", p.brut, { bold: true, color: "#1d4ed8" })
  )}
  ${section("Retenues Salariales", "#dc2626", row("Impôt sur le Revenu (IR)", p.ir, { neg: true, indent: true, color: "#dc2626", bg: "#f9fafb" }) + row("TRIMF", p.trimf, { neg: true, indent: true, color: "#dc2626" }) + row("IPRES R.G. part salarié (5,6%)", p.ipresRG_s, { neg: true, indent: true, color: "#dc2626", bg: "#f9fafb" }) + (p.ipresRC_s > 0 ? row("IPRES R.C.C. part salarié (2,4%)", p.ipresRC_s, { neg: true, indent: true, color: "#dc2626" }) : "") + (p.ipm_s > 0 ? row("IPM part salarié", p.ipm_s, { neg: true, indent: true, color: "#dc2626", bg: "#f9fafb" }) : "") + row("TOTAL RETENUES", p.totalRet, { neg: true, bold: true, color: "#dc2626" }))}
  ${p.totalAvances > 0 ? section("Avances & Retenues Diverses", "#b45309", avancesRows + row("TOTAL AVANCES", p.totalAvances, { neg: true, bold: true, color: "#b45309" })) : ""}
  ${section("Indemnités", "#059669",
    row("Indemnité de transport", p.transport, { color: "#065f46", bg: "#f0fdf4" }) +
    (p.primePanier > 0 ? row(`Prime de panier (${emp.nbPaniers}j)`, p.primePanier, { color: "#065f46" }) : "") +
    (p.indKilometrique > 0 ? row("Indemnité kilométrique", p.indKilometrique, { color: "#065f46", bg: "#f0fdf4" }) : "")
  )}
  <div class="net-box"><div><div class="net-label">NET À PAYER</div><div style="font-size:9px;color:#6b7280;margin-top:2px">Période : ${periode}</div></div><div class="net-val">${fmtN(p.net)} FCFA</div></div>
  ${section("Charges Patronales (informatif)", "#b45309", [["CFCE (3%)", p.cfce], ["IPRES R.G. patronal (8,4%)", p.ipresRG_p], p.ipresRC_p > 0 ? ["IPRES R.C.C. patronal (3,6%)", p.ipresRC_p] : null, ["CSS Alloc. Familiales (7%)", p.css_af], ["CSS Acc. Travail (1%)", p.css_at], p.ipm_p > 0 ? ["IPM patronal", p.ipm_p] : null].filter(Boolean).map(([l, v]: any, i: number) => row(l, v, { bg: i % 2 === 0 ? "#fffbeb" : "transparent", color: "#92400e" })).join("") + row("TOTAL CHARGES PATRONALES", p.chargesPat, { bold: true, color: "#92400e", bg: "#fffbeb" }))}
  <div class="masse-box"><span style="font-size:10px;font-weight:700;color:#5b21b6">MASSE SALARIALE TOTALE</span><span style="font-size:12px;font-weight:800;color:#5b21b6">${fmtN(p.masse)} FCFA</span></div>
  <div class="sigs">${["Employeur", "Service RH", "Employé(e)"].map(s => `<div class="sig"><div class="sig-name">${s}</div><div class="sig-line">Signature &amp; cachet</div></div>`).join("")}</div>
</div>
<div class="footer"><div class="footer-coords">${footerItems}</div><div class="footer-doc">Document généré par G-SENPAIE · ${periode} · Confidentiel</div></div>
</div></body></html>`;
}

export default BulletinModal;
