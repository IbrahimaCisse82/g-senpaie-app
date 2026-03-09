import { fmt } from "@/lib/payroll";

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: "primary" | "blue" | "yellow" | "purple";
}

const colorMap = {
  primary: "border-t-primary text-primary",
  blue: "border-t-senpaie-blue text-senpaie-blue",
  yellow: "border-t-senpaie-yellow text-senpaie-yellow",
  purple: "border-t-senpaie-purple text-senpaie-purple",
};

export function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-5 border-t-[3px] ${colorMap[color]}`}>
      <div className="text-xl mb-1.5">{icon}</div>
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-base md:text-lg font-extrabold ${colorMap[color].split(" ").pop()}`}>{value}</div>
      {sub && <div className="text-senpaie-dim text-[11px] mt-1 hidden sm:block">{sub}</div>}
    </div>
  );
}

export default StatCard;
