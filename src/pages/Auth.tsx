import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
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

    if (isLogin) {
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-mono">
      <div className="w-full max-w-[400px] mx-4">
        <div className="text-center mb-8">
          <div className="text-primary text-2xl font-black tracking-[4px] mb-1">G-SENPAIE</div>
          <div className="text-muted-foreground text-[11px] tracking-wider">GESTION DE LA PAIE · SÉNÉGAL</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-foreground text-lg font-bold mb-5">
            {isLogin ? "Connexion" : "Créer un compte"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-muted-foreground text-[11px] font-semibold block mb-1.5">Nom complet</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Prénom Nom"
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-muted-foreground text-[11px] font-semibold block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-muted-foreground text-[11px] font-semibold block mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-primary transition-colors"
              />
            </div>

            {error && <div className="text-destructive text-[12px] bg-destructive/10 rounded-lg px-3 py-2">⚠ {error}</div>}
            {success && <div className="text-primary text-[12px] bg-primary/10 rounded-lg px-3 py-2">{success}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none disabled:opacity-50"
            >
              {submitting ? "…" : isLogin ? "Se connecter" : "Créer le compte"}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }}
              className="text-primary text-[12px] bg-transparent border-none cursor-pointer hover:underline"
            >
              {isLogin ? "Pas de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
