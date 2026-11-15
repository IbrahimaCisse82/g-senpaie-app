// Compte de démonstration public : identifiants volontairement connus de tous.
// Ne jamais y saisir de données réelles. Modifiable par variables d'environnement.
import { supabase } from "@/integrations/supabase/client";

export const DEMO_EMAIL: string = import.meta.env.VITE_DEMO_EMAIL || "demo@g-senpaie.app";
const DEMO_PASSWORD: string = import.meta.env.VITE_DEMO_PASSWORD || "Demo-GSenPaie-2026";

export const estCompteDemo = (email: string | null | undefined) => (email || "").toLowerCase() === DEMO_EMAIL.toLowerCase();

/**
 * Ouvre une session sur le compte de démonstration. S'il n'existe pas encore, il est créé
 * (possible seulement si la confirmation d'e-mail est désactivée ; sinon l'administrateur
 * doit créer le compte une fois, avec ces identifiants, depuis la console du projet).
 */
export async function connexionDemo(): Promise<{ error: string | null }> {
  const premier = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  if (!premier.error) return { error: null };
  const creation = await supabase.auth.signUp({
    email: DEMO_EMAIL, password: DEMO_PASSWORD,
    options: { data: { full_name: "Compte Démo" }, emailRedirectTo: window.location.origin },
  });
  if (!creation.error && creation.data.session) return { error: null };
  const second = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  if (!second.error) return { error: null };
  return { error: "Le compte de démonstration n'est pas encore activé. Créez un compte gratuit ou réessayez plus tard." };
}
