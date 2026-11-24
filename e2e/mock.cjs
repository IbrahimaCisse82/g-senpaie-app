// Faux Supabase en mémoire pour Playwright (sans RLS)
const REF = 'lihhsfwizkmiygqkfknn';
const uid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
const USER = { id: '11111111-1111-4111-8111-111111111111', email: 'demo@g-senpaie.app', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { full_name: 'Démo' }, created_at: '2026-01-01T00:00:00Z' };
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const TOKEN = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: USER.id, role: 'authenticated', exp: 4102444800 }) + '.sig';
const SESSION = { access_token: TOKEN, refresh_token: 'r', token_type: 'bearer', expires_in: 99999999, expires_at: 4102444800, user: USER };
function makeDb() {
  const ENT = uid();
  return { entreprises: [{ id: ENT, user_id: USER.id, nom: 'GROW HUB SARL (démo)', ninea: '', adresse: 'Dakar' }],
    entreprise_members: [{ id: uid(), entreprise_id: ENT, user_id: USER.id, role: 'admin', joined_at: '2026-01-01T00:00:00Z' }],
    _ent: ENT };
}
function apply(rows, params) {
  let out = rows;
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue;
    const m = /^(\w+)\.(.*)$/.exec(v); if (!m) continue; const [, op, val] = m;
    if (op === 'eq') out = out.filter(r => String(r[k]) === val);
    else if (op === 'neq') out = out.filter(r => String(r[k]) !== val);
    else if (op === 'in') { const set = val.replace(/^\(|\)$/g, '').split(',').map(s => s.replace(/^"|"$/g, '')); out = out.filter(r => set.includes(String(r[k]))); }
    else if (op === 'is') out = out.filter(r => (val === 'null' ? r[k] == null : String(r[k]) === val));
    else if (op === 'gte') out = out.filter(r => r[k] >= val); else if (op === 'lte') out = out.filter(r => r[k] <= val);
    else if (op === 'ilike') { const re = new RegExp('^' + val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$', 'i'); out = out.filter(r => re.test(String(r[k] ?? ''))); }
  }
  const ord = params.find(([k]) => k === 'order');
  if (ord) { const [col, dir] = ord[1].split('.'); out = [...out].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (dir === 'desc' ? -1 : 1)); }
  const lim = params.find(([k]) => k === 'limit'); if (lim) out = out.slice(0, +lim[1]);
  return out;
}
async function install(context, db, log, opts = {}) {
  if (!opts.anon) await context.addInitScript(([k, s]) => { try { localStorage.setItem(k, s); } catch {} }, [`sb-${REF}-auth-token`, JSON.stringify(SESSION)]);
  await context.route(new RegExp(`https://${REF}\\.supabase\\.co/.*`), async route => {
    const req = route.request(); const url = new URL(req.url()); const p = url.pathname; const method = req.method();
    const json = (status, body, headers = {}) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', ...headers }, body: JSON.stringify(body) });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (p.startsWith('/auth/v1/')) {
      if (p.endsWith('/user')) return json(200, USER);
      if (p.endsWith('/logout')) return json(204, {});
      return json(200, SESSION);
    }
    if (p.startsWith('/functions/v1/')) { log.push(`fonction ${p.split('/').pop()}`); return json(200, { ok: true, sent: 3, failed: 0, total: 3 }); }
    if (p.startsWith('/storage/')) return json(200, {});
    if (p.startsWith('/rest/v1/rpc/')) return json(200, null);
    if (p.startsWith('/rest/v1/')) {
      const t = p.split('/').pop(); db[t] = db[t] || [];
      const params = [...url.searchParams.entries()]; const accept = req.headers()['accept'] || '';
      const single = accept.includes('vnd.pgrst.object');
      const wantRep = /return=representation/.test(req.headers()['prefer'] || '') || req.method() === 'GET';
      const reply = rows => single ? (rows.length ? json(200, rows[0]) : json(406, { code: 'PGRST116', message: 'no rows' })) : json(200, rows);
      if (method === 'GET' || method === 'HEAD') return reply(apply(db[t], params));
      if (method === 'POST') {
        let body = []; try { body = JSON.parse(req.postData() || '[]'); } catch {} if (!Array.isArray(body)) body = [body];
        const conflict = (url.searchParams.get('on_conflict') || '').split(',').filter(Boolean); const out = [];
        for (const r of body) {
          const ex = conflict.length ? db[t].find(x => conflict.every(c => x[c] === r[c])) : null;
          if (ex) { Object.assign(ex, r); out.push(ex); } else { const n = { id: uid(), created_at: new Date().toISOString(), ...r }; db[t].push(n); out.push(n); }
        }
        log.push(`INSERT ${t} x${out.length}`); return wantRep ? reply(out) : json(201, null);
      }
      if (method === 'PATCH') { let body = {}; try { body = JSON.parse(req.postData() || '{}'); } catch {} const rows = apply(db[t], params); rows.forEach(r => Object.assign(r, body)); log.push(`UPDATE ${t} x${rows.length}`); return wantRep ? reply(rows) : json(204, null); }
      if (method === 'DELETE') { const rows = apply(db[t], params); db[t] = db[t].filter(r => !rows.includes(r)); log.push(`DELETE ${t} x${rows.length}`); return json(204, null); }
    }
    return json(404, { message: 'inconnu ' + p });
  });
}
module.exports = { install, makeDb, USER };
