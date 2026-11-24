#!/usr/bin/env node
// Report of the cookieless counter (lib/counter.ts), last N days (default 28).
// Usage: node scripts/events-report.mjs [days]
// Reads D1 latexci-events through wrangler (needs `npx wrangler login`).
import { execFileSync } from 'node:child_process';

const days = Math.max(1, Math.min(365, Number(process.argv[2]) || 28));
const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);

function q(sql) {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'latexci-events', '--remote', '--json', '--command', sql],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return JSON.parse(out)[0]?.results ?? [];
}

function table(title, rows) {
  console.log(`\n## ${title}`);
  if (!rows.length) return console.log('(nothing yet)');
  for (const r of rows) console.log(Object.values(r).join('\t'));
}

const W = `day >= '${since}'`;
console.log(`latexci.com, counter since ${since} (${days} days, Luxembourg days)`);
table('Totals by event', q(`SELECT type, SUM(n) AS n FROM ev WHERE ${W} GROUP BY type ORDER BY n DESC`));
table('Views by day', q(`SELECT day, SUM(n) AS views FROM ev WHERE ${W} AND type='view' GROUP BY day ORDER BY day`));
table('Top pages (views)', q(`SELECT page, SUM(n) AS n FROM ev WHERE ${W} AND type='view' GROUP BY page ORDER BY n DESC LIMIT 40`));
table('Arrivals by site', q(`SELECT ref, SUM(n) AS n FROM ev WHERE ${W} AND type='land' GROUP BY ref ORDER BY n DESC LIMIT 20`));
table('Landing pages', q(`SELECT page, SUM(n) AS n FROM ev WHERE ${W} AND type='land' GROUP BY page ORDER BY n DESC LIMIT 15`));

table('Other events', q(`SELECT type, target, SUM(n) AS n FROM ev WHERE ${W} AND type NOT IN ('view','land') GROUP BY type, target ORDER BY n DESC LIMIT 40`));
