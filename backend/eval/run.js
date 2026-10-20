import 'dotenv/config'; // must be first
import fs from 'fs';
import { routeMessage } from '../src/routing/router.js';

const strategies = (process.argv[2] || 'baseline,structured,context,full').split(',');
const split = process.argv[3] || 'dev';
const RUNS = Number(process.env.RUNS || 1);
const TAG = process.env.TAG || '';
const WINDOW = process.env.HISTORY_WINDOW ?? '4';
const THRESH = process.env.CONF_THRESHOLD ?? '0.5';
const CATS = process.env.CATS ? process.env.CATS.split(',') : null;
const SLEEP_MS = Number(process.env.SLEEP_MS || 1000);

const data = JSON.parse(fs.readFileSync(new URL('./dataset.json', import.meta.url)))
  .filter(d => d.split === split && (!CATS || CATS.includes(d.category)));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';

async function routeWithRetry(args) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await routeMessage(args);
    } catch (err) {
      const msg = String(err.message);
      if (msg.includes('tokens per day')) {
        console.error('\nDaily token limit reached. Stop here and rerun later (or set ROUTER_MODEL to another model).');
        process.exit(1);
      }
      if (attempt >= 8) throw err;
      console.warn(`  retry ${attempt} after error: ${msg.slice(0, 80)}`);
      await sleep(5000 * attempt);
    }
  }
}

console.log(`split=${split} cases=${data.length} strategies=${strategies.join(',')} window=${WINDOW} threshold=${THRESH} runs=${RUNS}${CATS ? ' cats=' + CATS.join('+') : ''}`);

const rows = [];
for (const strategy of strategies) {
  for (let run = 1; run <= RUNS; run++) {
    for (const t of data) {
      const d = await routeWithRetry({ message: t.message, history: t.history, strategy });
      const pred = [...new Set(d.intents.map(i => i.agent))].sort();
      const exp = [...t.expected].sort();

       const exact = (t.score_agent === false || t.expected_clarify) ? '' : pred.join('|') === exp.join('|');

      let ctxOk = '';
      if (t.expected_query_contains) {
        const intent = d.intents.find(i => i.agent === exp[0]);
        ctxOk = Boolean(intent) && t.expected_query_contains.every(k => intent.query.toLowerCase().includes(k.toLowerCase()));
      }

      let queryOk = '';
      if (t.expected_queries) {
        queryOk = Object.entries(t.expected_queries).every(([agent, keys]) => {
          const i = d.intents.find(x => x.agent === agent);
          if (!i) return false;
          const q = i.query.toLowerCase();
          const forbid = t.forbidden_queries?.[agent] || [];
          return keys.every(k => q.includes(k.toLowerCase())) && !forbid.some(k => q.includes(k.toLowerCase()));
        });
      }

      const expectedClarify = Boolean(t.expected_clarify);
      const clarifyOk = d.clarify === expectedClarify;

      if (exact === false || ctxOk === false || queryOk === false || !clarifyOk) {
        const why = [
          exact === false ? `agents ${pred.join('+')} (want ${exp.join('+')})` : null,
          ctxOk === false ? 'context not resolved' : null,
          queryOk === false ? 'sub-queries wrong' : null,
          !clarifyOk ? `clarify=${d.clarify} (want ${expectedClarify})` : null
        ].filter(Boolean).join('; ');
        console.log(`✗ ${strategy} #${t.id} [${t.category}] "${t.message.slice(0, 50)}": ${why}`);
      }

      rows.push({
        strategy, run, window: WINDOW, threshold: THRESH, id: t.id, category: t.category,
        expected: exp.join('|'), predicted: pred.join('|'), exact,
        ctx_ok: ctxOk, query_ok: queryOk, clarify_ok: clarifyOk,
        clarify: d.clarify, expected_clarify: expectedClarify,
        confidence: d.intents.map(i => i.confidence ?? '').join('|'),
        queries: d.intents.map(i => i.query).join(' || '),
        latency_ms: d.latencyMs, tokens: d.tokens ?? '', parse_error: d.parseError,
        raw: String(d.raw || '').replace(/\s+/g, ' ').slice(0, 400)
      });
      await sleep(SLEEP_MS);
    }
  }
}

// ---------- summary ----------
const pct = (a, f) => a.length ? (100 * a.filter(f).length / a.length).toFixed(1) + '%' : '-';
const median = arr => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

for (const strategy of strategies) {
  const r = rows.filter(x => x.strategy === strategy);
  const scored = r.filter(x => x.exact !== '');
  console.log(`\n== ${strategy} (${r.length} runs-cases, ${scored.length} agent-scored) ==`);
  console.log('agent accuracy (exact set match):', pct(scored, x => x.exact));
  for (const c of [...new Set(scored.map(x => x.category))]) {
    const rc = scored.filter(x => x.category === c);
    console.log(`  ${c.padEnd(13)} n=${String(rc.length).padStart(3)}  acc ${pct(rc, x => x.exact)}`);
  }
  console.log('context resolution:    ', pct(r.filter(x => x.ctx_ok !== ''), x => x.ctx_ok === true));
  console.log('sub-query correctness: ', pct(r.filter(x => x.query_ok !== ''), x => x.query_ok === true));
  console.log('clarification correct: ', pct(r, x => x.clarify_ok));
  console.log('  false clarification (asked when it should not):', pct(r.filter(x => !x.expected_clarify), x => x.clarify));
  console.log('  missed clarification (did not ask when it should):', pct(r.filter(x => x.expected_clarify), x => !x.clarify));
  const lats = r.map(x => x.latency_ms);
  console.log('latency ms: mean', Math.round(lats.reduce((s, x) => s + x, 0) / lats.length), '| median', median(lats),
              '| parse errors:', r.filter(x => x.parse_error).length);
}

fs.mkdirSync(new URL('./results/', import.meta.url), { recursive: true });
const header = Object.keys(rows[0]).join(',');
const name = `${split}_${strategies.join('_')}_w${WINDOW}${TAG ? '_' + TAG : ''}_${Date.now()}.csv`;
fs.writeFileSync(new URL(`./results/${name}`, import.meta.url),
  [header, ...rows.map(r => Object.values(r).map(esc).join(','))].join('\n'));
console.log('\nSaved eval/results/' + name);