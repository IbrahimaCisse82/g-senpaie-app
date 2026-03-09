import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { StatCard } from "./StatCard";
import type { Employee, PayrollResult } from "@/lib/payroll";
import { fmt, MOIS } from "@/lib/payroll";
import type { PayrollSnapshot } from "@/hooks/useSupabaseData";

interface DashboardProps {
  allPaies: (Employee & { paie: PayrollResult })[];
  totaux: { brut: number; net: number; ch: number; mass: number };
  history?: PayrollSnapshot[];
  onSaveSnapshot?: () => void;
}

const SMIG = 64281; // SMIG Sénégal

export function Dashboard({ allPaies, totaux, history = [], onSaveSnapshot }: DashboardProps) {
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

  // Alerts
  const alerts = useMemo(() => {
    const list: { type: "warning" | "danger" | "info"; message: string }[] = [];

    // SMIG check
    const belowSmig = allPaies.filter((e) => e.salaireBase < SMIG);
    if (belowSmig.length > 0) {
      list.push({
        type: "danger",
        message: `⚠️ ${belowSmig.length} employé${belowSmig.length > 1 ? "s" : ""} sous le SMIG (${fmt(SMIG)} F) : ${belowSmig.map((e) => e.prenom).join(", ")}`,
      });
    }

    // IPRES ceiling check
    const atIpresCeiling = allPaies.filter((e) => e.paie.brut >= 432000);
    if (atIpresCeiling.length > 0) {
      list.push({
        type: "warning",
        message: `📊 ${atIpresCeiling.length} employé${atIpresCeiling.length > 1 ? "s" : ""} au plafond IPRES RG (432 000 F)`,
      });
    }

    // High charges ratio
    const chargesRatio = totaux.ch / Math.max(totaux.brut, 1);
    if (chargesRatio > 0.30) {
      list.push({
        type: "info",
        message: `📈 Ratio charges patronales/brut élevé : ${(chargesRatio * 100).toFixed(1)}%`,
      });
    }

    return list;
  }, [allPaies, totaux]);

  // KPIs
  const kpis = useMemo(() => {
    const avgNet = allPaies.length > 0 ? totaux.net / allPaies.length : 0;
    const avgBrut = allPaies.length > 0 ? totaux.brut / allPaies.length : 0;
    const chargesRate = totaux.brut > 0 ? (totaux.ch / totaux.brut * 100) : 0;
    const retRate = allPaies.length > 0
      ? (allPaies.reduce((s, e) => s + e.paie.totalRet, 0) / totaux.brut * 100) : 0;

    return { avgNet, avgBrut, chargesRate, retRate };
  }, [allPaies, totaux]);

  // Previous month comparison from history
  const prevMonth = useMemo(() => {
    if (history.length < 1) return null;
    const now = new Date();
    const pm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return history.find((h) => h.mois === pm && h.annee === py) || null;
  }, [history]);

  const variation = prevMonth
    ? ((totaux.mass - prevMonth.totaux.mass) / Math.max(prevMonth.totaux.mass, 1) * 100)
    : null;

  // History chart data
  const historyChartData = useMemo(() => {
    return history
      .slice(0, 6)
      .reverse()
      .map((h) => ({
        mois: MOIS[h.mois].slice(0, 3),
        Masse: h.totaux.mass,
        Net: h.totaux.net,
      }));
  }, [history]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1">
        <h1 className="text-foreground text-xl font-extrabold">Tableau de Bord</h1>
        {onSaveSnapshot && (
          <button
            onClick={onSaveSnapshot}
            className="px-4 py-2 bg-senpaie-blue text-background rounded-lg font-bold text-[12px] cursor-pointer border-none whitespace-nowrap"
          >
            💾 Clôturer le mois
          </button>
        )}
      </div>
      <div className="text-muted-foreground text-[11px] mb-4">
        {MOIS[new Date().getMonth()]} {new Date().getFullYear()} · {allPaies.length} salariés
        {variation !== null && (
          <span className={`ml-3 font-bold ${variation >= 0 ? "text-destructive" : "text-primary"}`}>
            {variation >= 0 ? "▲" : "▼"} {Math.abs(variation).toFixed(1)}% vs mois précédent
          </span>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`rounded-lg px-4 py-2.5 text-[12px] font-medium border ${
                a.type === "danger"
                  ? "bg-destructive/10 border-destructive text-destructive"
                  : a.type === "warning"
                  ? "bg-senpaie-yellow/10 border-senpaie-yellow text-senpaie-yellow"
                  : "bg-senpaie-blue/10 border-senpaie-blue text-senpaie-blue"
              }`}
            >
              {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard icon="💼" label="Masse Salariale" value={`${fmt(totaux.mass)} F`} sub="Charges incluses" color="primary" />
        <StatCard icon="📊" label="Total Brut" value={`${fmt(totaux.brut)} F`} sub="Avant retenues" color="blue" />
        <StatCard icon="💳" label="Net Total" value={`${fmt(totaux.net)} F`} sub="Transport inclus" color="yellow" />
        <StatCard icon="🏛️" label="Charges Patronales" value={`${fmt(totaux.ch)} F`} sub="IPRES+CSS+IPM+CFCE" color="purple" />
      </div>

      {/* KPIs avancés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Salaire net moyen</div>
          <div className="text-primary text-lg font-extrabold">{fmt(kpis.avgNet)} F</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Salaire brut moyen</div>
          <div className="text-senpaie-blue text-lg font-extrabold">{fmt(kpis.avgBrut)} F</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Taux charges pat.</div>
          <div className="text-senpaie-yellow text-lg font-extrabold">{kpis.chargesRate.toFixed(1)}%</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Taux retenues sal.</div>
          <div className="text-destructive text-lg font-extrabold">{kpis.retRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 mb-4">
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

      {/* Historique mensuel */}
      {historyChartData.length > 0 && (
        <div className="bg-card rounded-lg p-4 md:p-5">
          <div className="text-muted-foreground text-[11px] mb-3.5 uppercase">Historique mensuel — Masse salariale & Net</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={historyChartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 29%, 16%)" />
              <XAxis dataKey="mois" tick={{ fill: "hsl(213, 14%, 49%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(213, 14%, 49%)", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `${fmt(v)} FCFA`} contentStyle={{ background: "hsl(222, 43%, 9%)", border: "1px solid hsl(217, 29%, 16%)", color: "hsl(215, 25%, 91%)", fontSize: 11 }} />
              <Bar dataKey="Masse" fill="hsl(255, 92%, 76%)" radius={[3, 3, 0, 0]} name="Masse Salariale" />
              <Bar dataKey="Net" fill="hsl(160, 84%, 39%)" radius={[3, 3, 0, 0]} name="Total Net" />
              <Legend wrapperStyle={{ color: "hsl(213, 14%, 49%)", fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
