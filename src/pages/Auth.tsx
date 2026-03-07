import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-primary text-lg font-bold animate-pulse">Chargement…</div>
    </div>
  );

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setSuccess("✅ Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.");
      setSubmitting(false);
      return;
    }

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (!fullName.trim()) { setError("Le nom est requis"); setSubmitting(false); return; }
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error);
      else setSuccess("✅ Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
    }
    setSubmitting(false);
  };

  const switchMode = (newMode: "login" | "signup" | "forgot") => {
    setMode(newMode);
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-mono">
      <div className="w-full max-w-[400px] mx-4">
        <div className="text-center mb-8">
          <div className="text-primary text-2xl font-black tracking-[4px] mb-1">G-SENPAIE</div>
          <div className="text-muted-foreground text-[11px] tracking-wider">GESTION DE LA PAIE · SÉNÉGAL</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-foreground text-lg font-bold mb-5">
            {mode === "login" ? "Connexion" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-muted-foreground text-[11px] font-semibold block mb-1.5">Nom complet</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Prénom Nom"
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-primary transition-colors" />
              </div>
            )}

            <div>
              <label className="text-muted-foreground text-[11px] font-semibold block mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-primary transition-colors" />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="text-muted-foreground text-[11px] font-semibold block mb-1.5">Mot de passe</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-primary transition-colors" />
              </div>
            )}

            {error && <div className="text-destructive text-[12px] bg-destructive/10 rounded-lg px-3 py-2">⚠ {error}</div>}
            {success && <div className="text-primary text-[12px] bg-primary/10 rounded-lg px-3 py-2">{success}</div>}

            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none disabled:opacity-50">
              {submitting ? "…" : mode === "login" ? "Se connecter" : mode === "signup" ? "Créer le compte" : "Envoyer le lien"}
            </button>
          </form>

          {mode === "login" && (
            <div className="text-center mt-3">
              <button onClick={() => switchMode("forgot")}
                className="text-muted-foreground text-[11px] bg-transparent border-none cursor-pointer hover:text-primary hover:underline">
                Mot de passe oublié ?
              </button>
            </div>
          )}

          <div className="text-center mt-4">
            {mode === "forgot" ? (
              <button onClick={() => switchMode("login")}
                className="text-primary text-[12px] bg-transparent border-none cursor-pointer hover:underline">
                ← Retour à la connexion
              </button>
            ) : (
              <button onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-primary text-[12px] bg-transparent border-none cursor-pointer hover:underline">
                {mode === "login" ? "Pas de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
