import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing auth' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !user.email) return json({ error: 'Not authenticated' }, 401);

    const { token } = await req.json();
    if (!token) return json({ error: 'Missing token' }, 400);

    const admin = createClient(url, serviceKey);

    const { data: inv, error: invErr } = await admin.from('entreprise_invitations')
      .select('id, entreprise_id, email, role, expires_at, accepted_at')
      .eq('token', token).maybeSingle();
    if (invErr) return json({ error: invErr.message }, 500);
    if (!inv) return json({ error: 'invalid' }, 404);
    if (inv.accepted_at) return json({ error: 'already_used' }, 409);
    if (new Date(inv.expires_at) < new Date()) return json({ error: 'expired' }, 410);
    if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
      return json({ error: 'wrong_email', expected: inv.email }, 403);
    }

    const { error: memErr } = await admin.from('entreprise_members').insert({
      entreprise_id: inv.entreprise_id, user_id: user.id, role: inv.role,
    });
    if (memErr && !/duplicate/i.test(memErr.message)) return json({ error: memErr.message }, 500);

    await admin.from('entreprise_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', inv.id);

    return json({ ok: true, entrepriseId: inv.entreprise_id, role: inv.role });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}