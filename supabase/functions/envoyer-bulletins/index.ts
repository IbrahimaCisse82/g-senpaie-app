// Envoi par e-mail de l'avis de mise à disposition des bulletins clôturés.
// Le message ne contient aucun montant : le salarié consulte et télécharge son bulletin
// dans son espace salarié, après connexion.
//
// Secrets à définir dans le projet : RESEND_API_KEY (obligatoire) et
// BULLETINS_FROM (expéditeur vérifié chez Resend, ex. « Paie <paie@votre-domaine.sn> »).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const ROLES_AUTORISES = ['admin', 'drh', 'comptable'];
const esc = (s: string) => String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] as string));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authentification requise' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Session expirée' }, 401);

    const { entrepriseId, mois, annee, renvoyer } = (await req.json()) ?? {};
    if (!entrepriseId || !Number.isInteger(mois) || mois < 0 || mois > 11 || !Number.isInteger(annee)) {
      return json({ error: 'Paramètres invalides' }, 400);
    }

    const admin = createClient(url, serviceKey);
    const { data: mem } = await admin.from('entreprise_members')
      .select('role').eq('entreprise_id', entrepriseId).eq('user_id', user.id).maybeSingle();
    if (!mem || !ROLES_AUTORISES.includes(mem.role)) return json({ error: 'Accès refusé' }, 403);

    const cle = Deno.env.get('RESEND_API_KEY');
    if (!cle) {
      return json({ ok: false, code: 'non_configure', message: "L'envoi d'e-mails n'est pas encore configuré (clé RESEND_API_KEY absente)." });
    }
    const expediteur = Deno.env.get('BULLETINS_FROM') ?? 'G-SenPaie <onboarding@resend.dev>';

    const { data: ent } = await admin.from('entreprises').select('nom').eq('id', entrepriseId).maybeSingle();
    const societe = ent?.nom || 'Votre employeur';
    const origine = (req.headers.get('origin') ?? req.headers.get('referer') ?? '').replace(/\/$/, '');
    const lien = origine ? `${origine}/auth` : '';

    const statuts = renvoyer ? ['en_attente', 'echec', 'envoye'] : ['en_attente', 'echec'];
    const { data: bulletins, error } = await admin.from('bulletins_mois')
      .select('id, nom_complet, email, statut_envoi')
      .eq('entreprise_id', entrepriseId).eq('mois', mois).eq('annee', annee)
      .in('statut_envoi', statuts).not('email', 'is', null);
    if (error) return json({ error: error.message }, 400);

    const periode = `${MOIS[mois]} ${annee}`;
    let envoyes = 0, echecs = 0;
    for (const b of bulletins ?? []) {
      const prenom = String(b.nom_complet || '').split(' ')[0];
      const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111;line-height:1.5">
        <p>Bonjour ${esc(prenom)},</p>
        <p>Votre bulletin de paie de <strong>${esc(periode)}</strong> est disponible dans votre espace salarié.</p>
        ${lien ? `<p><a href="${esc(lien)}" style="background:#16a34a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">Ouvrir mon espace salarié</a></p>` : ''}
        <p style="font-size:12px;color:#555">Si vous n'avez pas encore de compte, demandez une invitation à votre service des ressources humaines.<br/>
        Pour votre sécurité, ce message ne contient aucun montant.</p>
        <p>${esc(societe)}</p></div>`;
      let erreur: string | null = null;
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: expediteur, to: [b.email], subject: `Votre bulletin de paie de ${periode}`, html }),
        });
        if (!r.ok) erreur = `Resend ${r.status} : ${(await r.text()).slice(0, 300)}`;
      } catch (e) {
        erreur = (e as Error).message;
      }
      await admin.from('bulletins_mois').update(
        erreur ? { statut_envoi: 'echec', erreur } : { statut_envoi: 'envoye', envoye_at: new Date().toISOString(), erreur: null },
      ).eq('id', b.id);
      if (erreur) echecs++; else envoyes++;
    }
    return json({ ok: true, envoyes, echecs, total: (bulletins ?? []).length });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
