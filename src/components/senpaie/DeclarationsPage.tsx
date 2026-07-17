import { useState, useMemo } from "react";
import type { Employee, PayrollParams, PayrollResult, Entreprise } from "@/lib/payroll";
import { calculerPaie, fmt, MOIS } from "@/lib/payroll";
import { exportHtmlToPdf, exportRowsToCsv } from "@/lib/pdfExport";
import type { PayrollSnapshot } from "@/hooks/useSupabaseData";

interface Props {
  employees: Employee[];
  params: PayrollParams;
  entreprise: Entreprise;
  history: PayrollSnapshot[];
}

type SubTab = "ipres" | "livre" | "dads";

export function DeclarationsPage({ employees, params, entreprise }: Props) {
  const now = new Date();
  const [tab, setTab] = useState<SubTab>("ipres");
  const [mois, setMois] = useState(now.getMonth());
  const [annee, setAnnee] = useState(now.getFullYear());
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const refDate = new Date(annee, mois + 1, 0);
  const rows = useMemo(
    () => employees.map((e) => ({ emp: e, p: calculerPaie(e, params, refDate) })),
    [employees, params, mois, annee]
  );

  const totaux = rows.reduce(
    (s, r) => ({
      brut: s.brut + r.p.brut,
      ipresRG_s: s.ipresRG_s + r.p.ipresRG_s,
      ipresRG_p: s.ipresRG_p + r.p.ipresRG_p,
      ipresRC_s: s.ipresRC_s + r.p.ipresRC_s,
      ipresRC_p: s.ipresRC_p + r.p.ipresRC_p,
      css_af: s.css_af + r.p.css_af,
      css_at: s.css_at + r.p.css_at,
      ir: s.ir + r.p.ir,
      trimf: s.trimf + r.p.trimf,
      cfce: s.cfce + r.p.cfce,
      net: s.net + r.p.net,
    }),
    { brut: 0, ipresRG_s: 0, ipresRG_p: 0, ipresRC_s: 0, ipresRC_p: 0, css_af: 0, css_at: 0, ir: 0, trimf: 0, cfce: 0, net: 0 }
  );

  // ── Export IPRES Excel
  const exportIPRESExcel = () => {
    const header = ["Matricule", "Nom", "Prénom", "Statut", "Salaire brut", "Base IPRES RG", "RG salarié (5,6%)", "RG patronal (8,4%)", "RC salarié (2,4%)", "RC patronal (3,6%)", "CSS AF (7%)", "CSS AT (1%)"];
      const body = rows.map((r) => [
        r.emp.matricule, r.emp.nom, r.emp.prenom, r.emp.statut,
        Math.round(r.p.brut),
        Math.round(Math.min(r.p.brut, params.IPRES_RG.plafond || r.p.brut)),
        Math.round(r.p.ipresRG_s), Math.round(r.p.ipresRG_p),
        Math.round(r.p.ipresRC_s), Math.round(r.p.ipresRC_p),
        Math.round(r.p.css_af), Math.round(r.p.css_at),
      ]);
    const totLine = ["TOTAUX", "", "", "", Math.round(totaux.brut), "", Math.round(totaux.ipresRG_s), Math.round(totaux.ipresRG_p), Math.round(totaux.ipresRC_s), Math.round(totaux.ipresRC_p), Math.round(totaux.css_af), Math.round(totaux.css_at)];
    exportRowsToCsv([header, ...body, [], totLine], `declaration_ipres_${MOIS[mois]}_${annee}.csv`);
  };

  const exportIPRESPdf = async () => {
    const html = `<div class="page" style="font-family:Arial,sans-serif;padding:30px;color:#111;background:#fff;width:734px;">
      <div style="text-align:center;margin-bottom:25px;">
        <h1 style="margin:0;font-size:18px;">DÉCLARATION MENSUELLE IPRES / CSS</h1>
        <div style="font-size:11px;margin-top:5px;">${entreprise.nom || "—"} ${entreprise.ninea ? "· NINEA " + entreprise.ninea : ""}</div>
        <div style="font-size:13px;font-weight:bold;margin-top:5px;">Période : ${MOIS[mois]} ${annee}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:9px;">
        <thead><tr style="background:#f0f0f0;font-weight:bold;">
          <th style="border:1px solid #999;padding:4px;">Matricule</th>
          <th style="border:1px solid #999;padding:4px;">Nom & Prénom</th>
          <th style="border:1px solid #999;padding:4px;">Brut</th>
          <th style="border:1px solid #999;padding:4px;">RG sal.</th>
          <th style="border:1px solid #999;padding:4px;">RG pat.</th>
          <th style="border:1px solid #999;padding:4px;">RC sal.</th>
          <th style="border:1px solid #999;padding:4px;">RC pat.</th>
          <th style="border:1px solid #999;padding:4px;">CSS AF</th>
          <th style="border:1px solid #999;padding:4px;">CSS AT</th>
        </tr></thead><tbody>
        ${rows.map((r) => `<tr>
          <td style="border:1px solid #999;padding:3px;">${r.emp.matricule}</td>
          <td style="border:1px solid #999;padding:3px;">${r.emp.nom} ${r.emp.prenom}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.brut)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ipresRG_s)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ipresRG_p)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ipresRC_s)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ipresRC_p)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.css_af)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.css_at)}</td>
        </tr>`).join("")}
        <tr style="background:#f0f0f0;font-weight:bold;">
          <td colspan="2" style="border:1px solid #999;padding:4px;">TOTAUX</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.brut)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRG_s)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRG_p)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRC_s)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRC_p)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.css_af)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.css_at)}</td>
        </tr>
      </tbody></table>
      <div style="margin-top:25px;display:flex;justify-content:space-between;font-size:11px;">
        <div><b>Total à verser IPRES :</b> ${fmt(totaux.ipresRG_s + totaux.ipresRG_p + totaux.ipresRC_s + totaux.ipresRC_p)} FCFA</div>
        <div><b>Total à verser CSS :</b> ${fmt(totaux.css_af + totaux.css_at)} FCFA</div>
      </div>
      <div style="margin-top:40px;font-size:10px;">Fait à ${entreprise.adresse || "Dakar"}, le ${new Date().toLocaleDateString("fr-FR")}<br/><br/>Signature & cachet de l'employeur</div>
    </div>`;
    await exportHtmlToPdf(html, `declaration_ipres_${MOIS[mois]}_${annee}.pdf`);
  };

  // ── Livre de paie PDF (chronologique conforme art. L.116)
  const exportLivrePaie = async () => {
    const html = `<div class="page" style="font-family:Arial,sans-serif;padding:25px;color:#111;background:#fff;width:744px;">
      <div style="text-align:center;margin-bottom:20px;">
        <h1 style="margin:0;font-size:17px;">LIVRE DE PAIE</h1>
        <div style="font-size:10px;">Registre obligatoire — Art. L.116 du Code du Travail (Sénégal)</div>
        <div style="font-size:12px;margin-top:6px;"><b>${entreprise.nom || "—"}</b>${entreprise.ninea ? " · NINEA " + entreprise.ninea : ""}${entreprise.rccm ? " · RCCM " + entreprise.rccm : ""}</div>
        <div style="font-size:12px;font-weight:bold;margin-top:4px;">Période : ${MOIS[mois]} ${annee}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:8.5px;">
        <thead><tr style="background:#222;color:#fff;">
          <th style="border:1px solid #444;padding:4px;">Mat.</th>
          <th style="border:1px solid #444;padding:4px;">Nom & Prénom</th>
          <th style="border:1px solid #444;padding:4px;">Emploi</th>
          <th style="border:1px solid #444;padding:4px;">Brut</th>
          <th style="border:1px solid #444;padding:4px;">IR+TRIMF</th>
          <th style="border:1px solid #444;padding:4px;">Cot. sal.</th>
          <th style="border:1px solid #444;padding:4px;">Net payé</th>
          <th style="border:1px solid #444;padding:4px;">Charges pat.</th>
          <th style="border:1px solid #444;padding:4px;">Émargement</th>
        </tr></thead><tbody>
        ${rows.map((r) => `<tr>
          <td style="border:1px solid #999;padding:3px;">${r.emp.matricule}</td>
          <td style="border:1px solid #999;padding:3px;">${r.emp.nom} ${r.emp.prenom}</td>
          <td style="border:1px solid #999;padding:3px;">${r.emp.fonction}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.brut)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ir + r.p.trimf)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ipresRG_s + r.p.ipresRC_s + r.p.ipm_s)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;font-weight:bold;">${fmt(r.p.net)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.chargesPat)}</td>
          <td style="border:1px solid #999;padding:3px;width:80px;"></td>
        </tr>`).join("")}
        <tr style="background:#eee;font-weight:bold;">
          <td colspan="3" style="border:1px solid #999;padding:4px;">TOTAUX (${rows.length} salariés)</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.brut)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ir + totaux.trimf)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRG_s + totaux.ipresRC_s)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.net)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRG_p + totaux.ipresRC_p + totaux.css_af + totaux.css_at + totaux.cfce)}</td>
          <td style="border:1px solid #999;"></td>
        </tr>
      </tbody></table>
      <div style="margin-top:30px;font-size:10px;">Arrêté à la somme de <b>${fmt(totaux.net)} FCFA</b> (net) · Charges patronales <b>${fmt(totaux.ipresRG_p + totaux.ipresRC_p + totaux.css_af + totaux.css_at + totaux.cfce)} FCFA</b><br/><br/>Fait à ${entreprise.adresse || "Dakar"}, le ${new Date().toLocaleDateString("fr-FR")}<br/><br/>Signature de l'employeur</div>
    </div>`;
    await exportHtmlToPdf(html, `livre_paie_${MOIS[mois]}_${annee}.pdf`, { orientation: "landscape" });
  };

  // ── DADS annuelle
  const dadsRows = useMemo(() => {
    return employees.map((e) => {
      // Cumul annuel approché : on multiplie par 12 le calcul mensuel
      const p = calculerPaie(e, params, new Date(annee, 11, 31));
      return {
        emp: e,
        brutAnnuel: p.brut * 12,
        irAnnuel: p.ir * 12,
        ipresAnnuel: (p.ipresRG_s + p.ipresRC_s) * 12,
        cssAnnuel: (p.css_af + p.css_at) * 12,
      };
    });
  }, [employees, params, annee]);

  const exportDADS = () => {
    const header = ["Matricule", "Nom", "Prénom", "Date entrée", "Date sortie", "Brut annuel", "IR annuel", "Cotis IPRES (salarié)", "CSS (patronal)"];
    const body = dadsRows.map((r) => [
      r.emp.matricule, r.emp.nom, r.emp.prenom, r.emp.dateEntree, r.emp.dateSortie || "",
      Math.round(r.brutAnnuel), Math.round(r.irAnnuel), Math.round(r.ipresAnnuel), Math.round(r.cssAnnuel),
    ]);
    exportRowsToCsv([header, ...body], `dads_${annee}.csv`);
  };

  // ── DADS XML (format structuré importable)
  const exportDADSXml = () => {
    const esc = (s: string) => String(s ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
    const totalBrut = Math.round(dadsRows.reduce((s, r) => s + r.brutAnnuel, 0));
    const totalIR = Math.round(dadsRows.reduce((s, r) => s + r.irAnnuel, 0));
    const totalIpres = Math.round(dadsRows.reduce((s, r) => s + r.ipresAnnuel, 0));
    const totalCss = Math.round(dadsRows.reduce((s, r) => s + r.cssAnnuel, 0));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DADS annee="${annee}">
  <Employeur>
    <RaisonSociale>${esc(entreprise.nom || "")}</RaisonSociale>
    <NINEA>${esc(entreprise.ninea || "")}</NINEA>
    <RCCM>${esc(entreprise.rccm || "")}</RCCM>
    <Adresse>${esc(entreprise.adresse || "")}</Adresse>
  </Employeur>
  <Salaries nb="${dadsRows.length}">
${dadsRows.map((r) => `    <Salarie>
      <Matricule>${esc(r.emp.matricule)}</Matricule>
      <Nom>${esc(r.emp.nom)}</Nom>
      <Prenom>${esc(r.emp.prenom)}</Prenom>
      <DateEntree>${esc(r.emp.dateEntree)}</DateEntree>
      <DateSortie>${esc(r.emp.dateSortie || "")}</DateSortie>
      <SalaireBrutAnnuel>${Math.round(r.brutAnnuel)}</SalaireBrutAnnuel>
      <IRAnnuel>${Math.round(r.irAnnuel)}</IRAnnuel>
      <IpresSalarie>${Math.round(r.ipresAnnuel)}</IpresSalarie>
      <CssPatronal>${Math.round(r.cssAnnuel)}</CssPatronal>
    </Salarie>`).join("\n")}
  </Salaries>
  <Totaux>
    <BrutAnnuel>${totalBrut}</BrutAnnuel>
    <IRAnnuel>${totalIR}</IRAnnuel>
    <IpresSalarie>${totalIpres}</IpresSalarie>
    <CssPatronal>${totalCss}</CssPatronal>
  </Totaux>
</DADS>`;
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `dads_${annee}.xml`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-foreground text-xl font-extrabold mb-1">Déclarations légales</h1>
        <div className="text-muted-foreground text-[11px]">Obligations mensuelles IPRES/CSS, livre de paie chronologique et DADS annuelle.</div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-border">
        {([
          ["ipres", "🏛️ IPRES / CSS mensuel"],
          ["livre", "📖 Livre de paie"],
          ["dads", "📅 DADS annuelle"],
        ] as [SubTab, string][]).map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-[12px] font-bold cursor-pointer border-b-2 ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-center">
        {tab !== "dads" && (
          <>
            <span className="text-muted-foreground text-[11px] uppercase font-bold">Mois</span>
            <select value={mois} onChange={(e) => setMois(+e.target.value)} className="py-1.5 px-2.5 bg-background border border-border rounded-lg text-foreground text-[13px] font-mono">
              {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </>
        )}
        <span className="text-muted-foreground text-[11px] uppercase font-bold">Année</span>
        <select value={annee} onChange={(e) => setAnnee(+e.target.value)} className="py-1.5 px-2.5 bg-background border border-border rounded-lg text-foreground text-[13px] font-mono w-24">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex-1" />
        {tab === "ipres" && (
          <>
            <button onClick={exportIPRESExcel} className="px-3 py-2 bg-transparent border border-primary text-primary rounded-lg font-bold text-[12px]">📥 Excel</button>
            <button onClick={exportIPRESPdf} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[12px]">⬇️ PDF</button>
          </>
        )}
        {tab === "livre" && <button onClick={exportLivrePaie} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[12px]">⬇️ PDF Livre de Paie</button>}
        {tab === "dads" && (
          <>
            <button onClick={exportDADS} className="px-3 py-2 bg-transparent border border-primary text-primary rounded-lg font-bold text-[12px]">📥 CSV DADS</button>
            <button onClick={exportDADSXml} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[12px]">⬇️ XML DADS</button>
          </>
        )}
      </div>

      {tab === "ipres" && <IpresPreview rows={rows} totaux={totaux} />}
      {tab === "livre" && <LivrePreview rows={rows} totaux={totaux} />}
      {tab === "dads" && <DadsPreview rows={dadsRows} annee={annee} />}
    </div>
  );
}

function IpresPreview({ rows, totaux }: { rows: { emp: Employee; p: PayrollResult }[]; totaux: { brut: number; ipresRG_s: number; ipresRG_p: number; ipresRC_s: number; ipresRC_p: number; css_af: number; css_at: number } }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-background text-muted-foreground">
            {["Matricule", "Nom", "Brut", "RG sal.", "RG pat.", "RC sal.", "RC pat.", "CSS AF", "CSS AT"].map((h, i) => (
              <th key={h} className={`py-2 px-2 ${i < 2 ? "text-left" : "text-right"} border-b border-border`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.emp.matricule} className="border-b border-border">
              <td className="py-1.5 px-2">{r.emp.matricule}</td>
              <td className="py-1.5 px-2">{r.emp.nom} {r.emp.prenom}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.brut)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ipresRG_s)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ipresRG_p)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ipresRC_s)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ipresRC_p)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.css_af)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.css_at)}</td>
            </tr>
          ))}
          <tr className="bg-background font-bold text-primary">
            <td colSpan={2} className="py-2 px-2">TOTAUX</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.brut)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ipresRG_s)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ipresRG_p)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ipresRC_s)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ipresRC_p)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.css_af)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.css_at)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function LivrePreview({ rows, totaux }: { rows: { emp: Employee; p: PayrollResult }[]; totaux: { brut: number; net: number; ir: number; trimf: number; ipresRG_s: number; ipresRC_s: number } }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-background text-muted-foreground">
            {["Matricule", "Nom & Prénom", "Emploi", "Brut", "IR+TRIMF", "Cot. sal.", "Net payé"].map((h, i) => (
              <th key={h} className={`py-2 px-2 ${i < 3 ? "text-left" : "text-right"} border-b border-border`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.emp.matricule} className="border-b border-border">
              <td className="py-1.5 px-2">{r.emp.matricule}</td>
              <td className="py-1.5 px-2">{r.emp.nom} {r.emp.prenom}</td>
              <td className="py-1.5 px-2">{r.emp.fonction}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.brut)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ir + r.p.trimf)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ipresRG_s + r.p.ipresRC_s + r.p.ipm_s)}</td>
              <td className="py-1.5 px-2 text-right font-bold">{fmt(r.p.net)}</td>
            </tr>
          ))}
          <tr className="bg-background font-bold text-primary">
            <td colSpan={3} className="py-2 px-2">TOTAUX ({rows.length} salariés)</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.brut)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ir + totaux.trimf)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ipresRG_s + totaux.ipresRC_s)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.net)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function DadsPreview({ rows, annee }: { rows: { emp: Employee; brutAnnuel: number; irAnnuel: number; ipresAnnuel: number; cssAnnuel: number }[]; annee: number }) {
  const tot = rows.reduce((s, r) => ({
    brut: s.brut + r.brutAnnuel,
    ir: s.ir + r.irAnnuel,
    ipres: s.ipres + r.ipresAnnuel,
    css: s.css + r.cssAnnuel,
  }), { brut: 0, ir: 0, ipres: 0, css: 0 });

  return (
    <div className="bg-card border border-border rounded-lg overflow-x-auto">
      <div className="px-4 py-3 border-b border-border text-muted-foreground text-[11px]">DADS — Déclaration Annuelle des Salaires <strong className="text-foreground">{annee}</strong> (cumul reconstitué)</div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-background text-muted-foreground">
            {["Matricule", "Nom", "Brut annuel", "IR annuel", "IPRES salarié", "CSS patronal"].map((h, i) => (
              <th key={h} className={`py-2 px-2 ${i < 2 ? "text-left" : "text-right"} border-b border-border`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.emp.matricule} className="border-b border-border">
              <td className="py-1.5 px-2">{r.emp.matricule}</td>
              <td className="py-1.5 px-2">{r.emp.nom} {r.emp.prenom}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.brutAnnuel)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.irAnnuel)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.ipresAnnuel)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.cssAnnuel)}</td>
            </tr>
          ))}
          <tr className="bg-background font-bold text-primary">
            <td colSpan={2} className="py-2 px-2">TOTAUX</td>
            <td className="py-2 px-2 text-right">{fmt(tot.brut)}</td>
            <td className="py-2 px-2 text-right">{fmt(tot.ir)}</td>
            <td className="py-2 px-2 text-right">{fmt(tot.ipres)}</td>
            <td className="py-2 px-2 text-right">{fmt(tot.css)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default DeclarationsPage;