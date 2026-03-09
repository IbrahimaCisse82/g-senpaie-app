import { useState } from "react";
import type { Employee, PayrollParams, PayrollResult } from "@/lib/payroll";
import { calculerPaie, fmt, MOIS } from "@/lib/payroll";
import type { Entreprise } from "@/lib/payroll";
import { Modal } from "./Modal";

interface RapportCotisationsModalProps {
  employees: Employee[];
  params: PayrollParams;
  entreprise: Entreprise;
  onClose: () => void;
}

interface PeriodeTotaux {
  mois: number;
  annee: number;
  brut: number;
  ir: number;
  trimf: number;
  ipresRG: number;
  ipresRC: number;
  css: number;
  cfce: number;
  ipm: number;
  totalRet: number;
  chargesPat: number;
  net: number;
  masse: number;
}

function calculerPeriodeTotaux(
  employees: Employee[],
  params: PayrollParams,
  moisDebut: number,
  anneeDebut: number,
  moisFin: number,
  anneeFin: number
): PeriodeTotaux[] {
  const result: PeriodeTotaux[] = [];
  let m = moisDebut;
  let a = anneeDebut;

  while (a < anneeFin || (a === anneeFin && m <= moisFin)) {
    const refDate = new Date(a, m + 1, 0);
    const paies = employees.map((e) => calculerPaie(e, params, refDate));

    result.push({
      mois: m,
      annee: a,
      brut: paies.reduce((s, p) => s + p.brut, 0),
      ir: paies.reduce((s, p) => s + p.ir, 0),
      trimf: paies.reduce((s, p) => s + p.trimf, 0),
      ipresRG: paies.reduce((s, p) => s + p.ipresRG_s + p.ipresRG_p, 0),
      ipresRC: paies.reduce((s, p) => s + p.ipresRC_s + p.ipresRC_p, 0),
      css: paies.reduce((s, p) => s + p.css_af + p.css_at, 0),
      cfce: paies.reduce((s, p) => s + p.cfce, 0),
      ipm: paies.reduce((s, p) => s + p.ipm_s + p.ipm_p, 0),
      totalRet: paies.reduce((s, p) => s + p.totalRet, 0),
      chargesPat: paies.reduce((s, p) => s + p.chargesPat, 0),
      net: paies.reduce((s, p) => s + p.net, 0),
      masse: paies.reduce((s, p) => s + p.masse, 0),
    });

    m++;
    if (m > 11) { m = 0; a++; }
  }
  return result;
}

function sumTotaux(rows: PeriodeTotaux[]) {
  return rows.reduce(
    (acc, r) => ({
      brut: acc.brut + r.brut,
      ir: acc.ir + r.ir,
      trimf: acc.trimf + r.trimf,
      ipresRG: acc.ipresRG + r.ipresRG,
      ipresRC: acc.ipresRC + r.ipresRC,
      css: acc.css + r.css,
      cfce: acc.cfce + r.cfce,
      ipm: acc.ipm + r.ipm,
      totalRet: acc.totalRet + r.totalRet,
      chargesPat: acc.chargesPat + r.chargesPat,
      net: acc.net + r.net,
      masse: acc.masse + r.masse,
    }),
    { brut: 0, ir: 0, trimf: 0, ipresRG: 0, ipresRC: 0, css: 0, cfce: 0, ipm: 0, totalRet: 0, chargesPat: 0, net: 0, masse: 0 }
  );
}

function exportRapportCSV(rows: PeriodeTotaux[], totals: ReturnType<typeof sumTotaux>) {
  const headers = ["Période", "Brut", "IR", "TRIMF", "IPRES RG", "IPRES RC", "CSS", "CFCE", "IPM", "Ret. Sal.", "Ch. Pat.", "Net", "Masse"];
  const csvRows = rows.map((r) => [
    `${MOIS[r.mois]} ${r.annee}`,
    Math.round(r.brut), Math.round(r.ir), Math.round(r.trimf),
    Math.round(r.ipresRG), Math.round(r.ipresRC), Math.round(r.css),
    Math.round(r.cfce), Math.round(r.ipm), Math.round(r.totalRet),
    Math.round(r.chargesPat), Math.round(r.net), Math.round(r.masse),
  ]);
  const totRow = [
    "TOTAUX",
    Math.round(totals.brut), Math.round(totals.ir), Math.round(totals.trimf),
    Math.round(totals.ipresRG), Math.round(totals.ipresRC), Math.round(totals.css),
    Math.round(totals.cfce), Math.round(totals.ipm), Math.round(totals.totalRet),
    Math.round(totals.chargesPat), Math.round(totals.net), Math.round(totals.masse),
  ];
  const csv = [headers, ...csvRows, totRow].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport_cotisations_${rows[0]?.annee || ""}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function genererRapportHTML(
  rows: PeriodeTotaux[],
  totals: ReturnType<typeof sumTotaux>,
  entreprise: Entreprise,
  nbEmployees: number,
  periodeLabel: string
): string {
  const fmtN = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
  const date_emission = new Date().toLocaleDateString("fr-FR");

  const headerLogo = entreprise.logo
    ? `<img src="${entreprise.logo}" alt="logo" style="height:48px;max-width:120px;object-fit:contain"/>`
    : `<div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px">🏢</div>`;

  const tableRows = rows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"}">
      <td style="padding:6px 10px;font-weight:600;font-size:11px;border-bottom:1px solid #e5e7eb">${MOIS[r.mois]} ${r.annee}</td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;border-bottom:1px solid #e5e7eb">${fmtN(r.brut)}</td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;border-bottom:1px solid #e5e7eb;color:#dc2626">${fmtN(r.ir)}</td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;border-bottom:1px solid #e5e7eb;color:#dc2626">${fmtN(r.trimf)}</td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;border-bottom:1px solid #e5e7eb;color:#2563eb">${fmtN(r.ipresRG)}</td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;border-bottom:1px solid #e5e7eb;color:#2563eb">${fmtN(r.ipresRC)}</td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;border-bottom:1px solid #e5e7eb;color:#d97706">${fmtN(r.css)}</td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;border-bottom:1px solid #e5e7eb;color:#7c3aed">${fmtN(r.cfce)}</td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;border-bottom:1px solid #e5e7eb">${fmtN(r.ipm)}</td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;border-bottom:1px solid #e5e7eb;font-weight:700;color:#064e3b">${fmtN(r.masse)}</td>
    </tr>
  `).join("");

  const footerItems = [
    entreprise.adresse && `📍 ${entreprise.adresse}`,
    entreprise.telephone && `📞 ${entreprise.telephone}`,
    entreprise.email && `✉ ${entreprise.email}`,
    entreprise.ninea && `NINEA : ${entreprise.ninea}`,
    entreprise.rccm && `RCCM : ${entreprise.rccm}`,
  ].filter(Boolean).join(" | ");

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Cotisations – ${periodeLabel}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:12px;color:#1f2937;background:#fff}
.page{width:297mm;min-height:210mm;margin:0 auto;padding:12mm 14mm}
.header{background:#064e3b;color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-radius:6px}
table{width:100%;border-collapse:collapse}
.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
.sum-card{border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px}
.sum-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
.sum-val{font-size:16px;font-weight:800;margin-top:4px}
.footer{margin-top:20px;padding-top:10px;border-top:2px solid #10b981;text-align:center;font-size:9px;color:#6b7280}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:8mm 10mm}.no-print{display:none!important}}
@page{size:A4 landscape;margin:8mm}
</style></head><body>
<div class="no-print" style="background:#1f2937;color:#fff;padding:10px 20px;text-align:center;font-size:13px;position:sticky;top:0;z-index:99;display:flex;align-items:center;justify-content:center;gap:16px">
  <span>📊 Rapport de cotisations prêt à imprimer</span>
  <button onclick="window.print()" style="background:#10b981;color:#fff;border:none;padding:8px 22px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer">🖨️ Enregistrer en PDF</button>
</div>
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:14px">
      ${headerLogo}
      <div>
        <div style="font-size:16px;font-weight:900;letter-spacing:1px">${entreprise.nom || "ENTREPRISE"}</div>
        ${entreprise.ninea ? `<div style="font-size:9px;color:#a7f3d0;margin-top:2px">NINEA : ${entreprise.ninea}</div>` : ""}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:15px;font-weight:900">RAPPORT DE COTISATIONS</div>
      <div style="font-size:11px;color:#a7f3d0;margin-top:3px">Période : <b>${periodeLabel}</b></div>
      <div style="font-size:9px;color:#6ee7b7;margin-top:2px">Émis le : ${date_emission} · ${nbEmployees} employé(s)</div>
    </div>
  </div>

  <div class="summary">
    <div class="sum-card"><div class="sum-label">Total Brut</div><div class="sum-val" style="color:#064e3b">${fmtN(totals.brut)} F</div></div>
    <div class="sum-card"><div class="sum-label">Total Retenues Sal.</div><div class="sum-val" style="color:#dc2626">${fmtN(totals.totalRet)} F</div></div>
    <div class="sum-card"><div class="sum-label">Total Charges Pat.</div><div class="sum-val" style="color:#d97706">${fmtN(totals.chargesPat)} F</div></div>
    <div class="sum-card"><div class="sum-label">Masse Salariale</div><div class="sum-val" style="color:#7c3aed">${fmtN(totals.masse)} F</div></div>
  </div>

  <table>
    <thead>
      <tr style="background:#f3f4f6">
        <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6b7280;border-bottom:2px solid #d1d5db">Période</th>
        <th style="padding:8px 8px;text-align:right;font-size:10px;color:#6b7280;border-bottom:2px solid #d1d5db">Brut</th>
        <th style="padding:8px 8px;text-align:right;font-size:10px;color:#dc2626;border-bottom:2px solid #d1d5db">IR</th>
        <th style="padding:8px 8px;text-align:right;font-size:10px;color:#dc2626;border-bottom:2px solid #d1d5db">TRIMF</th>
        <th style="padding:8px 8px;text-align:right;font-size:10px;color:#2563eb;border-bottom:2px solid #d1d5db">IPRES RG</th>
        <th style="padding:8px 8px;text-align:right;font-size:10px;color:#2563eb;border-bottom:2px solid #d1d5db">IPRES RC</th>
        <th style="padding:8px 8px;text-align:right;font-size:10px;color:#d97706;border-bottom:2px solid #d1d5db">CSS</th>
        <th style="padding:8px 8px;text-align:right;font-size:10px;color:#7c3aed;border-bottom:2px solid #d1d5db">CFCE</th>
        <th style="padding:8px 8px;text-align:right;font-size:10px;color:#6b7280;border-bottom:2px solid #d1d5db">IPM</th>
        <th style="padding:8px 8px;text-align:right;font-size:10px;color:#064e3b;border-bottom:2px solid #d1d5db">Masse</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
      <tr style="background:#ecfdf5;border-top:2px solid #10b981">
        <td style="padding:8px 10px;font-weight:800;font-size:12px;color:#064e3b">TOTAUX</td>
        <td style="padding:8px 8px;text-align:right;font-weight:800;font-size:12px;color:#064e3b">${fmtN(totals.brut)}</td>
        <td style="padding:8px 8px;text-align:right;font-weight:800;font-size:12px;color:#dc2626">${fmtN(totals.ir)}</td>
        <td style="padding:8px 8px;text-align:right;font-weight:800;font-size:12px;color:#dc2626">${fmtN(totals.trimf)}</td>
        <td style="padding:8px 8px;text-align:right;font-weight:800;font-size:12px;color:#2563eb">${fmtN(totals.ipresRG)}</td>
        <td style="padding:8px 8px;text-align:right;font-weight:800;font-size:12px;color:#2563eb">${fmtN(totals.ipresRC)}</td>
        <td style="padding:8px 8px;text-align:right;font-weight:800;font-size:12px;color:#d97706">${fmtN(totals.css)}</td>
        <td style="padding:8px 8px;text-align:right;font-weight:800;font-size:12px;color:#7c3aed">${fmtN(totals.cfce)}</td>
        <td style="padding:8px 8px;text-align:right;font-weight:800;font-size:12px">${fmtN(totals.ipm)}</td>
        <td style="padding:8px 8px;text-align:right;font-weight:800;font-size:12px;color:#064e3b">${fmtN(totals.masse)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div>${footerItems}</div>
    <div style="margin-top:6px;color:#9ca3af">Document généré par G-SENPAIE · ${date_emission}</div>
  </div>
</div></body></html>`;
}

export function RapportCotisationsModal({ employees, params, entreprise, onClose }: RapportCotisationsModalProps) {
  const now = new Date();
  const [moisDebut, setMoisDebut] = useState(0);
  const [anneeDebut, setAnneeDebut] = useState(now.getFullYear());
  const [moisFin, setMoisFin] = useState(now.getMonth());
  const [anneeFin, setAnneeFin] = useState(now.getFullYear());

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - i);

  // Validate period
  const isValid = anneeDebut < anneeFin || (anneeDebut === anneeFin && moisDebut <= moisFin);

  const rows = isValid ? calculerPeriodeTotaux(employees, params, moisDebut, anneeDebut, moisFin, anneeFin) : [];
  const totals = sumTotaux(rows);

  const periodeLabel = `${MOIS[moisDebut]} ${anneeDebut} → ${MOIS[moisFin]} ${anneeFin}`;

  const openPDF = () => {
    const html = genererRapportHTML(rows, totals, entreprise, employees.length, periodeLabel);
    const win = window.open("", "_blank");
    if (!win) { alert("Veuillez autoriser les popups pour ce site."); return; }
    win.document.write(html);
    win.document.close();
  };

  const headers = ["Période", "Brut", "IR", "TRIMF", "IPRES RG", "IPRES RC", "CSS", "CFCE", "IPM", "Masse"];

  return (
    <Modal title="📊 Rapport de Cotisations" onClose={onClose} width={900}>
      {/* Period selector */}
      <div className="flex flex-wrap gap-3 items-end mb-5 p-4 bg-background rounded-lg border border-border">
        <div>
          <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">De</div>
          <div className="flex gap-1.5">
            <select value={moisDebut} onChange={(e) => setMoisDebut(+e.target.value)}
              className="py-1.5 px-2 bg-background border border-border rounded-lg text-foreground text-[12px] font-mono outline-none">
              {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={anneeDebut} onChange={(e) => setAnneeDebut(+e.target.value)}
              className="py-1.5 px-2 bg-background border border-border rounded-lg text-foreground text-[12px] font-mono outline-none w-20">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="text-muted-foreground text-lg font-bold pb-1">→</div>
        <div>
          <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">À</div>
          <div className="flex gap-1.5">
            <select value={moisFin} onChange={(e) => setMoisFin(+e.target.value)}
              className="py-1.5 px-2 bg-background border border-border rounded-lg text-foreground text-[12px] font-mono outline-none">
              {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={anneeFin} onChange={(e) => setAnneeFin(+e.target.value)}
              className="py-1.5 px-2 bg-background border border-border rounded-lg text-foreground text-[12px] font-mono outline-none w-20">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          <button onClick={() => exportRapportCSV(rows, totals)} disabled={!isValid}
            className="px-3 py-2 bg-transparent border border-primary text-primary rounded-lg font-bold text-[12px] cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed">
            📥 CSV
          </button>
          <button onClick={openPDF} disabled={!isValid}
            className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[12px] cursor-pointer border-none whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed">
            ⬇️ PDF
          </button>
        </div>
      </div>

      {!isValid && (
        <div className="text-destructive text-xs text-center py-4 bg-destructive/10 rounded-lg mb-4">
          ⚠️ La date de début doit être antérieure ou égale à la date de fin.
        </div>
      )}

      {isValid && rows.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="text-muted-foreground text-[10px] uppercase">Total Brut</div>
              <div className="text-primary font-extrabold text-sm mt-1">{fmt(totals.brut)} F</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="text-muted-foreground text-[10px] uppercase">Retenues Sal.</div>
              <div className="text-destructive font-extrabold text-sm mt-1">{fmt(totals.totalRet)} F</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="text-muted-foreground text-[10px] uppercase">Charges Pat.</div>
              <div className="text-senpaie-yellow font-extrabold text-sm mt-1">{fmt(totals.chargesPat)} F</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="text-muted-foreground text-[10px] uppercase">Masse Salariale</div>
              <div className="text-senpaie-purple font-extrabold text-sm mt-1">{fmt(totals.masse)} F</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-background">
                  {headers.map((h) => (
                    <th key={h} className={`py-2.5 px-3 text-muted-foreground font-semibold border-b border-border whitespace-nowrap ${h === "Période" ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.mois}-${r.annee}`} className={i % 2 === 0 ? "bg-card" : "bg-senpaie-alt-row"}>
                    <td className="py-2.5 px-3 text-left text-foreground font-bold">{MOIS[r.mois]} {r.annee}</td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground">{fmt(r.brut)} F</td>
                    <td className="py-2.5 px-3 text-right text-destructive">{fmt(r.ir)} F</td>
                    <td className="py-2.5 px-3 text-right text-destructive">{fmt(r.trimf)} F</td>
                    <td className="py-2.5 px-3 text-right text-senpaie-blue">{fmt(r.ipresRG)} F</td>
                    <td className="py-2.5 px-3 text-right text-senpaie-blue">{fmt(r.ipresRC)} F</td>
                    <td className="py-2.5 px-3 text-right text-senpaie-yellow">{fmt(r.css)} F</td>
                    <td className="py-2.5 px-3 text-right text-senpaie-purple">{fmt(r.cfce)} F</td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground">{fmt(r.ipm)} F</td>
                    <td className="py-2.5 px-3 text-right text-primary font-bold">{fmt(r.masse)} F</td>
                  </tr>
                ))}
                <tr className="bg-primary/10 border-t-2 border-primary">
                  <td className="py-3 px-3 text-left text-primary font-extrabold">TOTAUX</td>
                  <td className="py-3 px-3 text-right text-primary font-extrabold">{fmt(totals.brut)} F</td>
                  <td className="py-3 px-3 text-right text-destructive font-extrabold">{fmt(totals.ir)} F</td>
                  <td className="py-3 px-3 text-right text-destructive font-extrabold">{fmt(totals.trimf)} F</td>
                  <td className="py-3 px-3 text-right text-senpaie-blue font-extrabold">{fmt(totals.ipresRG)} F</td>
                  <td className="py-3 px-3 text-right text-senpaie-blue font-extrabold">{fmt(totals.ipresRC)} F</td>
                  <td className="py-3 px-3 text-right text-senpaie-yellow font-extrabold">{fmt(totals.css)} F</td>
                  <td className="py-3 px-3 text-right text-senpaie-purple font-extrabold">{fmt(totals.cfce)} F</td>
                  <td className="py-3 px-3 text-right text-primary font-extrabold">{fmt(totals.ipm)} F</td>
                  <td className="py-3 px-3 text-right text-primary font-extrabold">{fmt(totals.masse)} F</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-muted-foreground text-[10px] text-center">
            {rows.length} mois · {employees.length} employé(s) · Émis le {new Date().toLocaleDateString("fr-FR")}
          </div>
        </>
      )}
    </Modal>
  );
}
