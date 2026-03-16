import type { Employee, PayrollResult, Entreprise } from "./payroll";
import { MOIS } from "./payroll";

export type BulletinTemplateId = "classique" | "moderne" | "minimaliste" | "tableau" | "senegalais";

export interface BulletinTemplate {
  id: BulletinTemplateId;
  name: string;
  icon: string;
  description: string;
  previewColors: { header: string; accent: string; bg: string };
}

export const BULLETIN_TEMPLATES: BulletinTemplate[] = [
  { id: "classique", name: "Classique Corporate", icon: "🏢", description: "Sobre et professionnel, en-tête vert foncé", previewColors: { header: "#064e3b", accent: "#10b981", bg: "#f9fafb" } },
  { id: "moderne", name: "Moderne Coloré", icon: "🎨", description: "Sections colorées, cartes arrondies, dynamique", previewColors: { header: "#1e40af", accent: "#3b82f6", bg: "#eff6ff" } },
  { id: "minimaliste", name: "Minimaliste Épuré", icon: "📋", description: "Blanc pur, lignes fines, élégant", previewColors: { header: "#374151", accent: "#6b7280", bg: "#ffffff" } },
  { id: "tableau", name: "Tableau Structuré", icon: "📊", description: "Style comptable traditionnel sénégalais", previewColors: { header: "#1e3a5f", accent: "#2563eb", bg: "#f0f4f8" } },
  { id: "senegalais", name: "Élégant Sénégalais", icon: "🌿", description: "Palette terre/or, identité locale", previewColors: { header: "#78350f", accent: "#d97706", bg: "#fffbeb" } },
];

interface GenParams {
  emp: Employee;
  p: PayrollResult;
  mois: number;
  annee: number;
  anc: number;
  ent: Entreprise;
}

const fmtN = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

function commonData({ emp, p, mois, annee, anc, ent }: GenParams) {
  const periode = `${MOIS[mois]} ${annee}`;
  const date_emission = new Date().toLocaleDateString("fr-FR");

  const headerLogo = ent.logo
    ? `<img src="${ent.logo}" alt="logo" style="height:36px;max-width:100px;object-fit:contain;display:block"/>`
    : `<div style="width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:16px">🏢</div>`;

  const infoRows: [string, string][] = [
    ["Matricule", emp.matricule], ["Fonction", emp.fonction],
    ["Nom & Prénom", `${emp.prenom} ${emp.nom}`], ["Catégorie", emp.categorie || "—"],
    ["Convention", emp.convention || "—"], ["Contrat", emp.contrat],
    ["Date d'entrée", emp.dateEntree], ["Ancienneté", `${anc} an${anc > 1 ? "s" : ""}`],
    ["Situation fam.", emp.situationFamille], ["Enfants à charge", String(emp.enfants || 0)],
  ];

  const footerItems = [
    ent.adresse && `<span>📍 ${ent.adresse}</span>`,
    ent.telephone && `<span>📞 ${ent.telephone}</span>`,
    ent.email && `<span>✉ ${ent.email}</span>`,
    ent.ninea && `<span>NINEA : ${ent.ninea}</span>`,
    ent.rccm && `<span>RCCM : ${ent.rccm}</span>`,
  ].filter(Boolean).join(`<span style="color:#d1d5db"> | </span>`);

  const hsRows = [
    p.mtHS115 > 0 ? { label: `HS 115% (${emp.hs115}h)`, val: p.mtHS115 } : null,
    p.mtHS140 > 0 ? { label: `HS 140% (${emp.hs140}h)`, val: p.mtHS140 } : null,
    p.mtHS160 > 0 ? { label: `HS 160% (${emp.hs160}h)`, val: p.mtHS160 } : null,
    p.mtHS200 > 0 ? { label: `HS 200% (${emp.hs200}h)`, val: p.mtHS200 } : null,
  ].filter(Boolean) as { label: string; val: number }[];

  const avancesRows = [
    p.avanceTabaski > 0 ? { label: "Avance Tabaski/Noël", val: p.avanceTabaski } : null,
    p.avanceCaisse > 0 ? { label: "Avance caisse", val: p.avanceCaisse } : null,
    p.avanceFinanciere > 0 ? { label: "Avance financière", val: p.avanceFinanciere } : null,
    p.retCooperative > 0 ? { label: "Retenue coopérative", val: p.retCooperative } : null,
    p.fraisMedicaux > 0 ? { label: "Frais médicaux", val: p.fraisMedicaux } : null,
  ].filter(Boolean) as { label: string; val: number }[];

  const chargesRows = [
    { label: "CFCE (3%)", val: p.cfce },
    { label: "IPRES R.G. patronal (8,4%)", val: p.ipresRG_p },
    p.ipresRC_p > 0 ? { label: "IPRES R.C.C. patronal (3,6%)", val: p.ipresRC_p } : null,
    { label: "CSS Alloc. Familiales (7%)", val: p.css_af },
    { label: "CSS Acc. Travail (1%)", val: p.css_at },
    p.ipm_p > 0 ? { label: "IPM patronal", val: p.ipm_p } : null,
  ].filter(Boolean) as { label: string; val: number }[];

  return { periode, date_emission, headerLogo, infoRows, footerItems, hsRows, avancesRows, chargesRows };
}

function printBar(title: string) {
  return `<div class="no-print" style="background:#1f2937;color:#fff;padding:8px 16px;text-align:center;font-family:Arial;font-size:12px;position:sticky;top:0;z-index:99;display:flex;align-items:center;justify-content:center;gap:12px">
    <span>📄 ${title}</span>
    <button onclick="window.print()" style="background:#10b981;color:#fff;border:none;padding:6px 18px;border-radius:5px;font-size:12px;font-weight:700;cursor:pointer">🖨️ Enregistrer en PDF</button>
  </div>`;
}

function pageWrap(styles: string, body: string, emp: Employee, periode: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Bulletin – ${emp.prenom} ${emp.nom} – ${periode}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:8px;color:#1f2937;background:#fff}
.page{width:210mm;min-height:297mm;max-height:297mm;overflow:hidden;margin:0 auto;padding:4mm 7mm;display:flex;flex-direction:column}
.content{flex:1;overflow:hidden}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:4mm 7mm}.no-print{display:none!important}}
@page{size:A4 portrait;margin:0}
${styles}</style></head><body>${body}</body></html>`;
}

// ════════════════════════════════════════════════════════════════
//  TEMPLATE 1: CLASSIQUE CORPORATE
// ════════════════════════════════════════════════════════════════
function genClassique(g: GenParams): string {
  const d = commonData(g);
  const { emp, p, ent } = g;

  const row = (label: string, val: number, opts: any = {}) => {
    const { neg = false, bold = false, color = "#1f2937", bg = "transparent", indent = false } = opts;
    return `<tr style="background:${bg}"><td style="padding:1.5px 4px 1.5px ${indent ? '12px' : '4px'};font-size:8px;color:#374151;border-bottom:1px solid #e5e7eb;font-weight:${bold ? 700 : 400}">${label}</td><td style="padding:1.5px 5px;text-align:right;font-size:8px;color:${color};border-bottom:1px solid #e5e7eb;font-weight:${bold ? 700 : 400}">${neg ? '– ' : ''}${fmtN(val)} F</td></tr>`;
  };

  const section = (title: string, bgColor: string, rows: string) => `<table style="width:100%;border-collapse:collapse;margin-bottom:2px"><thead><tr><th colspan="2" style="background:${bgColor};color:#fff;padding:2px 5px;text-align:left;font-size:7px;letter-spacing:1px;text-transform:uppercase">${title}</th></tr></thead><tbody>${rows}</tbody></table>`;

  const headerLeft = `<div style="display:flex;align-items:center;gap:8px">${d.headerLogo}<div><div style="font-size:12px;font-weight:900;color:#fff;letter-spacing:1px;text-transform:uppercase">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:7px;color:#a7f3d0;margin-top:1px">NINEA : ${ent.ninea}</div>` : ""}</div></div>`;

  const hsHtml = d.hsRows.map((r, i) => row(r.label, r.val, { indent: true, bg: i % 2 === 0 ? "#f9fafb" : "transparent" })).join("");
  const avHtml = d.avancesRows.map(r => row(r.label, r.val, { neg: true, indent: true, color: "#b45309" })).join("");
  const chHtml = d.chargesRows.map((r, i) => row(r.label, r.val, { bg: i % 2 === 0 ? "#fffbeb" : "transparent", color: "#92400e" })).join("");

  const body = `${printBar("Bulletin prêt à imprimer")}
<div class="page"><div class="content">
  <div style="background:#064e3b;color:#fff;padding:5px 10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;border-radius:3px">${headerLeft}<div style="text-align:right"><div style="font-size:10px;font-weight:900;color:#fff;letter-spacing:1px">BULLETIN DE PAIE</div><div style="font-size:8px;color:#a7f3d0;margin-top:1px">Période : <b>${d.periode}</b></div><div style="font-size:7px;color:#6ee7b7">Émis le : ${d.date_emission}</div></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #e5e7eb;border-radius:2px;overflow:hidden;margin-bottom:3px">${d.infoRows.map(([l, v], i) => `<div style="padding:1.5px 5px;font-size:8px;border-bottom:1px solid #e5e7eb;${i % 4 < 2 ? 'background:#f9fafb' : ''}"><span style="color:#9ca3af;font-size:6px;text-transform:uppercase;letter-spacing:.5px;display:block">${l}</span><span style="color:#1f2937;font-weight:700">${v}</span></div>`).join("")}</div>
  ${section("Éléments de Salaire", "#1d4ed8", row("Salaire de base", p.salaireBase, { bg: "#f9fafb" }) + (p.sursalaire > 0 ? row("Sursalaire", p.sursalaire) : "") + (p.primeAnc > 0 ? row(`Prime d'ancienneté (${d.infoRows[7][1]})`, p.primeAnc, { indent: true, color: "#1d4ed8", bg: "#f9fafb" }) : "") + hsHtml + (p.retAbsence > 0 ? row(`Retenue absences (${emp.heuresAbsence}h)`, p.retAbsence, { neg: true, color: "#dc2626" }) : "") + (p.indMaladie > 0 ? row("Indemnité maladie", p.indMaladie, { color: "#059669" }) : "") + row("SALAIRE BRUT", p.brut, { bold: true, color: "#1d4ed8" }))}
  ${section("Retenues Salariales", "#dc2626", row("IR", p.ir, { neg: true, indent: true, color: "#dc2626", bg: "#f9fafb" }) + row("TRIMF", p.trimf, { neg: true, indent: true, color: "#dc2626" }) + row("IPRES R.G. salarié (5,6%)", p.ipresRG_s, { neg: true, indent: true, color: "#dc2626", bg: "#f9fafb" }) + (p.ipresRC_s > 0 ? row("IPRES R.C.C. salarié (2,4%)", p.ipresRC_s, { neg: true, indent: true, color: "#dc2626" }) : "") + (p.ipm_s > 0 ? row("IPM salarié", p.ipm_s, { neg: true, indent: true, color: "#dc2626", bg: "#f9fafb" }) : "") + row("TOTAL RETENUES", p.totalRet, { neg: true, bold: true, color: "#dc2626" }))}
  ${p.totalAvances > 0 ? section("Avances & Retenues Diverses", "#b45309", avHtml + row("TOTAL AVANCES", p.totalAvances, { neg: true, bold: true, color: "#b45309" })) : ""}
  ${section("Indemnités", "#059669", row("Indemnité de transport", p.transport, { color: "#065f46", bg: "#f0fdf4" }) + (p.primePanier > 0 ? row(`Prime de panier (${emp.nbPaniers}j)`, p.primePanier, { color: "#065f46" }) : "") + (p.indKilometrique > 0 ? row("Indemnité kilométrique", p.indKilometrique, { color: "#065f46", bg: "#f0fdf4" }) : ""))}
  <div style="background:#ecfdf5;border:2px solid #10b981;border-radius:3px;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;margin:3px 0"><div><div style="font-size:10px;font-weight:800;color:#064e3b">NET À PAYER</div><div style="font-size:7px;color:#6b7280;margin-top:1px">${d.periode}</div></div><div style="font-size:13px;font-weight:900;color:#10b981">${fmtN(p.net)} FCFA</div></div>
  ${section("Charges Patronales (informatif)", "#b45309", chHtml + row("TOTAL CHARGES PATRONALES", p.chargesPat, { bold: true, color: "#92400e", bg: "#fffbeb" }))}
  <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:2px;padding:2px 6px;display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><span style="font-size:8px;font-weight:700;color:#5b21b6">MASSE SALARIALE TOTALE</span><span style="font-size:10px;font-weight:800;color:#5b21b6">${fmtN(p.masse)} FCFA</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:3px 0 1px">${["Employeur", "Service RH", "Employé(e)"].map(s => `<div style="text-align:center"><div style="font-size:6px;color:#6b7280;margin-bottom:10px">${s}</div><div style="border-top:1px solid #d1d5db;padding-top:2px;font-size:6px;color:#9ca3af">Signature & cachet</div></div>`).join("")}</div>
</div>
<div style="margin-top:auto;padding-top:3px;border-top:2px solid #10b981"><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px 0;font-size:7px;color:#4b5563;padding:2px 0;text-align:center;line-height:1.3">${d.footerItems}</div><div style="text-align:center;font-size:6px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:2px;margin-top:2px">Document généré par G-SENPAIE · ${d.periode} · Confidentiel</div></div>
</div>`;

  return pageWrap("", body, emp, d.periode);
}

// ════════════════════════════════════════════════════════════════
//  TEMPLATE 2: MODERNE COLORÉ
// ════════════════════════════════════════════════════════════════
function genModerne(g: GenParams): string {
  const d = commonData(g);
  const { emp, p, ent } = g;

  const row = (label: string, val: number, neg = false, bold = false) =>
    `<tr><td style="padding:1.5px 5px;font-size:8px;border-bottom:1px solid #e2e8f0;font-weight:${bold ? 700 : 400}">${label}</td><td style="padding:1.5px 5px;text-align:right;font-size:8px;border-bottom:1px solid #e2e8f0;font-weight:${bold ? 700 : 400}">${neg ? '– ' : ''}${fmtN(val)} F</td></tr>`;

  const card = (title: string, color: string, content: string) =>
    `<div style="border:1px solid ${color}30;border-radius:4px;overflow:hidden;margin-bottom:2px"><div style="background:${color};color:#fff;padding:2px 6px;font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase">${title}</div><table style="width:100%;border-collapse:collapse">${content}</table></div>`;

  const headerLeft = `<div style="display:flex;align-items:center;gap:8px">${d.headerLogo}<div><div style="font-size:12px;font-weight:900;color:#fff;letter-spacing:1px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:7px;color:#bfdbfe;margin-top:1px">NINEA : ${ent.ninea}</div>` : ""}</div></div>`;

  const hsHtml = d.hsRows.map(r => row(r.label, r.val)).join("");
  const avHtml = d.avancesRows.map(r => row(r.label, r.val, true)).join("");
  const chHtml = d.chargesRows.map(r => row(r.label, r.val)).join("");

  const body = `${printBar("Bulletin Moderne")}
<div class="page"><div class="content">
  <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:5px 10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;border-radius:5px">${headerLeft}<div style="text-align:right"><div style="font-size:11px;font-weight:900;letter-spacing:2px">BULLETIN DE PAIE</div><div style="font-size:8px;color:#bfdbfe;margin-top:1px">Période : <b>${d.periode}</b></div><div style="font-size:7px;color:#93c5fd">Émis le : ${d.date_emission}</div></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:3px">${d.infoRows.map(([l, v]) => `<div style="background:#f8fafc;border-radius:2px;padding:1.5px 5px;font-size:8px"><span style="color:#94a3b8;font-size:6px;display:block">${l}</span><span style="font-weight:700">${v}</span></div>`).join("")}</div>
  ${card("💰 Éléments de Salaire", "#2563eb", row("Salaire de base", p.salaireBase) + (p.sursalaire > 0 ? row("Sursalaire", p.sursalaire) : "") + (p.primeAnc > 0 ? row("Prime d'ancienneté", p.primeAnc) : "") + hsHtml + (p.retAbsence > 0 ? row("Retenue absences", p.retAbsence, true) : "") + (p.indMaladie > 0 ? row("Indemnité maladie", p.indMaladie) : "") + row("SALAIRE BRUT", p.brut, false, true))}
  ${card("🔻 Retenues Salariales", "#dc2626", row("IR", p.ir, true) + row("TRIMF", p.trimf, true) + row("IPRES R.G. (5,6%)", p.ipresRG_s, true) + (p.ipresRC_s > 0 ? row("IPRES R.C.C. (2,4%)", p.ipresRC_s, true) : "") + (p.ipm_s > 0 ? row("IPM salarié", p.ipm_s, true) : "") + row("TOTAL RETENUES", p.totalRet, true, true))}
  ${p.totalAvances > 0 ? card("⚠️ Avances & Retenues", "#f59e0b", avHtml + row("TOTAL AVANCES", p.totalAvances, true, true)) : ""}
  ${card("🚌 Indemnités", "#059669", row("Transport", p.transport) + (p.primePanier > 0 ? row("Prime de panier", p.primePanier) : "") + (p.indKilometrique > 0 ? row("Ind. kilométrique", p.indKilometrique) : ""))}
  <div style="background:linear-gradient(135deg,#2563eb,#3b82f6);border-radius:5px;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;margin:3px 0"><div><div style="font-size:10px;font-weight:900;color:#fff">NET À PAYER</div><div style="font-size:7px;color:#bfdbfe;margin-top:1px">${d.periode}</div></div><div style="font-size:13px;font-weight:900;color:#fff">${fmtN(p.net)} FCFA</div></div>
  ${card("📊 Charges Patronales", "#92400e", chHtml + row("TOTAL CHARGES", p.chargesPat, false, true))}
  <div style="background:linear-gradient(135deg,#7c3aed,#a78bfa);border-radius:3px;padding:2px 8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><span style="font-size:8px;font-weight:700;color:#fff">MASSE SALARIALE</span><span style="font-size:10px;font-weight:900;color:#fff">${fmtN(p.masse)} FCFA</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:3px 0 1px">${["Employeur", "Service RH", "Employé(e)"].map(s => `<div style="text-align:center"><div style="font-size:6px;color:#6b7280;margin-bottom:10px">${s}</div><div style="border-top:1px solid #d1d5db;padding-top:2px;font-size:6px;color:#9ca3af">Signature</div></div>`).join("")}</div>
</div>
<div style="margin-top:auto;padding-top:3px;border-top:2px solid #3b82f6"><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px;font-size:7px;color:#4b5563;padding:2px 0;text-align:center;line-height:1.3">${d.footerItems}</div><div style="text-align:center;font-size:6px;color:#9ca3af;margin-top:2px">G-SENPAIE · ${d.periode} · Confidentiel</div></div>
</div>`;

  return pageWrap("", body, emp, d.periode);
}

// ════════════════════════════════════════════════════════════════
//  TEMPLATE 3: MINIMALISTE ÉPURÉ
// ════════════════════════════════════════════════════════════════
function genMinimaliste(g: GenParams): string {
  const d = commonData(g);
  const { emp, p, ent } = g;

  const row = (label: string, val: number, neg = false, bold = false) =>
    `<div style="display:flex;justify-content:space-between;padding:1px 0;${bold ? 'font-weight:700;border-top:1px solid #e5e7eb;margin-top:1px;padding-top:2px' : ''}"><span style="font-size:8px;color:#6b7280">${label}</span><span style="font-size:8px;color:${neg ? '#ef4444' : '#111827'};font-weight:${bold ? 700 : 500}">${neg ? '– ' : ''}${fmtN(val)} F</span></div>`;

  const section = (title: string, content: string) =>
    `<div style="margin-bottom:3px"><div style="font-size:6px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:1px;padding-bottom:1px;border-bottom:1px solid #f3f4f6">${title}</div>${content}</div>`;

  const body = `${printBar("Bulletin Minimaliste")}
<div class="page"><div class="content">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid #111827">
    <div style="display:flex;align-items:center;gap:8px">${d.headerLogo}<div><div style="font-size:13px;font-weight:900;color:#111827;letter-spacing:1px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:7px;color:#9ca3af;margin-top:1px">NINEA ${ent.ninea}</div>` : ""}</div></div>
    <div style="text-align:right"><div style="font-size:9px;font-weight:300;color:#6b7280;letter-spacing:3px;text-transform:uppercase">Bulletin de paie</div><div style="font-size:13px;font-weight:900;color:#111827;margin-top:2px">${d.periode}</div><div style="font-size:7px;color:#9ca3af;margin-top:1px">${d.date_emission}</div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px 10px;margin-bottom:4px">${d.infoRows.map(([l, v]) => `<div style="display:flex;justify-content:space-between;padding:1px 0;border-bottom:1px solid #f9fafb"><span style="font-size:7px;color:#9ca3af">${l}</span><span style="font-size:8px;font-weight:600;color:#111827">${v}</span></div>`).join("")}</div>
  ${section("Éléments de salaire", row("Salaire de base", p.salaireBase) + (p.sursalaire > 0 ? row("Sursalaire", p.sursalaire) : "") + (p.primeAnc > 0 ? row("Prime ancienneté", p.primeAnc) : "") + d.hsRows.map(r => row(r.label, r.val)).join("") + (p.retAbsence > 0 ? row("Retenue absences", p.retAbsence, true) : "") + row("Salaire brut", p.brut, false, true))}
  ${section("Retenues", row("IR", p.ir, true) + row("TRIMF", p.trimf, true) + row("IPRES R.G.", p.ipresRG_s, true) + (p.ipresRC_s > 0 ? row("IPRES R.C.C.", p.ipresRC_s, true) : "") + (p.ipm_s > 0 ? row("IPM", p.ipm_s, true) : "") + row("Total retenues", p.totalRet, true, true))}
  ${p.totalAvances > 0 ? section("Avances", d.avancesRows.map(r => row(r.label, r.val, true)).join("") + row("Total avances", p.totalAvances, true, true)) : ""}
  ${section("Indemnités", row("Transport", p.transport) + (p.primePanier > 0 ? row("Prime panier", p.primePanier) : "") + (p.indKilometrique > 0 ? row("Ind. kilométrique", p.indKilometrique) : ""))}
  <div style="border:2px solid #111827;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;margin:3px 0"><div style="font-size:10px;font-weight:900;color:#111827">NET À PAYER</div><div style="font-size:13px;font-weight:900;color:#111827">${fmtN(p.net)} FCFA</div></div>
  ${section("Charges patronales", d.chargesRows.map(r => row(r.label, r.val)).join("") + row("Total charges", p.chargesPat, false, true))}
  <div style="display:flex;justify-content:space-between;padding:2px 0;border-top:2px solid #111827;margin-top:2px"><span style="font-size:8px;font-weight:700">Masse salariale</span><span style="font-size:9px;font-weight:900">${fmtN(p.masse)} FCFA</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:4px 0 1px">${["Employeur", "Service RH", "Employé(e)"].map(s => `<div style="text-align:center"><div style="font-size:6px;color:#9ca3af;margin-bottom:10px">${s}</div><div style="border-top:1px solid #e5e7eb;padding-top:2px;font-size:6px;color:#d1d5db">Signature</div></div>`).join("")}</div>
</div>
<div style="margin-top:auto;padding-top:3px;border-top:1px solid #e5e7eb"><div style="text-align:center;font-size:7px;color:#9ca3af;line-height:1.3">${d.footerItems}</div><div style="text-align:center;font-size:6px;color:#d1d5db;margin-top:2px">G-SENPAIE · ${d.periode}</div></div>
</div>`;

  return pageWrap("", body, emp, d.periode);
}

// ════════════════════════════════════════════════════════════════
//  TEMPLATE 4: TABLEAU STRUCTURÉ
// ════════════════════════════════════════════════════════════════
function genTableau(g: GenParams): string {
  const d = commonData(g);
  const { emp, p, ent } = g;

  const tRow = (label: string, base: string, taux: string, sal: string, pat: string, opts: any = {}) => {
    const { bold = false, bg = "transparent", color = "#1f2937" } = opts;
    const s = `font-size:7px;padding:1px 3px;border:1px solid #cbd5e1;color:${color};font-weight:${bold ? 700 : 400};background:${bg}`;
    return `<tr><td style="${s}">${label}</td><td style="${s};text-align:right">${base}</td><td style="${s};text-align:center">${taux}</td><td style="${s};text-align:right">${sal}</td><td style="${s};text-align:right">${pat}</td></tr>`;
  };

  const headerLeft = `<div style="display:flex;align-items:center;gap:8px">${d.headerLogo}<div><div style="font-size:11px;font-weight:900;color:#fff">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:7px;color:#93c5fd;margin-top:1px">NINEA : ${ent.ninea}</div>` : ""}</div></div>`;

  const tableHeader = `<tr style="background:#1e3a5f;color:#fff"><th style="font-size:6px;padding:2px 3px;text-align:left;letter-spacing:1px">RUBRIQUE</th><th style="font-size:6px;padding:2px 3px;text-align:right">BASE</th><th style="font-size:6px;padding:2px 3px;text-align:center">TAUX</th><th style="font-size:6px;padding:2px 3px;text-align:right">PART SALARIÉ</th><th style="font-size:6px;padding:2px 3px;text-align:right">PART PATRONALE</th></tr>`;

  const body = `${printBar("Bulletin Tableau Structuré")}
<div class="page"><div class="content">
  <div style="background:#1e3a5f;color:#fff;padding:5px 8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;border-radius:2px">${headerLeft}<div style="text-align:right"><div style="font-size:10px;font-weight:900;letter-spacing:2px">BULLETIN DE PAIE</div><div style="font-size:8px;color:#93c5fd;margin-top:1px">${d.periode} · ${d.date_emission}</div></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #cbd5e1;margin-bottom:3px">${d.infoRows.map(([l, v], i) => `<div style="padding:1px 4px;font-size:7px;border-bottom:1px solid #e2e8f0;${i % 4 < 2 ? 'background:#f0f4f8' : ''}"><span style="color:#64748b;font-size:6px">${l}: </span><span style="font-weight:700">${v}</span></div>`).join("")}</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:2px">
    ${tableHeader}
    <tr style="background:#dbeafe"><td colspan="5" style="padding:1px 3px;font-size:6px;font-weight:700;color:#1e40af;letter-spacing:1px">ÉLÉMENTS DE SALAIRE</td></tr>
    ${tRow("Salaire de base", fmtN(p.salaireBase), "—", fmtN(p.salaireBase), "—", { bg: "#f8fafc" })}
    ${p.sursalaire > 0 ? tRow("Sursalaire", fmtN(p.sursalaire), "—", fmtN(p.sursalaire), "—") : ""}
    ${p.primeAnc > 0 ? tRow("Prime ancienneté", fmtN(p.brut), `${g.anc}%`, fmtN(p.primeAnc), "—", { bg: "#f8fafc" }) : ""}
    ${d.hsRows.map(r => tRow(r.label, "", "", fmtN(r.val), "—")).join("")}
    ${p.retAbsence > 0 ? tRow("Retenue absences", "", "", `– ${fmtN(p.retAbsence)}`, "—", { color: "#dc2626" }) : ""}
    ${tRow("SALAIRE BRUT", "", "", fmtN(p.brut), "", { bold: true, bg: "#dbeafe", color: "#1e40af" })}
    <tr style="background:#fee2e2"><td colspan="5" style="padding:1px 3px;font-size:6px;font-weight:700;color:#dc2626;letter-spacing:1px">RETENUES</td></tr>
    ${tRow("IR", fmtN(p.brut), "barème", `– ${fmtN(p.ir)}`, "—", { color: "#dc2626", bg: "#fef2f2" })}
    ${tRow("TRIMF", "", "barème", `– ${fmtN(p.trimf)}`, "—", { color: "#dc2626" })}
    ${tRow("IPRES R.G.", fmtN(Math.min(p.brut, 432000)), "5,6% / 8,4%", `– ${fmtN(p.ipresRG_s)}`, fmtN(p.ipresRG_p), { bg: "#fef2f2" })}
    ${p.ipresRC_s > 0 ? tRow("IPRES R.C.C.", "", "2,4% / 3,6%", `– ${fmtN(p.ipresRC_s)}`, fmtN(p.ipresRC_p)) : ""}
    ${p.ipm_s > 0 ? tRow("IPM", "", "50% / 50%", `– ${fmtN(p.ipm_s)}`, fmtN(p.ipm_p), { bg: "#fef2f2" }) : ""}
    ${tRow("CFCE", fmtN(p.brut), "3%", "—", fmtN(p.cfce))}
    ${tRow("CSS Alloc. Fam.", "", "7%", "—", fmtN(p.css_af), { bg: "#fef2f2" })}
    ${tRow("CSS Acc. Trav.", "", "1%", "—", fmtN(p.css_at))}
    ${tRow("TOTAL RETENUES", "", "", `– ${fmtN(p.totalRet)}`, fmtN(p.chargesPat), { bold: true, bg: "#fee2e2", color: "#dc2626" })}
    ${p.totalAvances > 0 ? `<tr style="background:#fef3c7"><td colspan="5" style="padding:1px 3px;font-size:6px;font-weight:700;color:#92400e;letter-spacing:1px">AVANCES & RETENUES DIVERSES</td></tr>` + d.avancesRows.map(r => tRow(r.label, "", "", `– ${fmtN(r.val)}`, "—", { color: "#92400e" })).join("") + tRow("TOTAL AVANCES", "", "", `– ${fmtN(p.totalAvances)}`, "—", { bold: true, bg: "#fef3c7", color: "#92400e" }) : ""}
    <tr style="background:#d1fae5"><td colspan="5" style="padding:1px 3px;font-size:6px;font-weight:700;color:#065f46;letter-spacing:1px">INDEMNITÉS</td></tr>
    ${tRow("Transport", "", "", fmtN(p.transport), "—", { bg: "#ecfdf5", color: "#065f46" })}
    ${p.primePanier > 0 ? tRow("Prime panier", "", "", fmtN(p.primePanier), "—", { color: "#065f46" }) : ""}
    ${p.indKilometrique > 0 ? tRow("Ind. kilométrique", "", "", fmtN(p.indKilometrique), "—", { bg: "#ecfdf5", color: "#065f46" }) : ""}
  </table>
  <div style="background:#1e3a5f;color:#fff;border-radius:2px;padding:3px 8px;display:flex;justify-content:space-between;align-items:center;margin:2px 0"><div style="font-size:10px;font-weight:900">NET À PAYER</div><div style="font-size:13px;font-weight:900">${fmtN(p.net)} FCFA</div></div>
  <div style="display:flex;justify-content:space-between;padding:2px 5px;background:#f0f4f8;border-radius:2px;margin-bottom:3px"><span style="font-size:8px;font-weight:700;color:#1e3a5f">MASSE SALARIALE</span><span style="font-size:9px;font-weight:900;color:#1e3a5f">${fmtN(p.masse)} FCFA</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:3px 0 1px">${["Employeur", "Service RH", "Employé(e)"].map(s => `<div style="text-align:center"><div style="font-size:6px;color:#64748b;margin-bottom:10px">${s}</div><div style="border-top:1px solid #cbd5e1;padding-top:2px;font-size:6px;color:#94a3b8">Signature & cachet</div></div>`).join("")}</div>
</div>
<div style="margin-top:auto;padding-top:3px;border-top:2px solid #1e3a5f"><div style="text-align:center;font-size:7px;color:#4b5563;line-height:1.3">${d.footerItems}</div><div style="text-align:center;font-size:6px;color:#94a3b8;margin-top:2px">G-SENPAIE · ${d.periode} · Confidentiel</div></div>
</div>`;

  return pageWrap("", body, emp, d.periode);
}

// ════════════════════════════════════════════════════════════════
//  TEMPLATE 5: ÉLÉGANT SÉNÉGALAIS
// ════════════════════════════════════════════════════════════════
function genSenegalais(g: GenParams): string {
  const d = commonData(g);
  const { emp, p, ent } = g;

  const row = (label: string, val: number, opts: any = {}) => {
    const { neg = false, bold = false, color = "#44403c" } = opts;
    return `<div style="display:flex;justify-content:space-between;padding:1px 0;${bold ? 'border-top:1px solid #d6d3d1;margin-top:1px;padding-top:2px' : ''}"><span style="font-size:8px;color:#78716c;font-weight:${bold ? 700 : 400}">${label}</span><span style="font-size:8px;color:${color};font-weight:${bold ? 800 : 500}">${neg ? '– ' : ''}${fmtN(val)} F</span></div>`;
  };

  const section = (title: string, icon: string, content: string) =>
    `<div style="margin-bottom:3px"><div style="display:flex;align-items:center;gap:3px;margin-bottom:1px"><span style="font-size:8px">${icon}</span><span style="font-size:6px;text-transform:uppercase;letter-spacing:2px;color:#92400e;font-weight:700">${title}</span></div>${content}</div>`;

  const headerLeft = `<div style="display:flex;align-items:center;gap:8px">${d.headerLogo}<div><div style="font-size:12px;font-weight:900;color:#fff;letter-spacing:1px">${ent.nom || "ENTREPRISE"}</div>${ent.ninea ? `<div style="font-size:7px;color:#fde68a;margin-top:1px">NINEA : ${ent.ninea}</div>` : ""}</div></div>`;

  const body = `${printBar("Bulletin Élégant Sénégalais")}
<div class="page"><div class="content">
  <div style="background:linear-gradient(135deg,#78350f,#92400e,#065f46);color:#fff;padding:5px 10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;border-radius:4px;border-bottom:2px solid #d97706">${headerLeft}<div style="text-align:right"><div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#fde68a">BULLETIN DE PAIE</div><div style="font-size:8px;color:#fef3c7;margin-top:1px">${d.periode}</div><div style="font-size:7px;color:#fde68a">${d.date_emission}</div></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;margin-bottom:3px;border:1px solid #d6d3d1;border-radius:2px;overflow:hidden">${d.infoRows.map(([l, v], i) => `<div style="padding:1.5px 5px;font-size:7px;${i % 4 < 2 ? 'background:#fffbeb' : 'background:#fff'}"><span style="color:#a8a29e;font-size:6px;display:block">${l}</span><span style="font-weight:700;color:#44403c">${v}</span></div>`).join("")}</div>
  ${section("Éléments de salaire", "💰", row("Salaire de base", p.salaireBase) + (p.sursalaire > 0 ? row("Sursalaire", p.sursalaire) : "") + (p.primeAnc > 0 ? row("Prime ancienneté", p.primeAnc) : "") + d.hsRows.map(r => row(r.label, r.val)).join("") + (p.retAbsence > 0 ? row("Retenue absences", p.retAbsence, { neg: true, color: "#dc2626" }) : "") + row("Salaire brut", p.brut, { bold: true, color: "#92400e" }))}
  ${section("Retenues salariales", "🔻", row("IR", p.ir, { neg: true, color: "#dc2626" }) + row("TRIMF", p.trimf, { neg: true, color: "#dc2626" }) + row("IPRES R.G.", p.ipresRG_s, { neg: true, color: "#dc2626" }) + (p.ipresRC_s > 0 ? row("IPRES R.C.C.", p.ipresRC_s, { neg: true, color: "#dc2626" }) : "") + (p.ipm_s > 0 ? row("IPM", p.ipm_s, { neg: true, color: "#dc2626" }) : "") + row("Total retenues", p.totalRet, { neg: true, bold: true, color: "#dc2626" }))}
  ${p.totalAvances > 0 ? section("Avances", "⚠️", d.avancesRows.map(r => row(r.label, r.val, { neg: true, color: "#b45309" })).join("") + row("Total avances", p.totalAvances, { neg: true, bold: true, color: "#b45309" })) : ""}
  ${section("Indemnités", "🚌", row("Transport", p.transport, { color: "#065f46" }) + (p.primePanier > 0 ? row("Prime panier", p.primePanier, { color: "#065f46" }) : "") + (p.indKilometrique > 0 ? row("Ind. kilométrique", p.indKilometrique, { color: "#065f46" }) : ""))}
  <div style="background:linear-gradient(135deg,#78350f,#d97706);border-radius:4px;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;margin:3px 0;border:2px solid #fbbf24"><div><div style="font-size:10px;font-weight:900;color:#fff">NET À PAYER</div><div style="font-size:7px;color:#fde68a;margin-top:1px">${d.periode}</div></div><div style="font-size:13px;font-weight:900;color:#fde68a">${fmtN(p.net)} FCFA</div></div>
  ${section("Charges patronales", "📊", d.chargesRows.map(r => row(r.label, r.val)).join("") + row("Total charges", p.chargesPat, { bold: true, color: "#92400e" }))}
  <div style="background:#fffbeb;border:1px solid #d97706;border-radius:2px;padding:2px 6px;display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><span style="font-size:8px;font-weight:700;color:#78350f">MASSE SALARIALE</span><span style="font-size:10px;font-weight:900;color:#d97706">${fmtN(p.masse)} FCFA</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:3px 0 1px">${["Employeur", "Service RH", "Employé(e)"].map(s => `<div style="text-align:center"><div style="font-size:6px;color:#a8a29e;margin-bottom:10px">${s}</div><div style="border-top:1px solid #d6d3d1;padding-top:2px;font-size:6px;color:#d6d3d1">Signature & cachet</div></div>`).join("")}</div>
</div>
<div style="margin-top:auto;padding-top:3px;border-top:2px solid #d97706"><div style="text-align:center;font-size:7px;color:#78716c;line-height:1.3">${d.footerItems}</div><div style="text-align:center;font-size:6px;color:#a8a29e;margin-top:2px">🌿 G-SENPAIE · ${d.periode} · Confidentiel</div></div>
</div>`;

  return pageWrap("", body, emp, d.periode);
}

// ════════════════════════════════════════════════════════════════
//  EXPORT: Generate bulletin by template ID
// ════════════════════════════════════════════════════════════════
export function genererBulletinParTemplate(
  templateId: BulletinTemplateId | undefined,
  emp: Employee, p: PayrollResult, mois: number, annee: number, anc: number, ent: Entreprise
): string {
  const g: GenParams = { emp, p, mois, annee, anc, ent };
  switch (templateId) {
    case "moderne": return genModerne(g);
    case "minimaliste": return genMinimaliste(g);
    case "tableau": return genTableau(g);
    case "senegalais": return genSenegalais(g);
    case "classique":
    default: return genClassique(g);
  }
}
