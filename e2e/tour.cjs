const S = __dirname; require('fs').mkdirSync(S + '/sorties', { recursive: true });
const { chromium } = require('playwright'); const { install, makeDb } = require('./mock.cjs');
const NAV = ['Tableau de bord','Employés','Congés & absences','Contrats','Cotisations','Déclarations','Sorties & STC','Avances & prêts','Tendances','Simulateur','Assistant IA','Conventions','Équipe','Entreprise','Paramètres'];
(async () => {
  const mobile = process.argv[2] === 'mobile';
  const b = await chromium.launch(); const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 800 }, deviceScaleFactor: 1 } : { viewport: { width: 1366, height: 850 } });
  const db = makeDb(), log = []; await install(ctx, db, log);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|Failed to load resource: net::/.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:5201/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  console.log('URL', p.url(), '| texte:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 120));
  for (const n of NAV) {
    const before = errs.length;
    if (mobile) { await p.locator('button', { hasText: '☰' }).first().click().catch(() => {}); await p.waitForTimeout(400); }
    const el = p.locator('button', { hasText: n }).first();
    if (!(await el.count())) { console.log('NAV absent:', n); continue; }
    await el.click({ timeout: 4000 }).catch(e => console.log('clic KO', n)); await p.waitForTimeout(900);
    const t = (await p.locator('main').innerText().catch(() => '')).replace(/\s+/g, ' ');
    const f = n.replace(/[^A-Za-z]/g, '').slice(0, 12);
    await p.screenshot({ path: `${S}/sorties/${mobile ? 'm-' : ''}${f}.png`, fullPage: true });
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); console.log(n.padEnd(20), ov > 2 ? 'DEBORDE +' + ov + 'px' : 'largeur ok', 'len', String(t.length).padStart(5), errs.length > before ? 'ERREURS: ' + errs.slice(before).join(' | ') : 'ok', '|', t.slice(0, 70));
  }
  console.log('REQUETES', JSON.stringify(log.reduce((a, l) => (a[l] = (a[l] || 0) + 1, a), {})));
  console.log('TOTAL ERREURS', errs.length); errs.slice(0, 8).forEach(e => console.log(' ', e));
  await b.close();
})();
