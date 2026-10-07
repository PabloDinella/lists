import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const status = JSON.parse(execFileSync('npx', ['supabase', 'status', '--output', 'json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}));

const url = new URL(status.API_URL);
if (!['localhost', '127.0.0.1'].includes(url.hostname) || !status.ANON_KEY) {
  throw new Error('Supabase status did not return a local API and anon key');
}
const mailUrl = new URL(status.MAILPIT_URL ?? status.INBUCKET_URL);
if (!['localhost', '127.0.0.1'].includes(mailUrl.hostname)) {
  throw new Error('Supabase status did not return a local test inbox');
}

writeFileSync('.env.local',
  `VITE_SUPABASE_URL=${url.toString().replace(/\/$/, '')}\nVITE_SUPABASE_ANON_KEY=${status.ANON_KEY}\nVITE_LOCAL_MAIL_URL=${mailUrl.origin}\n`,
  { mode: 0o600 },
);
console.log(`Local staging configured at ${url.origin}`);
