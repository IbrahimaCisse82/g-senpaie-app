import type { Employee, PayrollResult, Entreprise } from "./payroll";
import { getAnciennete, fmt, MOIS } from "./payroll";

// ══════════════════════════════════════════════════════════════
//  Types
// ══════════════════════════════════════════════════════════════

export interface BulletinTemplate {
  id: string;
  nom: string;
  description: string;
  couleurPrimaire: string;
  generate: (emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise) => string;
}

// ══════════════════════════════════════════════════════════════
//  Shared Helpers
// ══════════════════════════════════════════════════════════════

const fmtN = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
const dateEmission = () => new Date().toLocaleDateString("fr-FR");

function headerLogo(ent: Entreprise, size = 52) {
  return ent.logo
    ? `<img src="${ent.logo}" alt="logo" style="height:${size}px;max-width:130px;object-fit:contain;display:block"/>`
    : `<div style="width:${size}px;height:${size}px;background:rgba(255,255,255,0.15);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px">🏢</div>`;
}

function footerHTML(ent: Entreprise, borderColor: string) {
  const items = [
    ent.adresse && `📍 ${ent.adresse}`,
    ent.telephone && `📞 ${ent.telephone}`,
    ent.email && `✉ ${ent.email}`,
    ent.ninea && `NINEA : ${ent.ninea}`,
    ent.rccm && `RCCM : ${ent.rccm}`,
  ].filter(Boolean).join(" | ");
  return `<div style="margin-top:auto;padding-top:10px;border-top:2px solid ${borderColor}">
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px 0;font-size:9px;color:#4b5563;padding:6px 0;text-align:center;line-height:1.8">${items}</div>
    <div style="text-align:center;font-size:8px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:5px;margin-top:4px">Document généré par G-SENPAIE · Confidentiel</div>
  </div>`;
}

function infoGrid(emp: Employee, anc: number) {
  return [
    ["Matricule", emp.matricule], ["Fonction", emp.fonction],
    ["Nom & Prénom", `${emp.prenom} ${emp.nom}`], ["Catégorie", emp.categorie || "—"],
    ["Convention", emp.convention || "—"], ["Contrat", emp.contrat],
    ["Date d'entrée", emp.dateEntree], ["Ancienneté", `${anc} an${anc > 1 ? "s" : ""}`],
    ["Situation fam.", emp.situationFamille], ["Enfants à charge", String(emp.enfants || 0)],
  ];
}

function signaturesHTML() {
  return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:12px 0 8px">
    ${["Employeur", "Service RH", "Employé(e)"].map(s => `<div style="text-align:center"><div style="font-size:9px;color:#6b7280;margin-bottom:24px">${s}</div><div style="border-top:1px solid #d1d5db;padding-top:5px;font-size:8px;color:#9ca3af">Signature & cachet</div></div>`).join("")}
  </div>`;
}

function buildSalaryRows(emp: Employee, p: PayrollResult, anc: number): string[][] {
  const rows: string[][] = [];
  rows.push(["Salaire de base", fmtN(p.salaireBase)]);
  if (p.sursalaire > 0) rows.push(["Sursalaire", fmtN(p.sursalaire)]);
  if (p.primeAnc > 0) rows.push([`Prime d'ancienneté (${anc}%)`, fmtN(p.primeAnc)]);
  if (p.mtHS115 > 0) rows.push([`HS 115% (${emp.hs115}h)`, fmtN(p.mtHS115)]);
  if (p.mtHS140 > 0) rows.push([`HS 140% (${emp.hs140}h)`, fmtN(p.mtHS140)]);
  if (p.mtHS160 > 0) rows.push([`HS 160% (${emp.hs160}h)`, fmtN(p.mtHS160)]);
  if (p.mtHS200 > 0) rows.push([`HS 200% (${emp.hs200}h)`, fmtN(p.mtHS200)]);
  if (p.retAbsence > 0) rows.push([`Retenue absences (${emp.heuresAbsence}h)`, `– ${fmtN(p.retAbsence)}`]);
  if (p.indMaladie > 0) rows.push(["Indemnité maladie", fmtN(p.indMaladie)]);
  return rows;
}

function buildRetRows(p: PayrollResult): string[][] {
  const rows: string[][] = [];
  rows.push(["Impôt sur le Revenu (IR)", `– ${fmtN(p.ir)}`]);
  rows.push(["TRIMF", `– ${fmtN(p.trimf)}`]);
  rows.push(["IPRES R.G. salarié (5,6%)", `– ${fmtN(p.ipresRG_s)}`]);
  if (p.ipresRC_s > 0) rows.push(["IPRES R.C.C. salarié (2,4%)", `– ${fmtN(p.ipresRC_s)}`]);
  if (p.ipm_s > 0) rows.push(["IPM salarié", `– ${fmtN(p.ipm_s)}`]);
  return rows;
}

function buildAvancesRows(p: PayrollResult): string[][] {
  const rows: string[][] = [];
  if (p.avanceTabaski > 0) rows.push(["Avance Tabaski/Noël", `– ${fmtN(p.avanceTabaski)}`]);
  if (p.avanceCaisse > 0) rows.push(["Avance caisse", `– ${fmtN(p.avanceCaisse)}`]);
  if (p.avanceFinanciere > 0) rows.push(["Avance financière", `– ${fmtN(p.avanceFinanciere)}`]);
  if (p.retCooperative > 0) rows.push(["Retenue coopérative", `– ${fmtN(p.retCooperative)}`]);
  if (p.fraisMedicaux > 0) rows.push(["Frais médicaux", `– ${fmtN(p.fraisMedicaux)}`]);
  return rows;
}

function buildIndemRows(emp: Employee, p: PayrollResult): string[][] {
  const rows: string[][] = [];
  rows.push(["Indemnité de transport", fmtN(p.transport)]);
  if (p.primePanier > 0) rows.push([`Prime de panier (${emp.nbPaniers}j)`, fmtN(p.primePanier)]);
  if (p.indKilometrique > 0) rows.push(["Indemnité kilométrique", fmtN(p.indKilometrique)]);
  return rows;
}

function buildChargesRows(p: PayrollResult): string[][] {
  const rows: string[][] = [];
  rows.push(["CFCE (3%)", fmtN(p.cfce)]);
  rows.push(["IPRES R.G. patronal (8,4%)", fmtN(p.ipresRG_p)]);
  if (p.ipresRC_p > 0) rows.push(["IPRES R.C.C. patronal (3,6%)", fmtN(p.ipresRC_p)]);
  rows.push(["CSS Alloc. Familiales (7%)", fmtN(p.css_af)]);
  rows.push(["CSS Acc. Travail (1%)", fmtN(p.css_at)]);
  if (p.ipm_p > 0) rows.push(["IPM patronal", fmtN(p.ipm_p)]);
  return rows;
}

function pageWrapper(css: string, body: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#1f2937;background:#fff}.page{width:210mm;min-height:297mm;margin:0 auto;padding:12mm 14mm;display:flex;flex-direction:column}.content{flex:1}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}${css}</style></head><body><div class="page"><div class="content">${body}</div></div></body></html>`;
}

function tableSection(title: string, bgColor: string, rows: string[][], opts: { negColor?: string; totalRow?: [string, string]; totalColor?: string } = {}) {
  const { negColor = "#dc2626", totalRow, totalColor = bgColor } = opts;
  let html = `<table style="width:100%;border-collapse:collapse;margin-bottom:10px">
    <thead><tr><th colspan="2" style="background:${bgColor};color:#fff;padding:6px 10px;text-align:left;font-size:9px;letter-spacing:1px;text-transform:uppercase">${title}</th></tr></thead><tbody>`;
  rows.forEach(([l, v], i) => {
    const isNeg = v.startsWith("–");
    html += `<tr style="background:${i % 2 === 0 ? '#f9fafb' : 'transparent'}"><td style="padding:5px 10px;font-size:11px;border-bottom:1px solid #e5e7eb">${l}</td><td style="padding:5px 10px;text-align:right;font-size:11px;color:${isNeg ? negColor : '#1f2937'};border-bottom:1px solid #e5e7eb;font-weight:500">${v} FCFA</td></tr>`;
  });
  if (totalRow) {
    html += `<tr style="background:#f3f4f6"><td style="padding:6px 10px;font-size:11px;font-weight:700;color:${totalColor}">${totalRow[0]}</td><td style="padding:6px 10px;text-align:right;font-size:12px;font-weight:800;color:${totalColor}">${totalRow[1]} FCFA</td></tr>`;
  }
  html += `</tbody></table>`;
  return html;
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE 1: Classique Émeraude (existing default)
// ══════════════════════════════════════════════════════════════

function t1_classique(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const info = infoGrid(emp, anc);
  const body = `
    <div style="background:#064e3b;color:#fff;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-radius:6px">
      <div style="display:flex;align-items:center;gap:14px">${headerLogo(ent)}<div><div style="font-size:15px;font-weight:900;letter-spacing:1px;text-transform:uppercase">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#a7f3d0;margin-top:2px">NINEA : ${ent.ninea}</div>` : ""}</div></div>
      <div style="text-align:right"><div style="font-size:15px;font-weight:900">BULLETIN DE PAIE</div><div style="font-size:11px;color:#a7f3d0;margin-top:3px">Période : <b>${periode}</b></div><div style="font-size:9px;color:#6ee7b7;margin-top:2px">Émis le : ${dateEmission()}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:11px">${info.map(([l, v], i) => `<div style="padding:5px 10px;font-size:10px;border-bottom:1px solid #e5e7eb;background:${i % 4 < 2 ? '#f9fafb' : 'transparent'}"><span style="color:#9ca3af;font-size:8px;text-transform:uppercase;letter-spacing:.5px;display:block">${l}</span><span style="color:#1f2937;font-weight:700">${v}</span></div>`).join("")}</div>
    ${tableSection("Éléments de Salaire", "#1d4ed8", buildSalaryRows(emp, p, anc), { totalRow: ["SALAIRE BRUT", fmtN(p.brut)], totalColor: "#1d4ed8" })}
    ${tableSection("Retenues Salariales", "#dc2626", buildRetRows(p), { totalRow: ["TOTAL RETENUES", `– ${fmtN(p.totalRet)}`], totalColor: "#dc2626" })}
    ${p.totalAvances > 0 ? tableSection("Avances & Retenues Diverses", "#b45309", buildAvancesRows(p), { negColor: "#b45309", totalRow: ["TOTAL AVANCES", `– ${fmtN(p.totalAvances)}`], totalColor: "#b45309" }) : ""}
    ${tableSection("Indemnités", "#059669", buildIndemRows(emp, p))}
    <div style="background:#ecfdf5;border:2px solid #10b981;border-radius:6px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin:10px 0"><div><div style="font-size:14px;font-weight:800;color:#064e3b">NET À PAYER</div><div style="font-size:9px;color:#6b7280;margin-top:2px">Période : ${periode}</div></div><div style="font-size:20px;font-weight:900;color:#10b981">${fmtN(p.net)} FCFA</div></div>
    ${tableSection("Charges Patronales (informatif)", "#b45309", buildChargesRows(p), { totalRow: ["TOTAL CHARGES PATRONALES", fmtN(p.chargesPat)], totalColor: "#92400e" })}
    <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:4px;padding:7px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#5b21b6">MASSE SALARIALE TOTALE</span><span style="font-size:12px;font-weight:800;color:#5b21b6">${fmtN(p.masse)} FCFA</span></div>
    ${signaturesHTML()}
  ${footerHTML(ent, "#10b981")}`;
  return pageWrapper("", body);
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE 2: Bleu Corporate
// ══════════════════════════════════════════════════════════════

function t2_corporate(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const info = infoGrid(emp, anc);
  const body = `
    <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-radius:8px">
      <div style="display:flex;align-items:center;gap:14px">${headerLogo(ent)}<div><div style="font-size:16px;font-weight:900;letter-spacing:2px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#93c5fd;margin-top:3px">NINEA : ${ent.ninea}</div>` : ""}</div></div>
      <div style="text-align:right"><div style="font-size:14px;font-weight:800;letter-spacing:1px">BULLETIN DE PAIE</div><div style="font-size:11px;color:#bfdbfe;margin-top:4px">${periode}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#e5e7eb;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;margin-bottom:12px">${info.map(([l, v]) => `<div style="padding:6px 12px;background:#fff"><span style="color:#6b7280;font-size:8px;text-transform:uppercase;display:block;margin-bottom:1px">${l}</span><span style="color:#111;font-weight:700;font-size:10px">${v}</span></div>`).join("")}</div>
    ${tableSection("Éléments de Salaire", "#2563eb", buildSalaryRows(emp, p, anc), { totalRow: ["SALAIRE BRUT", fmtN(p.brut)], totalColor: "#2563eb" })}
    ${tableSection("Retenues Salariales", "#e11d48", buildRetRows(p), { negColor: "#e11d48", totalRow: ["TOTAL RETENUES", `– ${fmtN(p.totalRet)}`], totalColor: "#e11d48" })}
    ${p.totalAvances > 0 ? tableSection("Avances & Retenues", "#d97706", buildAvancesRows(p), { negColor: "#d97706", totalRow: ["TOTAL AVANCES", `– ${fmtN(p.totalAvances)}`], totalColor: "#d97706" }) : ""}
    ${tableSection("Indemnités", "#0d9488", buildIndemRows(emp, p))}
    <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px solid #2563eb;border-radius:8px;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin:12px 0"><div><div style="font-size:14px;font-weight:900;color:#1e3a5f">NET À PAYER</div><div style="font-size:9px;color:#6b7280;margin-top:2px">${periode}</div></div><div style="font-size:22px;font-weight:900;color:#2563eb">${fmtN(p.net)} FCFA</div></div>
    ${tableSection("Charges Patronales", "#7c3aed", buildChargesRows(p), { totalRow: ["TOTAL CHARGES", fmtN(p.chargesPat)], totalColor: "#7c3aed" })}
    <div style="background:#faf5ff;border:1px solid #ddd6fe;border-radius:6px;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#7c3aed">MASSE SALARIALE</span><span style="font-size:12px;font-weight:800;color:#7c3aed">${fmtN(p.masse)} FCFA</span></div>
    ${signaturesHTML()}
  ${footerHTML(ent, "#2563eb")}`;
  return pageWrapper("", body);
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE 3: Minimaliste Noir
// ══════════════════════════════════════════════════════════════

function t3_minimal(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const info = infoGrid(emp, anc);
  const body = `
    <div style="border-bottom:3px solid #111;padding-bottom:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-end">
      <div style="display:flex;align-items:center;gap:12px">${ent.logo ? `<img src="${ent.logo}" style="height:40px;object-fit:contain"/>` : ""}<div><div style="font-size:18px;font-weight:900;color:#111;letter-spacing:3px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#6b7280;margin-top:2px">NINEA : ${ent.ninea}</div>` : ""}</div></div>
      <div style="text-align:right"><div style="font-size:11px;font-weight:700;color:#111;letter-spacing:2px">BULLETIN DE PAIE</div><div style="font-size:10px;color:#6b7280;margin-top:4px">${periode}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:14px">${info.map(([l, v]) => `<div style="padding:4px 0;border-bottom:1px solid #f3f4f6"><span style="color:#9ca3af;font-size:8px;text-transform:uppercase;margin-right:8px">${l}:</span><span style="color:#111;font-weight:600;font-size:10px">${v}</span></div>`).join("")}</div>
    ${tableSection("Éléments de Salaire", "#111", buildSalaryRows(emp, p, anc), { totalRow: ["SALAIRE BRUT", fmtN(p.brut)], totalColor: "#111" })}
    ${tableSection("Retenues Salariales", "#6b7280", buildRetRows(p), { negColor: "#111", totalRow: ["TOTAL RETENUES", `– ${fmtN(p.totalRet)}`], totalColor: "#111" })}
    ${p.totalAvances > 0 ? tableSection("Avances & Retenues", "#9ca3af", buildAvancesRows(p), { negColor: "#111", totalRow: ["TOTAL AVANCES", `– ${fmtN(p.totalAvances)}`], totalColor: "#111" }) : ""}
    ${tableSection("Indemnités", "#374151", buildIndemRows(emp, p))}
    <div style="border:3px solid #111;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin:12px 0"><div><div style="font-size:14px;font-weight:900;color:#111;letter-spacing:2px">NET À PAYER</div></div><div style="font-size:22px;font-weight:900;color:#111">${fmtN(p.net)} FCFA</div></div>
    ${tableSection("Charges Patronales", "#9ca3af", buildChargesRows(p), { totalRow: ["TOTAL CHARGES", fmtN(p.chargesPat)], totalColor: "#374151" })}
    <div style="border-top:1px solid #e5e7eb;padding-top:6px;display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#374151">MASSE SALARIALE</span><span style="font-size:11px;font-weight:800;color:#111">${fmtN(p.masse)} FCFA</span></div>
    ${signaturesHTML()}
  ${footerHTML(ent, "#111")}`;
  return pageWrapper("", body);
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE 4: Or & Bordeaux
// ══════════════════════════════════════════════════════════════

function t4_bordeaux(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const info = infoGrid(emp, anc);
  const body = `
    <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-radius:6px;border-bottom:4px solid #d4a017">
      <div style="display:flex;align-items:center;gap:14px">${headerLogo(ent)}<div><div style="font-size:16px;font-weight:900;letter-spacing:2px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#fca5a5;margin-top:3px">NINEA : ${ent.ninea}</div>` : ""}</div></div>
      <div style="text-align:right"><div style="font-size:13px;font-weight:800;color:#fbbf24;letter-spacing:1px">BULLETIN DE PAIE</div><div style="font-size:11px;color:#fca5a5;margin-top:4px">${periode}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:12px">${info.map(([l, v], i) => `<div style="padding:6px 10px;background:${i % 4 < 2 ? '#fef2f2' : '#fff'}"><span style="color:#9ca3af;font-size:8px;text-transform:uppercase;display:block">${l}</span><span style="color:#111;font-weight:700;font-size:10px">${v}</span></div>`).join("")}</div>
    ${tableSection("Éléments de Salaire", "#991b1b", buildSalaryRows(emp, p, anc), { totalRow: ["SALAIRE BRUT", fmtN(p.brut)], totalColor: "#991b1b" })}
    ${tableSection("Retenues Salariales", "#dc2626", buildRetRows(p), { totalRow: ["TOTAL RETENUES", `– ${fmtN(p.totalRet)}`], totalColor: "#dc2626" })}
    ${p.totalAvances > 0 ? tableSection("Avances & Retenues", "#b45309", buildAvancesRows(p), { negColor: "#b45309", totalRow: ["TOTAL AVANCES", `– ${fmtN(p.totalAvances)}`], totalColor: "#b45309" }) : ""}
    ${tableSection("Indemnités", "#15803d", buildIndemRows(emp, p))}
    <div style="background:linear-gradient(135deg,#fef2f2,#fff1f2);border:2px solid #991b1b;border-radius:6px;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin:12px 0"><div><div style="font-size:14px;font-weight:900;color:#7f1d1d">NET À PAYER</div></div><div style="font-size:22px;font-weight:900;color:#991b1b">${fmtN(p.net)} FCFA</div></div>
    ${tableSection("Charges Patronales", "#78350f", buildChargesRows(p), { totalRow: ["TOTAL CHARGES", fmtN(p.chargesPat)], totalColor: "#78350f" })}
    <div style="background:#fffbeb;border:1px solid #d4a017;border-radius:4px;padding:7px 14px;display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#78350f">MASSE SALARIALE</span><span style="font-size:12px;font-weight:800;color:#78350f">${fmtN(p.masse)} FCFA</span></div>
    ${signaturesHTML()}
  ${footerHTML(ent, "#991b1b")}`;
  return pageWrapper("", body);
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE 5: Sénégalais (Vert-Jaune-Rouge)
// ══════════════════════════════════════════════════════════════

function t5_senegalais(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const info = infoGrid(emp, anc);
  const body = `
    <div style="background:#006633;color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:0;border-radius:6px 6px 0 0">
      <div style="display:flex;align-items:center;gap:14px">${headerLogo(ent)}<div><div style="font-size:16px;font-weight:900;letter-spacing:2px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#a7f3d0;margin-top:3px">NINEA : ${ent.ninea}</div>` : ""}</div></div>
      <div style="text-align:right"><div style="font-size:13px;font-weight:800;color:#fde047">BULLETIN DE PAIE</div><div style="font-size:11px;color:#a7f3d0;margin-top:4px">${periode}</div></div>
    </div>
    <div style="height:6px;background:linear-gradient(90deg,#006633 33%,#fde047 33% 66%,#dc2626 66%);margin-bottom:14px;border-radius:0 0 6px 6px"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:12px">${info.map(([l, v], i) => `<div style="padding:6px 10px;background:${i % 4 < 2 ? '#f0fdf4' : '#fff'}"><span style="color:#6b7280;font-size:8px;text-transform:uppercase;display:block">${l}</span><span style="color:#111;font-weight:700;font-size:10px">${v}</span></div>`).join("")}</div>
    ${tableSection("Éléments de Salaire", "#006633", buildSalaryRows(emp, p, anc), { totalRow: ["SALAIRE BRUT", fmtN(p.brut)], totalColor: "#006633" })}
    ${tableSection("Retenues Salariales", "#dc2626", buildRetRows(p), { totalRow: ["TOTAL RETENUES", `– ${fmtN(p.totalRet)}`], totalColor: "#dc2626" })}
    ${p.totalAvances > 0 ? tableSection("Avances & Retenues", "#b45309", buildAvancesRows(p), { negColor: "#b45309", totalRow: ["TOTAL AVANCES", `– ${fmtN(p.totalAvances)}`], totalColor: "#b45309" }) : ""}
    ${tableSection("Indemnités", "#0d9488", buildIndemRows(emp, p))}
    <div style="background:#f0fdf4;border:2px solid #006633;border-radius:6px;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin:12px 0"><div><div style="font-size:14px;font-weight:900;color:#006633">NET À PAYER</div><div style="font-size:9px;color:#6b7280;margin-top:2px">${periode}</div></div><div style="font-size:22px;font-weight:900;color:#006633">${fmtN(p.net)} FCFA</div></div>
    ${tableSection("Charges Patronales", "#78350f", buildChargesRows(p), { totalRow: ["TOTAL CHARGES", fmtN(p.chargesPat)], totalColor: "#78350f" })}
    <div style="background:#faf5ff;border:1px solid #ddd6fe;border-radius:4px;padding:7px 14px;display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#5b21b6">MASSE SALARIALE</span><span style="font-size:12px;font-weight:800;color:#5b21b6">${fmtN(p.masse)} FCFA</span></div>
    ${signaturesHTML()}
  ${footerHTML(ent, "#006633")}`;
  return pageWrapper("", body);
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE 6: Moderne Violet
// ══════════════════════════════════════════════════════════════

function t6_violet(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const info = infoGrid(emp, anc);
  const body = `
    <div style="background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-radius:10px">
      <div style="display:flex;align-items:center;gap:14px">${headerLogo(ent)}<div><div style="font-size:16px;font-weight:900;letter-spacing:2px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#c4b5fd;margin-top:3px">NINEA : ${ent.ninea}</div>` : ""}</div></div>
      <div style="text-align:right"><div style="font-size:13px;font-weight:800;letter-spacing:1px">BULLETIN DE PAIE</div><div style="font-size:11px;color:#c4b5fd;margin-top:4px">${periode}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#e5e7eb;border:1px solid #ddd6fe;border-radius:8px;overflow:hidden;margin-bottom:12px">${info.map(([l, v]) => `<div style="padding:6px 12px;background:#fff"><span style="color:#7c3aed;font-size:8px;text-transform:uppercase;display:block">${l}</span><span style="color:#111;font-weight:700;font-size:10px">${v}</span></div>`).join("")}</div>
    ${tableSection("Éléments de Salaire", "#7c3aed", buildSalaryRows(emp, p, anc), { totalRow: ["SALAIRE BRUT", fmtN(p.brut)], totalColor: "#7c3aed" })}
    ${tableSection("Retenues Salariales", "#e11d48", buildRetRows(p), { negColor: "#e11d48", totalRow: ["TOTAL RETENUES", `– ${fmtN(p.totalRet)}`], totalColor: "#e11d48" })}
    ${p.totalAvances > 0 ? tableSection("Avances & Retenues", "#d97706", buildAvancesRows(p), { negColor: "#d97706", totalRow: ["TOTAL AVANCES", `– ${fmtN(p.totalAvances)}`], totalColor: "#d97706" }) : ""}
    ${tableSection("Indemnités", "#0d9488", buildIndemRows(emp, p))}
    <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px solid #7c3aed;border-radius:10px;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin:12px 0"><div><div style="font-size:14px;font-weight:900;color:#4c1d95">NET À PAYER</div></div><div style="font-size:22px;font-weight:900;color:#7c3aed">${fmtN(p.net)} FCFA</div></div>
    ${tableSection("Charges Patronales", "#6d28d9", buildChargesRows(p), { totalRow: ["TOTAL CHARGES", fmtN(p.chargesPat)], totalColor: "#6d28d9" })}
    <div style="background:#faf5ff;border:1px solid #ddd6fe;border-radius:6px;padding:7px 14px;display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#4c1d95">MASSE SALARIALE</span><span style="font-size:12px;font-weight:800;color:#4c1d95">${fmtN(p.masse)} FCFA</span></div>
    ${signaturesHTML()}
  ${footerHTML(ent, "#7c3aed")}`;
  return pageWrapper("", body);
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE 7: Tableau Structuré
// ══════════════════════════════════════════════════════════════

function t7_tableau(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const info = infoGrid(emp, anc);
  const allRows = [
    ...buildSalaryRows(emp, p, anc).map(r => [...r, ""]),
    ["SALAIRE BRUT", fmtN(p.brut), ""],
    ["", "", ""],
    ...buildRetRows(p).map(r => [...r, ""]),
    ["TOTAL RETENUES", `– ${fmtN(p.totalRet)}`, ""],
    ...(p.totalAvances > 0 ? [...buildAvancesRows(p).map(r => [...r, ""]), ["TOTAL AVANCES", `– ${fmtN(p.totalAvances)}`, ""]] : []),
    ["", "", ""],
    ...buildIndemRows(emp, p).map(r => [...r, ""]),
  ];
  const body = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #1e40af">
      <div style="display:flex;align-items:center;gap:12px">${ent.logo ? `<img src="${ent.logo}" style="height:44px;object-fit:contain"/>` : ""}<div><div style="font-size:15px;font-weight:900;color:#1e40af">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#6b7280">NINEA : ${ent.ninea}</div>` : ""}</div></div>
      <div style="text-align:right;border:2px solid #1e40af;padding:8px 14px;border-radius:4px"><div style="font-size:12px;font-weight:800;color:#1e40af">BULLETIN DE PAIE</div><div style="font-size:10px;color:#6b7280;margin-top:2px">${periode}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;margin-bottom:12px">${info.map(([l, v], i) => i % 2 === 0 ? `<tr style="background:${Math.floor(i/2) % 2 === 0 ? '#f9fafb' : '#fff'}"><td style="padding:4px 8px;font-size:8px;color:#6b7280;border:1px solid #e5e7eb;width:15%">${l}</td><td style="padding:4px 8px;font-size:10px;font-weight:700;border:1px solid #e5e7eb;width:35%">${v}</td><td style="padding:4px 8px;font-size:8px;color:#6b7280;border:1px solid #e5e7eb;width:15%">${info[i+1]?.[0] || ""}</td><td style="padding:4px 8px;font-size:10px;font-weight:700;border:1px solid #e5e7eb;width:35%">${info[i+1]?.[1] || ""}</td></tr>` : "").join("")}</table>
    <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;margin-bottom:12px">
      <thead><tr style="background:#1e40af;color:#fff"><th style="padding:6px 10px;text-align:left;font-size:9px;letter-spacing:1px">Désignation</th><th style="padding:6px 10px;text-align:right;font-size:9px">Part Salarié</th><th style="padding:6px 10px;text-align:right;font-size:9px">Part Employeur</th></tr></thead>
      <tbody>${allRows.map(([l, v], i) => l === "" ? `<tr><td colspan="3" style="padding:2px;border-bottom:1px solid #d1d5db"></td></tr>` : `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}"><td style="padding:4px 10px;font-size:10px;border-bottom:1px solid #e5e7eb;font-weight:${l.startsWith('TOTAL') || l.startsWith('SALAIRE') ? '700' : '400'}">${l}</td><td style="padding:4px 10px;text-align:right;font-size:10px;border-bottom:1px solid #e5e7eb;font-weight:${l.startsWith('TOTAL') || l.startsWith('SALAIRE') ? '700' : '400'}">${v} FCFA</td><td style="padding:4px 10px;text-align:right;font-size:10px;border-bottom:1px solid #e5e7eb"></td></tr>`).join("")}</tbody>
    </table>
    <div style="background:#1e40af;color:#fff;border-radius:4px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin:10px 0"><div style="font-size:13px;font-weight:800">NET À PAYER</div><div style="font-size:20px;font-weight:900">${fmtN(p.net)} FCFA</div></div>
    ${tableSection("Charges Patronales", "#6b7280", buildChargesRows(p), { totalRow: ["TOTAL CHARGES", fmtN(p.chargesPat)], totalColor: "#374151" })}
    <div style="border:1px solid #d1d5db;padding:6px 14px;display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#374151">MASSE SALARIALE</span><span style="font-size:11px;font-weight:800;color:#1e40af">${fmtN(p.masse)} FCFA</span></div>
    ${signaturesHTML()}
  ${footerHTML(ent, "#1e40af")}`;
  return pageWrapper("", body);
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE 8: Océan Turquoise
// ══════════════════════════════════════════════════════════════

function t8_ocean(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const info = infoGrid(emp, anc);
  const body = `
    <div style="background:linear-gradient(135deg,#134e4a,#0d9488);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-radius:8px">
      <div style="display:flex;align-items:center;gap:14px">${headerLogo(ent)}<div><div style="font-size:16px;font-weight:900;letter-spacing:2px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#99f6e4;margin-top:3px">NINEA : ${ent.ninea}</div>` : ""}</div></div>
      <div style="text-align:right"><div style="font-size:13px;font-weight:800;letter-spacing:1px">BULLETIN DE PAIE</div><div style="font-size:11px;color:#99f6e4;margin-top:4px">${periode}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#e5e7eb;border:1px solid #ccfbf1;border-radius:6px;overflow:hidden;margin-bottom:12px">${info.map(([l, v]) => `<div style="padding:6px 12px;background:#fff"><span style="color:#0d9488;font-size:8px;text-transform:uppercase;display:block">${l}</span><span style="color:#111;font-weight:700;font-size:10px">${v}</span></div>`).join("")}</div>
    ${tableSection("Éléments de Salaire", "#0d9488", buildSalaryRows(emp, p, anc), { totalRow: ["SALAIRE BRUT", fmtN(p.brut)], totalColor: "#0d9488" })}
    ${tableSection("Retenues Salariales", "#dc2626", buildRetRows(p), { totalRow: ["TOTAL RETENUES", `– ${fmtN(p.totalRet)}`], totalColor: "#dc2626" })}
    ${p.totalAvances > 0 ? tableSection("Avances & Retenues", "#d97706", buildAvancesRows(p), { negColor: "#d97706", totalRow: ["TOTAL AVANCES", `– ${fmtN(p.totalAvances)}`], totalColor: "#d97706" }) : ""}
    ${tableSection("Indemnités", "#059669", buildIndemRows(emp, p))}
    <div style="background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border:2px solid #0d9488;border-radius:8px;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin:12px 0"><div><div style="font-size:14px;font-weight:900;color:#134e4a">NET À PAYER</div></div><div style="font-size:22px;font-weight:900;color:#0d9488">${fmtN(p.net)} FCFA</div></div>
    ${tableSection("Charges Patronales", "#78350f", buildChargesRows(p), { totalRow: ["TOTAL CHARGES", fmtN(p.chargesPat)], totalColor: "#78350f" })}
    <div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:4px;padding:7px 14px;display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#134e4a">MASSE SALARIALE</span><span style="font-size:12px;font-weight:800;color:#134e4a">${fmtN(p.masse)} FCFA</span></div>
    ${signaturesHTML()}
  ${footerHTML(ent, "#0d9488")}`;
  return pageWrapper("", body);
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE 9: Ardoise Moderne
// ══════════════════════════════════════════════════════════════

function t9_ardoise(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const info = infoGrid(emp, anc);
  const body = `
    <div style="background:#1e293b;color:#fff;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-radius:8px">
      <div style="display:flex;align-items:center;gap:14px">${headerLogo(ent)}<div><div style="font-size:16px;font-weight:900;letter-spacing:2px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#94a3b8;margin-top:3px">NINEA : ${ent.ninea}</div>` : ""}</div></div>
      <div style="text-align:right"><div style="font-size:13px;font-weight:800;color:#38bdf8">BULLETIN DE PAIE</div><div style="font-size:11px;color:#94a3b8;margin-top:4px">${periode}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#e2e8f0;border:1px solid #cbd5e1;border-radius:6px;overflow:hidden;margin-bottom:12px">${info.map(([l, v]) => `<div style="padding:6px 12px;background:#f8fafc"><span style="color:#64748b;font-size:8px;text-transform:uppercase;display:block">${l}</span><span style="color:#0f172a;font-weight:700;font-size:10px">${v}</span></div>`).join("")}</div>
    ${tableSection("Éléments de Salaire", "#1e293b", buildSalaryRows(emp, p, anc), { totalRow: ["SALAIRE BRUT", fmtN(p.brut)], totalColor: "#1e293b" })}
    ${tableSection("Retenues Salariales", "#be123c", buildRetRows(p), { negColor: "#be123c", totalRow: ["TOTAL RETENUES", `– ${fmtN(p.totalRet)}`], totalColor: "#be123c" })}
    ${p.totalAvances > 0 ? tableSection("Avances & Retenues", "#b45309", buildAvancesRows(p), { negColor: "#b45309", totalRow: ["TOTAL AVANCES", `– ${fmtN(p.totalAvances)}`], totalColor: "#b45309" }) : ""}
    ${tableSection("Indemnités", "#0369a1", buildIndemRows(emp, p))}
    <div style="background:#0f172a;border-radius:8px;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin:12px 0"><div><div style="font-size:14px;font-weight:900;color:#fff">NET À PAYER</div></div><div style="font-size:22px;font-weight:900;color:#38bdf8">${fmtN(p.net)} FCFA</div></div>
    ${tableSection("Charges Patronales", "#475569", buildChargesRows(p), { totalRow: ["TOTAL CHARGES", fmtN(p.chargesPat)], totalColor: "#334155" })}
    <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;padding:7px 14px;display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#334155">MASSE SALARIALE</span><span style="font-size:12px;font-weight:800;color:#0f172a">${fmtN(p.masse)} FCFA</span></div>
    ${signaturesHTML()}
  ${footerHTML(ent, "#1e293b")}`;
  return pageWrapper("", body);
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE 10: Soleil Orange
// ══════════════════════════════════════════════════════════════

function t10_soleil(emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise): string {
  const periode = `${MOIS[mois]} ${annee}`;
  const info = infoGrid(emp, anc);
  const body = `
    <div style="background:linear-gradient(135deg,#7c2d12,#ea580c);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-radius:8px">
      <div style="display:flex;align-items:center;gap:14px">${headerLogo(ent)}<div><div style="font-size:16px;font-weight:900;letter-spacing:2px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:9px;color:#fed7aa;margin-top:3px">NINEA : ${ent.ninea}</div>` : ""}</div></div>
      <div style="text-align:right"><div style="font-size:13px;font-weight:800;color:#fbbf24">BULLETIN DE PAIE</div><div style="font-size:11px;color:#fed7aa;margin-top:4px">${periode}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#e5e7eb;border:1px solid #fed7aa;border-radius:6px;overflow:hidden;margin-bottom:12px">${info.map(([l, v]) => `<div style="padding:6px 12px;background:#fff"><span style="color:#ea580c;font-size:8px;text-transform:uppercase;display:block">${l}</span><span style="color:#111;font-weight:700;font-size:10px">${v}</span></div>`).join("")}</div>
    ${tableSection("Éléments de Salaire", "#ea580c", buildSalaryRows(emp, p, anc), { totalRow: ["SALAIRE BRUT", fmtN(p.brut)], totalColor: "#ea580c" })}
    ${tableSection("Retenues Salariales", "#dc2626", buildRetRows(p), { totalRow: ["TOTAL RETENUES", `– ${fmtN(p.totalRet)}`], totalColor: "#dc2626" })}
    ${p.totalAvances > 0 ? tableSection("Avances & Retenues", "#b45309", buildAvancesRows(p), { negColor: "#b45309", totalRow: ["TOTAL AVANCES", `– ${fmtN(p.totalAvances)}`], totalColor: "#b45309" }) : ""}
    ${tableSection("Indemnités", "#15803d", buildIndemRows(emp, p))}
    <div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border:2px solid #ea580c;border-radius:8px;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin:12px 0"><div><div style="font-size:14px;font-weight:900;color:#7c2d12">NET À PAYER</div></div><div style="font-size:22px;font-weight:900;color:#ea580c">${fmtN(p.net)} FCFA</div></div>
    ${tableSection("Charges Patronales", "#78350f", buildChargesRows(p), { totalRow: ["TOTAL CHARGES", fmtN(p.chargesPat)], totalColor: "#78350f" })}
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;padding:7px 14px;display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#7c2d12">MASSE SALARIALE</span><span style="font-size:12px;font-weight:800;color:#7c2d12">${fmtN(p.masse)} FCFA</span></div>
    ${signaturesHTML()}
  ${footerHTML(ent, "#ea580c")}`;
  return pageWrapper("", body);
}

// ══════════════════════════════════════════════════════════════
//  Registry
// ══════════════════════════════════════════════════════════════

export const BULLETIN_TEMPLATES: BulletinTemplate[] = [
  { id: "classique", nom: "Classique Émeraude", description: "Le modèle original avec en-tête vert émeraude", couleurPrimaire: "#064e3b", generate: t1_classique },
  { id: "corporate", nom: "Bleu Corporate", description: "Style professionnel avec dégradé bleu", couleurPrimaire: "#2563eb", generate: t2_corporate },
  { id: "minimal", nom: "Minimaliste Noir", description: "Design épuré, noir et blanc avec accents subtils", couleurPrimaire: "#111111", generate: t3_minimal },
  { id: "bordeaux", nom: "Or & Bordeaux", description: "Élégant avec accents dorés et bordeaux", couleurPrimaire: "#991b1b", generate: t4_bordeaux },
  { id: "senegalais", nom: "Élégant Sénégalais", description: "Aux couleurs du drapeau national vert-jaune-rouge", couleurPrimaire: "#006633", generate: t5_senegalais },
  { id: "violet", nom: "Moderne Violet", description: "Design contemporain avec dégradé violet", couleurPrimaire: "#7c3aed", generate: t6_violet },
  { id: "tableau", nom: "Tableau Structuré", description: "Format comptable avec tableau complet", couleurPrimaire: "#1e40af", generate: t7_tableau },
  { id: "ocean", nom: "Océan Turquoise", description: "Ambiance marine avec teintes turquoise", couleurPrimaire: "#0d9488", generate: t8_ocean },
  { id: "ardoise", nom: "Ardoise Moderne", description: "Style sombre et moderne avec accents cyan", couleurPrimaire: "#1e293b", generate: t9_ardoise },
  { id: "soleil", nom: "Soleil Orange", description: "Chaleureux avec dégradé orange africain", couleurPrimaire: "#ea580c", generate: t10_soleil },
];

export function getTemplate(id: string): BulletinTemplate {
  return BULLETIN_TEMPLATES.find(t => t.id === id) || BULLETIN_TEMPLATES[0];
}
