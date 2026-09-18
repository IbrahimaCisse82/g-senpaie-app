import { useEffect, useMemo, useRef, useState } from "react";
import type { AppAlert } from "@/lib/alerts";

interface NotificationCenterProps {
  alerts: AppAlert[];
}

const READ_KEY = "senpaie_notifs_read";

function loadRead(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function NotificationCenter({ alerts }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>(loadRead);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = useMemo(() => alerts.filter((a) => !read.includes(a.id)), [alerts, read]);

  const markAllRead = () => {
    const ids = alerts.map((a) => a.id);
    setRead(ids);
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Centre de notifications"
        className="relative bg-transparent border-none cursor-pointer text-base p-1 leading-none transition-transform duration-200 hover:scale-110"
      >
        <span className={unread.length > 0 ? "inline-block animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]" : ""}>🔔</span>
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-black flex items-center justify-center">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-[290px] max-h-[340px] overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-[300] animate-scale-in origin-top-right">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border sticky top-0 bg-card">
            <span className="text-foreground text-[11px] font-extrabold uppercase tracking-wider">Notifications</span>
            {alerts.length > 0 && (
              <button onClick={markAllRead} className="text-primary bg-transparent border-none cursor-pointer text-[10px] font-bold hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="px-3 py-6 text-center text-muted-foreground text-[11px]">✅ Aucune alerte en cours</div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className={`px-3 py-2.5 border-b border-border last:border-b-0 text-[11px] leading-relaxed transition-colors ${
                  read.includes(a.id) ? "text-muted-foreground" : "text-foreground bg-secondary/30"
                }`}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle ${
                    a.type === "danger" ? "bg-destructive" : a.type === "warning" ? "bg-senpaie-yellow" : "bg-senpaie-blue"
                  }`}
                />
                {a.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
