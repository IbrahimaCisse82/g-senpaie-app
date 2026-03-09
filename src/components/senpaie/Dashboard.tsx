import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { StatCard } from "./StatCard";
import type { Employee, PayrollResult } from "@/lib/payroll";
import { fmt, MOIS } from "@/lib/payroll";

interface DashboardProps {
  allPaies: (Employee & { paie: PayrollResult })[];
  totaux: { brut: number; net: number; ch: number; mass: number };
}

export function Dashboard({ allPaies, totaux }: DashboardProps) {
  const barData = allPaies.map((e) => ({
    name: e.prenom.split(" ")[0],
    Brut: e.paie.brut,
    Net: e.paie.net,
    Retenues: e.paie.totalRet,
  }));

  const pieData = [
    { name: "Nets payés", value: totaux.net, color: "hsl(160, 84%, 39%)" },
    { name: "IR + TRIMF", value: allPaies.reduce((s, e) => s + e.paie.ir + e.paie.trimf, 0), color: "hsl(0, 91%, 71%)" },
    { name: "IPRES", value: allPaies.reduce((s, e) => s + e.paie.ipresRG_s + e.paie.ipresRC_s + e.paie.ipresRG_p + e.paie.ipresRC_p, 0), color: "hsl(217, 92%, 68%)" },
    { name: "CSS", value: allPaies.reduce((s, e) => s + e.paie.css_af + e.paie.css_at, 0), color: "hsl(45, 97%, 56%)" },
    { name: "IPM+CFCE", value: allPaies.reduce((s, e) => s + e.paie.ipm_s + e.paie.ipm_p + e.paie.cfce, 0), color: "hsl(255, 92%, 76%)" },
  ];

  return (
    <div>
      <h1 className="text-foreground text-xl font-extrabold mb-1">Tableau de Bord</h1>
      <div className="text-muted-foreground text-[11px] mb-5">
        {MOIS[new Date().getMonth()]} {new Date().getFullYear()} · {allPaies.length} salariés
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard icon="💼" label="Masse Salariale" value={`${fmt(totaux.mass)} F`} sub="Charges incluses" color="primary" />
        <StatCard icon="📊" label="Total Brut" value={`${fmt(totaux.brut)} F`} sub="Avant retenues" color="blue" />
        <StatCard icon="💳" label="Net Total" value={`${fmt(totaux.net)} F`} sub="Transport inclus" color="yellow" />
        <StatCard icon="🏛️" label="Charges Patronales" value={`${fmt(totaux.ch)} F`} sub="IPRES+CSS+IPM+CFCE" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        <div className="bg-card rounded-lg p-4 md:p-5">
          <div className="text-muted-foreground text-[11px] mb-3.5 uppercase">Brut / Net / Retenues par employé</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 29%, 16%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(213, 14%, 49%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(213, 14%, 49%)", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `${fmt(v)} FCFA`} contentStyle={{ background: "hsl(222, 43%, 9%)", border: "1px solid hsl(217, 29%, 16%)", color: "hsl(215, 25%, 91%)", fontSize: 11 }} />
              <Bar dataKey="Brut" fill="hsl(217, 92%, 68%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Net" fill="hsl(160, 84%, 39%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Retenues" fill="hsl(0, 91%, 71%)" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ color: "hsl(213, 14%, 49%)", fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-lg p-4 md:p-5">
          <div className="text-muted-foreground text-[11px] mb-3.5 uppercase">Répartition masse salariale</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={72} paddingAngle={2}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${fmt(v)} FCFA`} contentStyle={{ background: "hsl(222, 43%, 9%)", border: "1px solid hsl(217, 29%, 16%)", color: "hsl(215, 25%, 91%)", fontSize: 11 }} />
              <Legend wrapperStyle={{ color: "hsl(213, 14%, 49%)", fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
