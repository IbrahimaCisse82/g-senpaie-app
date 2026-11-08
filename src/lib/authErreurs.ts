/** Traduit les messages d'erreur d'authentification (Supabase renvoie de l'anglais) */
const MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, "E-mail ou mot de passe incorrect."],
  [/email not confirmed/i, "Adresse e-mail non confirmée : cliquez sur le lien reçu par e-mail."],
  [/user already registered|already been registered/i, "Un compte existe déjà avec cette adresse e-mail."],
  [/password should be at least|weak password/i, "Mot de passe trop faible : 6 caractères minimum, mélangez lettres et chiffres."],
  [/rate limit|too many requests/i, "Trop de tentatives. Patientez quelques minutes avant de réessayer."],
  [/unable to validate email|invalid email/i, "Adresse e-mail invalide."],
  [/network|failed to fetch/i, "Connexion impossible au serveur. Vérifiez votre connexion Internet."],
  [/token has expired|otp expired|link is invalid/i, "Lien expiré ou invalide : refaites une demande."],
];
export function traduireErreurAuth(message: string | undefined | null): string {
  const m = message || "";
  for (const [re, fr] of MESSAGES) if (re.test(m)) return fr;
  return m || "Une erreur est survenue. Réessayez.";
}
