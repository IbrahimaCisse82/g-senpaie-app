const { chromium } = require('playwright'); const { install, makeDb } = require('./mock.cjs'); const S = __dirname; require('fs').mkdirSync(S + '/sorties', { recursive: true });
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
 const db = makeDb(), log = []; await install(ctx, db, log); const p = await ctx.newPage(); const errs = [];
 p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/net::/.test(m.text())) errs.push(m.text().slice(0, 160)); });
 await p.goto('http://127.0.0.1:5201/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
 await p.locator('button', { hasText: 'Employés' }).first().click(); await p.waitForTimeout(800);
 await p.getByRole('button', { name: /Nouvel Employé/ }).click(); await p.waitForTimeout(800);

 const F = (re) => p.locator('label', { hasText: re }).first().locator('xpath=following::*[self::input or self::select or self::textarea][1]');
 const step = async (n, fn) => { try { console.log('OK  ', n, (await fn()) ?? ''); } catch (e) { console.log('KO  ', n, '->', e.message.split('\n')[0].slice(0, 150)); } };
 await step('Validation : enregistrer un formulaire vide', async () => { await p.getByRole('button', { name: /Enregistrer|Créer|Ajouter/ }).last().click(); await p.waitForTimeout(600); const t = (await p.locator('body').innerText()).replace(/\s+/g, ' '); await p.screenshot({ path: S + '/sorties/c-vide.png' }); return (t.match(/(requis|obligatoire|invalide)[^.]{0,60}/i) || ['aucun message'])[0] + ' | en base: ' + db.employees.length; });
 await step('Création : Cheikh Ba', async () => {
  await F(/^Matricule/i).fill('TEST-001'); await F(/^Prénom/i).fill('Cheikh'); await F(/^Nom \*/i).fill('Ba'); await F(/^Fonction/i).fill('Chauffeur');
  await F(/^Date d'entrée/i).fill('2026-03-01'); await F(/^Salaire de base/i).fill('150000'); await F(/^Email/i).fill('cheikh.ba@exemple.sn');
  await p.getByRole('button', { name: /Enregistrer|Créer|Ajouter/ }).last().click(); await p.waitForTimeout(1500);
  const e = db.employees.find(x => x.matricule === 'TEST-001'); return e ? 'créé, salaire=' + (e.salaire_base ?? e.salaireBase) : 'non créé : ' + (await p.locator('body').innerText()).replace(/\s+/g, ' ').match(/⚠️[^|]{0,100}/)?.[0];
 });
 await step('Doublon de matricule refusé', async () => { await p.getByRole('button', { name: /Nouvel Employé/ }).click(); await p.waitForTimeout(500); await F(/^Matricule/i).fill('TEST-001'); await F(/^Prénom/i).fill('X'); await F(/^Nom \*/i).fill('Y'); await F(/^Fonction/i).fill('Z'); await F(/^Date d'entrée/i).fill('2026-03-01'); await F(/^Salaire de base/i).fill('100000'); await p.getByRole('button', { name: /Enregistrer|Créer|Ajouter/ }).last().click(); await p.waitForTimeout(1000); const n = db.employees.filter(x => x.matricule === 'TEST-001').length; await p.keyboard.press('Escape'); return n + ' fiche(s) TEST-001'; });
 await p.goto('http://127.0.0.1:5201/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); await p.locator('button', { hasText: 'Employés' }).first().click(); await p.waitForTimeout(800);
 await step('Modification : salaire 180 000', async () => { await p.getByPlaceholder(/Rechercher/).fill('TEST-001'); await p.waitForTimeout(400); await p.locator('main button', { hasText: '✏️' }).first().click(); await p.waitForTimeout(600); await F(/^Salaire de base/i).fill('180000'); await p.getByRole('button', { name: /Enregistrer|Mettre|Modifier/ }).last().click(); await p.waitForTimeout(1200); const e = db.employees.find(x => x.matricule === 'TEST-001'); return 'salaire en base=' + (e.salaire_base ?? e.salaireBase); });
 await step('Recherche', async () => { await p.getByPlaceholder(/Rechercher/).fill('Cheikh'); await p.waitForTimeout(500); return (await p.locator('main').innerText()).replace(/\s+/g, ' ').match(/\d+ employés? affichés? sur \d+/)?.[0]; });
 await step('Suppression', async () => { await p.getByPlaceholder(/Rechercher/).fill('TEST-001'); await p.waitForTimeout(400); await p.locator('main button', { hasText: '🗑' }).first().click(); await p.waitForTimeout(600); await p.screenshot({ path: S + '/sorties/c-suppr.png' }); await p.getByRole('button', { name: /Supprimer|Confirmer|Oui/ }).last().click(); await p.waitForTimeout(1200); return 'restants: ' + db.employees.filter(x => x.matricule === 'TEST-001').length; });
 console.log('erreurs JS', errs);
 await b.close(); console.log('erreurs', errs); })();
