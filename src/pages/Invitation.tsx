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
      const { data, error } = await supabase.functions.invoke("accept-invitation", { body: { token } });
      const res = data as { ok?: boolean; error?: string; expected?: string } | null;
      if (error || !res?.ok) {
        const code = res?.error;
        if (code === "expired") setStatus("expired");
        else if (code === "wrong_email") {
          setStatus("wrong_email");
          setMsg(`Cette invitation est pour ${res?.expected}, vous êtes connecté en tant que ${user.email}.`);
        } else { setStatus("invalid"); setMsg(code || error?.message || ""); }
        return;
      }
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