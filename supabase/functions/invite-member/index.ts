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
    if (!user) return json({ error: 'Not authenticated' }, 401);

    const body = await req.json();
    const { entrepriseId, email, role } = body ?? {};
    if (!entrepriseId || !email || !role) return json({ error: 'Missing fields' }, 400);
    if (!['admin', 'drh', 'comptable', 'manager'].includes(role)) return json({ error: 'Invalid role' }, 400);
    const emailNorm = String(email).toLowerCase().trim();

    const admin = createClient(url, serviceKey);

    // Verify caller is admin of the entreprise
    const { data: mem } = await admin.from('entreprise_members')
      .select('role').eq('entreprise_id', entrepriseId).eq('user_id', user.id).maybeSingle();
    if (!mem || mem.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    // Upsert invitation (reuse token if pending)
    const { data: existing } = await admin.from('entreprise_invitations')
      .select('id, token, accepted_at')
      .eq('entreprise_id', entrepriseId).eq('email', emailNorm)
      .is('accepted_at', null).maybeSingle();

    let token: string;
    if (existing) {
      token = existing.token;
      await admin.from('entreprise_invitations').update({
        role, invited_by: user.id, expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
      }).eq('id', existing.id);
    } else {
      const { data: inserted, error: insErr } = await admin.from('entreprise_invitations').insert({
        entreprise_id: entrepriseId, email: emailNorm, role, invited_by: user.id,
      }).select('token').single();
      if (insErr) return json({ error: insErr.message }, 400);
      token = inserted.token;
    }

    const origin = req.headers.get('origin') ?? req.headers.get('referer')?.replace(/\/$/, '') ?? '';
    const inviteUrl = `${origin}/invitation?token=${token}`;

    // Send Supabase auth invite email (built-in template) with redirect to the invitation page
    const { error: mailErr } = await admin.auth.admin.inviteUserByEmail(emailNorm, { redirectTo: inviteUrl });
    const emailSent = !mailErr || /already been registered|already exists/i.test(mailErr.message);

    return json({ ok: true, token, inviteUrl, emailSent, emailError: mailErr?.message ?? null });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}