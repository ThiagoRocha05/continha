// Teste dos geradores de perguntas da Continha: roda no navegador e confere milhares de perguntas.
const { chromium } = require('playwright');
const URL = 'file://' + process.cwd() + '/index.html';
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL);
  const res = await pg.evaluate(() => {
    const bad = [];
    for (const skill of Object.keys(Q)) for (let t = 0; t < 3; t++) for (let i = 0; i < 400; i++) {
      let q;
      try { q = Q[skill](t); } catch (e) { bad.push(`${skill} t${t}: erro ${e.message}`); break; }
      if (q.kind === 'trace') continue;
      const opts = q.options || [];
      const strs = opts.map(o => String(o));
      if (opts.length < 2) { bad.push(`${skill} t${t}: poucas opcoes`); break; }
      const n = opts.filter(o => o === q.correct).length;
      if (n !== 1) { bad.push(`${skill} t${t}: correta aparece ${n}x ${JSON.stringify(opts)}`); break; }
      if (new Set(strs).size !== strs.length) { bad.push(`${skill} t${t}: opcoes repetidas ${JSON.stringify(opts)}`); break; }
      const fs = q.fmt ? opts.map(o => String(q.fmt(o))) : strs;
      if (new Set(fs).size !== fs.length) { bad.push(`${skill} t${t}: repetidas apos fmt ${JSON.stringify(fs)}`); break; }
      const txt = (q.label || '') + (q.body || '') + fs.join(' ') + (q.say || '') + (q.explain || '');
      if (/NaN|undefined|\bnull\b|\[object/.test(txt)) { bad.push(`${skill} t${t}: texto invalido`); break; }
      if (typeof q.correct === 'number' && (q.correct < 0 || !Number.isFinite(q.correct))) { bad.push(`${skill} t${t}: resposta invalida ${q.correct}`); break; }
    }
    for (const [lv, list] of Object.entries(LEVEL_SKILLS)) for (const sk of list) {
      if (typeof Q[sk] !== 'function') bad.push(`LEVEL_SKILLS ${lv}: ${sk} nao existe`);
      if (!SKILL_LABEL[sk]) bad.push(`SKILL_LABEL sem ${sk}`);
    }
    for (const [lv, tiers] of Object.entries(LEVEL_TIERS || {})) for (const list of tiers) for (const sk of list)
      if (typeof Q[sk] !== 'function') bad.push(`LEVEL_TIERS ${lv}: ${sk} nao existe`);
    return bad;
  });
  await b.close();
  const all = [...res, ...errs];
  if (all.length) { console.error(all.slice(0, 40).join('\n')); process.exit(1); }
  console.log('geradores ok');
})();
