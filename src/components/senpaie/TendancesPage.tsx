import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Employee, PayrollResult } from "@/lib/payroll";
import { fmt, pct, MOIS } from "@/lib/payroll";

interface TendancesProps {
  allPaies: (Employee & { paie: PayrollResult })[];
  totaux: { brut: number; net: number; ch: number; mass: number };
}

export function TendancesPage({ allPaies, totaux }: TendancesProps) {
  const tendData = MOIS.slice(0, 6).map((m, i) => ({
    mois: m.slice(0, 3),
    Masse: totaux.mass * (1 + i * 0.004),
    Net: totaux.net * (1 + i * 0.003),
  }));

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

  return (
    <div>
      <h1 className="text-foreground text-xl font-extrabold mb-4">Analyse des Tendances</h1>

      <div className="bg-card rounded-lg p-5 mb-4">
        <div className="text-muted-foreground text-[11px] mb-3.5 uppercase">Évolution masse salariale & net · Jan–Juin</div>
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

      <div className="grid grid-cols-3 gap-3.5">
        {stats.map((c) => (
          <div key={c.label} className={`bg-card rounded-lg p-5 border-t-[3px] ${colorClass[c.color]}`}>
            <div className="text-muted-foreground text-[11px]">{c.label}</div>
            <div className={`text-3xl font-extrabold mt-2 ${colorClass[c.color].split(" ").pop()}`}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TendancesPage;
