import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import authBg from "@/assets/auth-bg.jpg";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = async () => {
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(result.error.message || "Erreur Google");
  };

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
    <div className="min-h-screen flex font-mono">
      {/* Left: image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img src={authBg} alt="G-SENPAIE" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end h-full p-12">
          <div className="text-white text-3xl font-black tracking-[5px] mb-2">G-SENPAIE</div>
          <div className="text-white/70 text-sm max-w-md">
            La solution complète de gestion de la paie conforme à la législation sénégalaise. Simplifiez vos bulletins, cotisations et déclarations.
          </div>
          <div className="text-white/40 text-xs mt-4">Par Grow Hub SARL · Dakar, Sénégal</div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8 lg:hidden">
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

            {mode !== "forgot" && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider">ou</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="w-full py-2.5 bg-card border border-border text-foreground rounded-lg font-bold text-[13px] cursor-pointer flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.3 5.3C41 35 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"/>
                  </svg>
                  Continuer avec Google
                </button>
              </>
            )}

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

          <div className="text-center mt-6 space-x-4 text-[10px] text-muted-foreground">
            <Link to="/cgu" className="hover:text-primary transition-colors">CGU</Link>
            <span>·</span>
            <Link to="/confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
            <span>·</span>
            <Link to="/protection-donnees" className="hover:text-primary transition-colors">Protection des données</Link>
          </div>
          <div className="text-center mt-2 text-[9px] text-muted-foreground">
            © {new Date().getFullYear()} Grow Hub SARL · Dakar, Sénégal
          </div>
        </div>
      </div>
    </div>
  );
}
