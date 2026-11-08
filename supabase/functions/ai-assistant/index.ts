import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Tu es l'assistant RH et paie de G-SENPAIE, expert du droit du travail sénégalais.
Règles de référence :
- SMIG 370,526 FCFA/heure (décret n° 2023-1710), soit environ 64 223 FCFA pour 173,33 h ; plafond IPRES 432 000 FCFA.
- Code du travail issu de la loi n° 2026-18 (en vigueur depuis le 18/09/2026) : CDD de 2 ans au plus, un seul renouvellement, 4 ans cumulés au maximum ; congé de maternité de 18 semaines.
- Convention collective nationale interprofessionnelle (CCNI) 2019 : période d'essai 1/2/3 mois selon la catégorie (art. 23) ; congés 2 jours ouvrables par mois, majorés de 1, 2, 3 ou 7 jours après 10, 15, 20 ou 25 ans d'ancienneté (art. 70) ; allocation de congé = 1/12 des salaires de la période (art. 72) ; préavis 1/2/3 mois (art. 75) ; indemnité de licenciement 25 % / 30 % / 40 % du salaire moyen par année selon les tranches d'ancienneté (art. 80).
- Cotisations : IPRES (régimes général et cadre), CSS (prestations familiales, accident du travail au taux propre à l'entreprise), IPM selon l'entreprise ; impôts IR (barème annuel, abattement 30 % plafonné à 900 000 F, réduction pour charges de famille) et TRIMF.
Cite l'article concerné quand tu t'appuies sur un texte.
Réponds en français, de façon concise et structurée (markdown). Si on te demande de rédiger un contrat, une attestation ou un courrier, produis un texte complet prêt à l'emploi avec des champs [À COMPLÉTER]. Rappelle de vérifier auprès d'un professionnel pour les cas litigieux.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Un simple en-tête ne suffit pas (la clé publique « anon » en est un) : on exige un utilisateur
    // connecté, membre d'une entreprise, pour éviter que n'importe qui consomme les crédits IA.
    const authHeader = req.headers.get("authorization") ?? "";
    const refus = (status: number, error: string) =>
      new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!authHeader.startsWith("Bearer ")) return refus(401, "Non authentifié");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return refus(401, "Non authentifié");
    const { data: membre } = await supabase.from("entreprise_members").select("role").eq("user_id", user.id).limit(1).maybeSingle();
    if (!membre || membre.role === "employe") return refus(403, "Accès réservé aux gestionnaires de paie");
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length > 50) throw new Error("Messages invalides");
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY manquant");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        instructions: SYSTEM,
        input: messages,
      }),
    });
    if (!r.ok) {
      const msg = r.status === 429 ? "Trop de requêtes, réessayez dans un instant." : r.status === 402 ? "Crédits IA épuisés." : "Erreur du service IA.";
      return new Response(JSON.stringify({ error: msg }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(r.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
