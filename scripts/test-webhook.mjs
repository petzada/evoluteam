// Smoke test manual do webhook /api/webhooks/auth-user-created em dev.
// Uso: node scripts/test-webhook.mjs [invite|welcome]
// Requer SUPABASE_WEBHOOK_SECRET no .env.local (mesmo valor que o handler lê)
// e o dev server rodando em http://localhost:3000.

import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (!match) continue;
      if (!process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {}
}

loadEnv();

const MODE = process.argv[2] ?? 'welcome';
const SECRET = process.env.SUPABASE_WEBHOOK_SECRET;
const URL = process.env.WEBHOOK_TEST_URL ?? 'http://localhost:3000/api/webhooks/auth-user-created';

if (!SECRET) {
  console.error('SUPABASE_WEBHOOK_SECRET não encontrado em .env.local. Defina antes.');
  process.exit(1);
}

const record = {
  id: crypto.randomUUID(),
  email: 'teste@evoluteam.dev',
  raw_app_meta_data: MODE === 'invite' ? { source: 'invite' } : {},
  created_at: new Date().toISOString(),
};

const body = JSON.stringify({
  type: 'INSERT',
  table: 'users',
  schema: 'auth',
  record,
});

const signature = crypto.createHmac('sha256', SECRET).update(body).digest('hex');

console.log(`→ POST ${URL}`);
console.log(`  mode: ${MODE}`);
console.log(`  record.email: ${record.email}`);

const response = await fetch(URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature,
  },
  body,
});

const text = await response.text();
console.log(`← ${response.status} ${response.statusText}`);
console.log(`  body: ${text}`);
