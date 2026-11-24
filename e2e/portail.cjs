const { chromium } = require('playwright'); const { install, makeDb } = require('./mock.cjs'); const S = __dirname; require('fs').mkdirSync(S + '/sorties', { recursive: true });
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, acceptDownloads: true });
 const db = makeDb(), log = []; await install(ctx, db, log); const p = await ctx.newPage(); const errs = [];
 p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/net::/.test(m.text())) errs.push(m.text().slice(0, 160)); });
 await p.goto('http://127.0.0.1:5201/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
 await p.locator('button', { hasText: 'Entreprise' }).first().click(); await p.waitForTimeout(800);
 await p.getByRole('button', { name: /Clôturer le mois/ }).click(); await p.waitForTimeout(500); await p.getByRole('alertdialog').getByRole('button', { name: 'Confirmer' }).click(); await p.waitForTimeout(2000);
 console.log('bulletins figés:', (db.bulletins_mois || []).length);
 db.entreprise_members[0].role = 'employe'; await p.goto('http://127.0.0.1:5201/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
 await p.screenshot({ path: S + '/sorties/p-portail.png', fullPage: true });
 const t = (await p.locator('body').innerText()).replace(/\s+/g, ' '); console.log('PORTAIL:', t.slice(0, 260));
 const btn = p.getByRole('button', { name: /Voir|Ouvrir|Bulletin/ }).first(); console.log('bouton bulletin:', await btn.count());
 if (await btn.count()) { await btn.click(); await p.waitForTimeout(1200); await p.screenshot({ path: S + '/sorties/p-bulletin.png' }); console.log('bulletin figé affiché:', /NET À PAYER/i.test(await p.locator('body').innerText())); }
 console.log('erreurs JS', errs); await b.close(); })();
