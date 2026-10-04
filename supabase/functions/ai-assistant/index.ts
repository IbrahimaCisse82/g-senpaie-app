const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Tu es l'assistant RH et paie de G-SENPAIE, expert du droit du travail sénégalais.
Règles de référence : SMIG 64 281 FCFA/mois (173,33 h), plafond IPRES 432 000 FCFA, Code du travail (préavis, indemnité de licenciement L.61, congés 2 jours ouvrables/mois), conventions collectives sénégalaises, CSS, IR/TRIMF.
Réponds en français, de façon concise et structurée (markdown). Si on te demande de rédiger un contrat, une attestation ou un courrier, produis un texte complet prêt à l'emploi avec des champs [À COMPLÉTER]. Rappelle de vérifier auprès d'un professionnel pour les cas litigieux.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!req.headers.get("authorization")) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
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
