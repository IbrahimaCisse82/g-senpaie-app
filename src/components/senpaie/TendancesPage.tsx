import { useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Employee, PayrollResult } from "@/lib/payroll";
import { fmt, pct, MOIS } from "@/lib/payroll";
import type { PayrollSnapshot } from "@/hooks/useSupabaseData";

interface TendancesProps {
  allPaies: (Employee & { paie: PayrollResult })[];
  totaux: { brut: number; net: number; ch: number; mass: number };
  history?: PayrollSnapshot[];
}

export function TendancesPage({ allPaies, totaux, history = [] }: TendancesProps) {
  // Use real history if available, otherwise simulated
  const tendData = useMemo(() => {
    if (history.length >= 2) {
      return history
        .slice(0, 6)
        .reverse()
        .map((h) => ({
          mois: MOIS[h.mois].slice(0, 3),
          Masse: h.totaux.mass,
          Net: h.totaux.net,
        }));
    }
    return MOIS.slice(0, 6).map((m, i) => ({
      mois: m.slice(0, 3),
      Masse: totaux.mass * (1 + i * 0.004),
      Net: totaux.net * (1 + i * 0.003),
    }));
  }, [history, totaux]);

  const stats = [
    { label: "Taux IR moyen / brut", value: pct(allPaies.reduce((s, e) => s + e.paie.ir / Math.max(e.paie.brut, 1), 0) / Math.max(allPaies.length, 1)), color: "destructive" },
    { label: "Taux IPRES moyen", value: pct(allPaies.reduce((s, e) => s + e.paie.ipresRG_s / Math.max(e.paie.brut, 1), 0) / Math.max(allPaies.length, 1)), color: "blue" },
    { label: "Charges / Brut", value: pct(totaux.ch / Math.max(totaux.brut, 1)), color: "yellow" },
  ];

  const colorClass: Record<string, string> = {
    destructive: "border-t-destructive text-destructive",
    blue: "border-t-senpaie-blue text-senpaie-blue",
    yellow: "border-t-senpaie-yellow text-senpaie-yellow",
  };

  // Monthly comparison table from history
  const historyTable = useMemo(() => {
    return history.slice(0, 12).map((h) => ({
      periode: `${MOIS[h.mois].slice(0, 3)} ${h.annee}`,
      ...h.totaux,
      nbEmp: h.nbEmployees,
    }));
  }, [history]);

  return (
    <div>
      <h1 className="text-foreground text-xl font-extrabold mb-4">Analyse des Tendances</h1>

      <div className="bg-card rounded-lg p-4 md:p-5 mb-4">
        <div className="text-muted-foreground text-[11px] mb-3.5 uppercase">
          {history.length >= 2 ? "Évolution réelle — Historique clôturé" : "Évolution masse salariale & net · Simulé"}
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={tendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 29%, 16%)" />
            <XAxis dataKey="mois" tick={{ fill: "hsl(213, 14%, 49%)", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(213, 14%, 49%)", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `${fmt(v)} FCFA`} contentStyle={{ background: "hsl(222, 43%, 9%)", border: "1px solid hsl(217, 29%, 16%)", color: "hsl(215, 25%, 91%)", fontSize: 11 }} />
            <Legend wrapperStyle={{ color: "hsl(213, 14%, 49%)", fontSize: 11 }} />
            <Line type="monotone" dataKey="Masse" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(160, 84%, 39%)" }} name="Masse Salariale" />
            <Line type="monotone" dataKey="Net" stroke="hsl(217, 92%, 68%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(217, 92%, 68%)" }} name="Total Net" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
        {stats.map((c) => (
          <div key={c.label} className={`bg-card rounded-lg p-5 border-t-[3px] ${colorClass[c.color]}`}>
            <div className="text-muted-foreground text-[11px]">{c.label}</div>
            <div className={`text-2xl md:text-3xl font-extrabold mt-2 ${colorClass[c.color].split(" ").pop()}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly history table */}
      {historyTable.length > 0 && (
        <div className="bg-card rounded-lg p-4 md:p-5">
          <div className="text-muted-foreground text-[11px] mb-3.5 uppercase">Historique des clôtures mensuelles</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-background">
                  {["Période", "Employés", "Brut Total", "Net Total", "Charges Pat.", "Masse Sal."].map((h) => (
                    <th key={h} className={`py-2.5 px-3 text-muted-foreground font-semibold border-b border-border whitespace-nowrap ${h === "Période" ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyTable.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-senpaie-alt-row"}>
                    <td className="py-2 px-3 text-foreground font-bold">{row.periode}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{row.nbEmp}</td>
                    <td className="py-2 px-3 text-right text-senpaie-blue">{fmt(row.brut)} F</td>
                    <td className="py-2 px-3 text-right text-primary font-bold">{fmt(row.net)} F</td>
                    <td className="py-2 px-3 text-right text-senpaie-yellow">{fmt(row.ch)} F</td>
                    <td className="py-2 px-3 text-right text-senpaie-purple font-bold">{fmt(row.mass)} F</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default TendancesPage;
