import type { Employee, PayrollResult } from "@/lib/payroll";
import { fmt } from "@/lib/payroll";

interface CotisationsTableProps {
  allPaies: (Employee & { paie: PayrollResult })[];
  totaux: { brut: number; net: number; ch: number; mass: number };
}

export function CotisationsTable({ allPaies, totaux }: CotisationsTableProps) {
  const headers = ["Employé", "Brut", "IR", "TRIMF", "IPRES RG", "IPRES RC", "CSS", "IPM", "Ret. Sal.", "Ch. Pat.", "Net"];

  return (
    <div>
      <h1 className="text-foreground text-xl font-extrabold mb-4">État des Cotisations</h1>
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
