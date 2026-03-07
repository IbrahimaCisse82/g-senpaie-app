import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono">
        <div className="w-full max-w-[400px] mx-4 text-center">
          <div className="text-primary text-2xl font-black tracking-[4px] mb-4">G-SENPAIE</div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-muted-foreground text-sm">Vérification en cours…</p>
            <p className="text-muted-foreground text-xs mt-2">Si vous n'êtes pas redirigé, vérifiez le lien reçu par email.</p>
            <button onClick={() => navigate("/auth")} className="mt-4 text-primary text-xs hover:underline bg-transparent border-none cursor-pointer">
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-mono">
      <div className="w-full max-w-[400px] mx-4">
        <div className="text-center mb-8">
          <div className="text-primary text-2xl font-black tracking-[4px] mb-1">G-SENPAIE</div>
          <div className="text-muted-foreground text-[11px] tracking-wider">RÉINITIALISATION DU MOT DE PASSE</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          {success ? (
            <div className="text-center">
              <div className="text-primary text-[13px] bg-primary/10 rounded-lg px-3 py-3 mb-3">
                ✅ Mot de passe modifié avec succès ! Redirection…
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-foreground text-lg font-bold mb-2">Nouveau mot de passe</h2>
              <div>
                <label className="text-muted-foreground text-[11px] font-semibold block mb-1.5">Nouveau mot de passe</label>
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
              <div>
                <label className="text-muted-foreground text-[11px] font-semibold block mb-1.5">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-primary transition-colors"
                />
              </div>
              {error && <div className="text-destructive text-[12px] bg-destructive/10 rounded-lg px-3 py-2">⚠ {error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none disabled:opacity-50"
              >
                {loading ? "…" : "Modifier le mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
