import type { Employee, PayrollResult } from "@/lib/payroll";
import { fmt, MOIS } from "@/lib/payroll";

interface CotisationsTableProps {
  allPaies: (Employee & { paie: PayrollResult })[];
  totaux: { brut: number; net: number; ch: number; mass: number };
  onOpenRapport?: () => void;
}

function exportCSV(allPaies: (Employee & { paie: PayrollResult })[], totaux: CotisationsTableProps["totaux"]) {
  const headers = ["Employé", "Matricule", "Statut", "Brut", "IR", "TRIMF", "IPRES RG", "IPRES RC", "CSS", "IPM", "Ret. Sal.", "Ch. Pat.", "Masse", "Net"];
  const rows = allPaies.map((emp) => [
    `${emp.prenom} ${emp.nom}`,
    emp.matricule,
    emp.statut,
    Math.round(emp.paie.brut),
    Math.round(emp.paie.ir),
    Math.round(emp.paie.trimf),
    Math.round(emp.paie.ipresRG_s + emp.paie.ipresRG_p),
    Math.round(emp.paie.ipresRC_s + emp.paie.ipresRC_p),
    Math.round(emp.paie.css_af + emp.paie.css_at),
    Math.round(emp.paie.ipm_s + emp.paie.ipm_p),
    Math.round(emp.paie.totalRet),
    Math.round(emp.paie.chargesPat),
    Math.round(emp.paie.masse),
    Math.round(emp.paie.net),
  ]);

  const totRow = [
    "TOTAUX", "", "",
    Math.round(totaux.brut),
    Math.round(allPaies.reduce((s, e) => s + e.paie.ir, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.trimf, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.ipresRG_s + e.paie.ipresRG_p, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.ipresRC_s + e.paie.ipresRC_p, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.css_af + e.paie.css_at, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.ipm_s + e.paie.ipm_p, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.totalRet, 0)),
    Math.round(totaux.ch),
    Math.round(totaux.mass),
    Math.round(totaux.net),
  ];

  const csvContent = [headers, ...rows, totRow].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cotisations_${MOIS[new Date().getMonth()]}_${new Date().getFullYear()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAllBulletinsCSV(allPaies: (Employee & { paie: PayrollResult })[]) {
  const headers = [
    "Matricule", "Prénom", "Nom", "Fonction", "Statut", "Convention", "Contrat",
    "Sal. Base", "Sursalaire", "Prime Anc.", "HS Total", "Brut",
    "IR", "TRIMF", "IPRES RG Sal", "IPRES RC Sal", "IPM Sal", "Total Ret.",
    "Transport", "Prime Panier", "Ind. Km", "Avances",
    "Net", "Ch. Patronales", "Masse Sal."
  ];
  const rows = allPaies.map((e) => [
    e.matricule, e.prenom, e.nom, e.fonction, e.statut, e.convention, e.contrat,
    Math.round(e.paie.salaireBase), Math.round(e.paie.sursalaire), Math.round(e.paie.primeAnc),
    Math.round(e.paie.totalHS), Math.round(e.paie.brut),
    Math.round(e.paie.ir), Math.round(e.paie.trimf), Math.round(e.paie.ipresRG_s),
    Math.round(e.paie.ipresRC_s), Math.round(e.paie.ipm_s), Math.round(e.paie.totalRet),
    Math.round(e.paie.transport), Math.round(e.paie.primePanier), Math.round(e.paie.indKilometrique),
    Math.round(e.paie.totalAvances),
    Math.round(e.paie.net), Math.round(e.paie.chargesPat), Math.round(e.paie.masse),
  ]);

  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bulletins_complets_${MOIS[new Date().getMonth()]}_${new Date().getFullYear()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportXLSX(allPaies: (Employee & { paie: PayrollResult })[], totaux: CotisationsTableProps["totaux"]) {
  const XLSX = await import("xlsx");
  const headers = ["Employé", "Matricule", "Statut", "Brut", "IR", "TRIMF", "IPRES RG", "IPRES RC", "CSS", "IPM", "Ret. Sal.", "Ch. Pat.", "Masse", "Net"];
  const rows = allPaies.map((emp) => [
    `${emp.prenom} ${emp.nom}`, emp.matricule, emp.statut,
    Math.round(emp.paie.brut), Math.round(emp.paie.ir), Math.round(emp.paie.trimf),
    Math.round(emp.paie.ipresRG_s + emp.paie.ipresRG_p),
    Math.round(emp.paie.ipresRC_s + emp.paie.ipresRC_p),
    Math.round(emp.paie.css_af + emp.paie.css_at),
    Math.round(emp.paie.ipm_s + emp.paie.ipm_p),
    Math.round(emp.paie.totalRet), Math.round(emp.paie.chargesPat),
    Math.round(emp.paie.masse), Math.round(emp.paie.net),
  ]);
  const totRow = [
    "TOTAUX", "", "",
    Math.round(totaux.brut),
    Math.round(allPaies.reduce((s, e) => s + e.paie.ir, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.trimf, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.ipresRG_s + e.paie.ipresRG_p, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.ipresRC_s + e.paie.ipresRC_p, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.css_af + e.paie.css_at, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.ipm_s + e.paie.ipm_p, 0)),
    Math.round(allPaies.reduce((s, e) => s + e.paie.totalRet, 0)),
    Math.round(totaux.ch), Math.round(totaux.mass), Math.round(totaux.net),
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows, totRow]);
  ws["!cols"] = headers.map(() => ({ wch: 14 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cotisations");
  XLSX.writeFile(wb, `cotisations_${MOIS[new Date().getMonth()]}_${new Date().getFullYear()}.xlsx`);
}

export function CotisationsTable({ allPaies, totaux, onOpenRapport }: CotisationsTableProps) {
  const headers = ["Employé", "Brut", "IR", "TRIMF", "IPRES RG", "IPRES RC", "CSS", "IPM", "Ret. Sal.", "Ch. Pat.", "Net"];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h1 className="text-foreground text-xl font-extrabold">État des Cotisations</h1>
        <div className="flex gap-2 flex-wrap">
          {onOpenRapport && (
            <button
              onClick={onOpenRapport}
              className="px-3 py-2 bg-transparent border border-senpaie-purple text-senpaie-purple rounded-lg font-bold text-[12px] cursor-pointer whitespace-nowrap"
            >
              📊 Rapport période
            </button>
          )}
          <button
            onClick={() => exportAllBulletinsCSV(allPaies)}
            className="px-3 py-2 bg-transparent border border-senpaie-blue text-senpaie-blue rounded-lg font-bold text-[12px] cursor-pointer whitespace-nowrap"
          >
            📋 Export complet
          </button>
          <button
            onClick={() => exportCSV(allPaies, totaux)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-[12px] cursor-pointer border-none whitespace-nowrap"
          >
            📥 Exporter CSV
          </button>
          <button
            onClick={() => void exportXLSX(allPaies, totaux)}
            className="px-4 py-2 bg-senpaie-yellow text-background rounded-lg font-bold text-[12px] cursor-pointer border-none whitespace-nowrap"
          >
            📊 Exporter Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-muted-foreground text-[10px] uppercase">Total IR</div>
          <div className="text-destructive font-extrabold text-sm mt-1">{fmt(allPaies.reduce((s, e) => s + e.paie.ir, 0))} F</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-muted-foreground text-[10px] uppercase">Total IPRES</div>
          <div className="text-senpaie-blue font-extrabold text-sm mt-1">{fmt(allPaies.reduce((s, e) => s + e.paie.ipresRG_s + e.paie.ipresRG_p + e.paie.ipresRC_s + e.paie.ipresRC_p, 0))} F</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-muted-foreground text-[10px] uppercase">Total CSS</div>
          <div className="text-senpaie-yellow font-extrabold text-sm mt-1">{fmt(allPaies.reduce((s, e) => s + e.paie.css_af + e.paie.css_at, 0))} F</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-muted-foreground text-[10px] uppercase">Total CFCE</div>
          <div className="text-senpaie-purple font-extrabold text-sm mt-1">{fmt(allPaies.reduce((s, e) => s + e.paie.cfce, 0))} F</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-background">
              {headers.map((h) => (
                <th key={h} className={`py-3 px-3 text-muted-foreground font-semibold border-b border-border whitespace-nowrap ${h === "Employé" ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPaies.map((emp, i) => {
              const vals = [
                emp.prenom.split(" ")[0] + " " + emp.nom,
                emp.paie.brut, emp.paie.ir, emp.paie.trimf,
                emp.paie.ipresRG_s + emp.paie.ipresRG_p,
                emp.paie.ipresRC_s + emp.paie.ipresRC_p,
                emp.paie.css_af + emp.paie.css_at,
                emp.paie.ipm_s + emp.paie.ipm_p,
                emp.paie.totalRet, emp.paie.chargesPat, emp.paie.net,
              ];
              return (
                <tr key={emp.matricule} className={i % 2 === 0 ? "bg-card" : "bg-senpaie-alt-row"}>
                  {vals.map((v, j) => (
                    <td key={j} className={`py-2.5 px-3 ${j === 0 ? "text-left text-foreground font-bold" : "text-right"} ${j === 10 ? "text-primary font-bold" : j >= 8 ? "text-destructive" : "text-muted-foreground"}`}>
                      {j === 0 ? String(v) : `${fmt(v as number)} F`}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className="bg-primary/10 border-t-2 border-primary">
              {["TOTAUX", totaux.brut, ...allPaies.reduce((a, e) => [
                a[0] + e.paie.ir, a[1] + e.paie.trimf,
                a[2] + e.paie.ipresRG_s + e.paie.ipresRG_p,
                a[3] + e.paie.ipresRC_s + e.paie.ipresRC_p,
                a[4] + e.paie.css_af + e.paie.css_at,
                a[5] + e.paie.ipm_s + e.paie.ipm_p,
                a[6] + e.paie.totalRet, a[7] + e.paie.chargesPat, a[8] + e.paie.net,
              ], [0, 0, 0, 0, 0, 0, 0, 0, 0])].map((v, j) => (
                <td key={j} className={`py-3 px-3 text-primary font-extrabold ${j === 0 ? "text-left" : "text-right"}`}>
                  {j === 0 ? String(v) : `${fmt(v as number)} F`}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CotisationsTable;
