import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { StatCard } from "./StatCard";
import type { Employee, PayrollResult } from "@/lib/payroll";
import { fmt, MOIS } from "@/lib/payroll";
import type { PayrollSnapshot } from "@/hooks/useSupabaseData";
import type { Conge, Contrat } from "@/hooks/useRH";

interface DashboardProps {
  allPaies: (Employee & { paie: PayrollResult })[];
  totaux: { brut: number; net: number; ch: number; mass: number };
  history?: PayrollSnapshot[];
  conges?: Conge[];
  contrats?: Contrat[];
  onSaveSnapshot?: () => void;
  onReopenMonth?: (mois: number, annee: number) => void;
}

const SMIG = 64281;

export function Dashboard({ allPaies, totaux, history = [], conges = [], contrats = [], onSaveSnapshot, onReopenMonth }: DashboardProps) {
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
    const belowSmig = allPaies.filter((e) => e.salaireBase < SMIG);
    if (belowSmig.length > 0) {
      list.push({ type: "danger", message: `⚠️ ${belowSmig.length} employé${belowSmig.length > 1 ? "s" : ""} sous le SMIG (${fmt(SMIG)} F) : ${belowSmig.map((e) => e.prenom).join(", ")}` });
    }
    const atIpresCeiling = allPaies.filter((e) => e.paie.brut >= 432000);
    if (atIpresCeiling.length > 0) {
      list.push({ type: "warning", message: `📊 ${atIpresCeiling.length} employé${atIpresCeiling.length > 1 ? "s" : ""} au plafond IPRES RG (432 000 F)` });
    }
    const chargesRatio = totaux.ch / Math.max(totaux.brut, 1);
    if (chargesRatio > 0.30) {
      list.push({ type: "info", message: `📈 Ratio charges patronales/brut élevé : ${(chargesRatio * 100).toFixed(1)}%` });
    }

    // Échéances contractuelles (calculées dynamiquement)
    const today = new Date();
    const in60 = new Date(today.getTime() + 60 * 86400000);
    const nameOf = (mat: string) => {
      const e = allPaies.find((x) => x.matricule === mat);
      return e ? `${e.prenom} ${e.nom}` : mat;
    };

    const cddSoon = contrats.filter(
      (c) => c.type === "CDD" && c.dateFin && new Date(c.dateFin) >= today && new Date(c.dateFin) <= in60
    );
    if (cddSoon.length > 0) {
      list.push({
        type: "warning",
        message: `📝 ${cddSoon.length} CDD arrive${cddSoon.length > 1 ? "nt" : ""} à échéance sous 60 jours : ${cddSoon.map((c) => `${nameOf(c.matricule)} (${c.dateFin})`).join(", ")}`,
      });
    }

    const essais = contrats
      .map((c) => {
        const mois = c.periodeEssaiMois || 0;
        if (!c.dateDebut || mois <= 0) return null;
        const fin = new Date(c.dateDebut);
        fin.setMonth(fin.getMonth() + mois);
        return fin >= today && fin <= in60 ? { c, fin } : null;
      })
      .filter(Boolean) as { c: Contrat; fin: Date }[];
    if (essais.length > 0) {
      list.push({
        type: "info",
        message: `⏳ ${essais.length} période${essais.length > 1 ? "s" : ""} d'essai se termine${essais.length > 1 ? "nt" : ""} sous 60 jours : ${essais.map((x) => `${nameOf(x.c.matricule)} (${x.fin.toISOString().slice(0, 10)})`).join(", ")}`,
      });
    }

    const congesAValider = conges.filter((c) => c.statut === "demande");
    if (congesAValider.length > 0) {
      list.push({
        type: "warning",
        message: `🌴 ${congesAValider.length} demande${congesAValider.length > 1 ? "s" : ""} de congé en attente de validation`,
      });
    }
    return list;
  }, [allPaies, totaux, conges, contrats]);

  // KPIs
  const kpis = useMemo(() => {
    const avgNet = allPaies.length > 0 ? totaux.net / allPaies.length : 0;
    const avgBrut = allPaies.length > 0 ? totaux.brut / allPaies.length : 0;
    const chargesRate = totaux.brut > 0 ? (totaux.ch / totaux.brut * 100) : 0;
    const retRate = allPaies.length > 0
      ? (allPaies.reduce((s, e) => s + e.paie.totalRet, 0) / totaux.brut * 100) : 0;
    return { avgNet, avgBrut, chargesRate, retRate };
  }, [allPaies, totaux]);

  // Previous month comparison
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

  // History chart
  const historyChartData = useMemo(() => {
    return history.slice(0, 6).reverse().map((h) => ({
      mois: MOIS[h.mois].slice(0, 3),
      Masse: h.totaux.mass,
      Net: h.totaux.net,
    }));
  }, [history]);

  // Top earners & distribution
  const topEarners = useMemo(() => {
    return [...allPaies].sort((a, b) => b.paie.net - a.paie.net).slice(0, 5);
  }, [allPaies]);

  const statutDistribution = useMemo(() => {
    const map: Record<string, { count: number; totalNet: number }> = {};
    allPaies.forEach((e) => {
      const s = e.statut || "Non défini";
      if (!map[s]) map[s] = { count: 0, totalNet: 0 };
      map[s].count++;
      map[s].totalNet += e.paie.net;
    });
    return Object.entries(map).map(([statut, data]) => ({ statut, ...data }));
  }, [allPaies]);

  const statutColors = ["hsl(160, 84%, 39%)", "hsl(217, 92%, 68%)", "hsl(45, 97%, 56%)", "hsl(255, 92%, 76%)", "hsl(0, 91%, 71%)"];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1">
        <h1 className="text-foreground text-xl font-extrabold">Tableau de Bord</h1>
        {onSaveSnapshot && (
          <button onClick={onSaveSnapshot} className="px-4 py-2 bg-senpaie-blue text-background rounded-lg font-bold text-[12px] cursor-pointer border-none whitespace-nowrap">
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
            <div key={i} className={`rounded-lg px-4 py-2.5 text-[12px] font-medium border ${
              a.type === "danger" ? "bg-destructive/10 border-destructive text-destructive"
                : a.type === "warning" ? "bg-senpaie-yellow/10 border-senpaie-yellow text-senpaie-yellow"
                : "bg-senpaie-blue/10 border-senpaie-blue text-senpaie-blue"
            }`}>{a.message}</div>
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

      {/* Top earners + Statut distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {topEarners.length > 0 && (
          <div className="bg-card rounded-lg p-4 md:p-5">
            <div className="text-muted-foreground text-[11px] mb-3.5 uppercase">🏆 Top 5 salaires nets</div>
            {topEarners.map((e, i) => (
              <div key={e.matricule} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                    i === 0 ? "bg-senpaie-yellow/20 text-senpaie-yellow" : "bg-muted text-muted-foreground"
                  }`}>{i + 1}</span>
                  <div>
                    <div className="text-foreground text-xs font-bold">{e.prenom} {e.nom}</div>
                    <div className="text-muted-foreground text-[10px]">{e.fonction} · {e.statut}</div>
                  </div>
                </div>
                <div className="text-primary font-extrabold text-xs">{fmt(e.paie.net)} F</div>
              </div>
            ))}
          </div>
        )}

        {statutDistribution.length > 0 && (
          <div className="bg-card rounded-lg p-4 md:p-5">
            <div className="text-muted-foreground text-[11px] mb-3.5 uppercase">📊 Répartition par statut</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statutDistribution.map((s) => ({ name: s.statut, value: s.count }))}
                  dataKey="value" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}
                >
                  {statutDistribution.map((_, i) => <Cell key={i} fill={statutColors[i % statutColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(222, 43%, 9%)", border: "1px solid hsl(217, 29%, 16%)", color: "hsl(215, 25%, 91%)", fontSize: 11 }} />
                <Legend wrapperStyle={{ color: "hsl(213, 14%, 49%)", fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {statutDistribution.map((s) => (
                <div key={s.statut} className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{s.statut} ({s.count})</span>
                  <span className="text-foreground font-semibold">{fmt(s.totalNet)} F net</span>
                </div>
              ))}
            </div>
          </div>
        )}
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

      {/* Mois clôturés avec possibilité de réouverture */}
      {history.length > 0 && onReopenMonth && (
        <div className="bg-card rounded-lg p-4 md:p-5 mt-4">
          <div className="text-muted-foreground text-[11px] mb-3.5 uppercase">📅 Mois clôturés</div>
          <div className="space-y-2">
            {history.map((h) => {
              // Check if next month is closed
              const nextMois = h.mois === 11 ? 0 : h.mois + 1;
              const nextAnnee = h.mois === 11 ? h.annee + 1 : h.annee;
              const nextIsClosed = history.some((x) => x.mois === nextMois && x.annee === nextAnnee);
              const canReopen = !nextIsClosed;

              return (
                <div key={`${h.annee}-${h.mois}`} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border">
                  <div>
                    <div className="text-foreground text-xs font-bold">{MOIS[h.mois]} {h.annee}</div>
                    <div className="text-muted-foreground text-[10px]">
                      {h.nbEmployees} employés · Masse : {fmt(h.totaux.mass)} F · Net : {fmt(h.totaux.net)} F
                    </div>
                  </div>
                  <button
                    disabled={!canReopen}
                    onClick={() => {
                      if (canReopen && confirm(`Rouvrir ${MOIS[h.mois]} ${h.annee} ? Les données de clôture seront supprimées.`)) {
                        onReopenMonth(h.mois, h.annee);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-colors ${
                      canReopen
                        ? "bg-senpaie-yellow/20 text-senpaie-yellow hover:bg-senpaie-yellow/30"
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                    }`}
                    title={canReopen ? "Rouvrir ce mois" : `Impossible : ${MOIS[nextMois]} ${nextAnnee} est déjà clôturé`}
                  >
                    {canReopen ? "🔓 Rouvrir" : "🔒 Verrouillé"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
