import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntrepriseCtx } from "@/hooks/useEntrepriseContext";

export default function Invitation() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { user, loading } = useAuth();
  const { refetch } = useEntrepriseCtx();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "invalid" | "expired" | "wrong_email" | "ok">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    if (loading) return;
    if (!user) {
      sessionStorage.setItem("pending_invitation", token);
      navigate("/auth", { replace: true });
      return;
    }
    (async () => {
      const { data: inv } = await supabase.from("entreprise_invitations" as never)
        .select("id, entreprise_id, email, role, expires_at, accepted_at")
        .eq("token", token).maybeSingle() as { data: { id: string; entreprise_id: string; email: string; role: string; expires_at: string; accepted_at: string | null } | null };

      if (!inv || inv.accepted_at) { setStatus("invalid"); return; }
      if (new Date(inv.expires_at) < new Date()) { setStatus("expired"); return; }
      if (user.email?.toLowerCase() !== inv.email.toLowerCase()) {
        setStatus("wrong_email");
        setMsg(`Cette invitation est pour ${inv.email}, vous êtes connecté en tant que ${user.email}.`);
        return;
      }

      const { error: memErr } = await supabase.from("entreprise_members" as never).insert({
        entreprise_id: inv.entreprise_id, user_id: user.id, role: inv.role, invited_by: null,
      } as never);
      if (memErr && !memErr.message.includes("duplicate")) { setStatus("invalid"); setMsg(memErr.message); return; }

      await supabase.from("entreprise_invitations" as never).update({ accepted_at: new Date().toISOString() } as never).eq("id", inv.id);
      sessionStorage.removeItem("pending_invitation");
      await refetch();
      setStatus("ok");
      setTimeout(() => navigate("/", { replace: true }), 1500);
    })();
  }, [token, user, loading, navigate, refetch]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-mono">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full">
        <h1 className="text-primary text-xl font-black mb-4">✉️ Invitation</h1>
        {status === "loading" && <div className="text-muted-foreground text-sm">Traitement…</div>}
        {status === "invalid" && <div className="text-destructive text-sm">Invitation invalide ou déjà utilisée. {msg}</div>}
        {status === "expired" && <div className="text-destructive text-sm">Cette invitation a expiré.</div>}
        {status === "wrong_email" && <div className="text-destructive text-sm">{msg}</div>}
        {status === "ok" && <div className="text-primary text-sm font-bold">✅ Vous avez rejoint l'entreprise. Redirection…</div>}
      </div>
    </div>
  );
}