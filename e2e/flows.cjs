const { chromium } = require('playwright'); const { install, makeDb } = require('./mock.cjs');
const S = __dirname; require('fs').mkdirSync(S + '/sorties', { recursive: true });
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 850 }, acceptDownloads: true });
  const db = makeDb(), log = []; await install(ctx, db, log); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  const go = async n => { await p.locator('button', { hasText: n }).first().click(); await p.waitForTimeout(900); };
  const step = async (name, fn) => { const e0 = errs.length; try { await p.goto('http://127.0.0.1:5201/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); const r = await fn(); console.log('OK  ', name, r ?? ''); } catch (e) { console.log('KO  ', name, '->', e.message.split('\n')[0].slice(0, 160)); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1500); } await p.keyboard.press('Escape').catch(()=>{}); if (errs.length > e0) console.log('     erreurs JS:', errs.slice(e0).join(' | ')); };
  await p.goto('http://127.0.0.1:5201/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);

  await step('Bulletin salarié (modal) + PDF', async () => {
    await go('Employés'); await p.locator('main button', { hasText: '📄' }).nth(2).click(); await p.waitForTimeout(1500);
    const t = (await p.locator('body').innerText()).replace(/\s+/g, ' ');
    await p.screenshot({ path: S + '/sorties/f-bulletin.png' });
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.getByRole('button', { name: /PDF/ }).first().click()]);
    await d.saveAs(S + '/f-bulletin.pdf'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    return d.suggestedFilename() + ' | ' + (/NET À PAYER/i.test(t) ? 'net présent' : 'net absent');
  });
  await step('Clôture du mois + e-mails + régularisation + réouverture', async () => {
    const out = [];
    await go('Entreprise'); await p.getByRole('button', { name: /Clôturer le mois/ }).click(); await p.waitForTimeout(600);
    await p.screenshot({ path: S + '/sorties/f-confirm.png' });
    await p.getByRole('alertdialog').getByRole('button', { name: 'Confirmer' }).click(); await p.waitForTimeout(2500);
    out.push('history=' + (db.payroll_history || []).length, 'bulletins=' + (db.bulletins_mois || []).length);
    await p.screenshot({ path: S + '/sorties/f-cloture.png', fullPage: true });
    await p.getByRole('button', { name: /Prévenir les salariés/ }).click({ timeout: 5000 }).then(() => out.push('prévenir: ' + log.filter(l => /fonction/.test(l)).join(',')), () => out.push('bouton prévenir absent (aucun e-mail salarié ?)'));
    await p.waitForTimeout(1200);
    await p.locator('button', { hasText: 'Déclarations' }).first().click(); await p.waitForTimeout(800);
    await p.getByRole('button', { name: /Régularisation/ }).first().click(); await p.waitForTimeout(800);
    const rb = p.getByRole('button', { name: /Reporter sur le bulletin/ });
    if (await rb.count()) { await rb.first().click(); await p.waitForTimeout(500); await p.getByRole('alertdialog').getByRole('button', { name: 'Confirmer' }).click(); await p.waitForTimeout(1500); out.push('regul reportée'); } else out.push('pas de bouton report');
    await p.locator('button', { hasText: 'Tableau de bord' }).first().click(); await p.waitForTimeout(900);
    await p.screenshot({ path: S + '/sorties/f-dash-clos.png', fullPage: true });
    return out.join(' | ');
  });
  await step('Déclarations : onglets', async () => {
    await p.keyboard.press('Escape'); await go('Déclarations'); const out = [];
    for (const tab of ['Impôts', 'Livre de paie', 'DADS', 'Régularisation']) { await p.getByRole('button', { name: new RegExp(tab) }).first().click(); await p.waitForTimeout(700); out.push(tab + ':' + (await p.locator('main table').count()) + 't'); }
    await p.screenshot({ path: S + '/sorties/f-regul.png', fullPage: true }); return out.join(' ');
  });
  await step('Cotisations', async () => { await go('Cotisations'); return (await p.locator('main table tbody tr').count()) + ' lignes'; });
  await step('Congé : nouvelle demande', async () => {
    await go('Congés & absences'); await p.getByRole('button', { name: /Nouvelle demande/ }).click(); await p.waitForTimeout(500);
    const dts = p.locator('input[type=date]'); await dts.nth(0).fill('2026-12-07'); await dts.nth(1).fill('2026-12-11');
    await p.screenshot({ path: S + '/sorties/f-conge.png' }); await p.getByRole('button', { name: /Enregistrer/ }).last().click(); await p.waitForTimeout(1200);
    return (db.conges || []).length + ' congé(s) en base';
  });
  await step('Contrat : nouveau + PDF', async () => {
    await go('Contrats'); await p.getByRole('button', { name: /Nouveau/ }).first().click(); await p.waitForTimeout(600);
    const sel = p.locator('select').first(); await sel.selectOption({ index: 1 }); await p.locator('input[type=date]').first().fill('2026-01-05'); await p.waitForTimeout(300);
    await p.getByRole('button', { name: /Enregistrer/ }).last().click(); await p.waitForTimeout(1200);
    const n = (db.contrats || []).length; const pdfBtn = p.locator('main button', { hasText: /PDF|📄|⬇/ }).first();
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), pdfBtn.click()]); return n + ' contrat(s), ' + d.suggestedFilename();
  });
  await step('Sorties : STC + PDF', async () => {
    await go('Sorties & STC'); await p.locator('main button', { hasText: /Diallo|Ndiaye|Sarr|Fall|Gueye/ }).first().click(); await p.waitForTimeout(900);
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.getByRole('button', { name: /PDF STC/ }).click()]); return d.suggestedFilename();
  });
  await step('Avances & prêts : nouvelle avance', async () => {
    await go('Avances & prêts'); await p.getByRole('button', { name: /Nouvelle|Nouveau|Ajouter/ }).first().click(); await p.waitForTimeout(600);
    await p.screenshot({ path: S + '/sorties/f-avance.png' }); const t = (await p.locator('body').innerText()).replace(/\s+/g, ' '); return t.match(/(Montant|Employé)[^.]{0,80}/)?.[0];
  });
  await step('Simulateur', async () => { await go('Simulateur'); const i = p.locator('main input[type=number]').first(); await i.fill('500000'); await p.waitForTimeout(600); return (await p.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 140); });
  await step('Paramètres : enregistrer', async () => { await go('Paramètres'); await p.locator('main button', { hasText: 'Enregistrer' }).first().click(); await p.waitForTimeout(1000); return (db.payroll_params || []).length + ' ligne(s) params'; });
  await step('Entreprise : enregistrer', async () => { await go('Entreprise'); await p.locator('main button', { hasText: /nregistrer/ }).first().click(); await p.waitForTimeout(1000); return db.entreprises[0].nom; });
  await step('Équipe', async () => { await go('Équipe'); return (await p.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 90); });
  await step('Assistant IA : question', async () => { await go('Assistant IA'); const ta = p.locator('main textarea, main input[type=text]').first(); await ta.fill('Quel est le SMIG ?'); await p.keyboard.press('Enter'); await p.waitForTimeout(1500); return (await p.locator('main').innerText()).replace(/\s+/g, ' ').slice(-120); });
  console.log('FIN erreurs JS:', errs.length); errs.slice(0, 6).forEach(e => console.log(' ', e)); await b.close();
})();
