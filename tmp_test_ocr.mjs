import fs from 'fs';
const env = fs.readFileSync('.env', 'utf-8');
for (const l of env.split('\n')) {
  const e = l.indexOf('=');
  if (e < 0 || l.trim().startsWith('#')) continue;
  const k = l.slice(0, e).trim();
  const v = l.slice(e + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Count total chunks
const r = await fetch(`${SB_URL}/rest/v1/legal_knowledge_chunks?select=document_code`, {
  headers: {
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Prefer': 'count=exact',
    'Range': '0-9'
  }
});
console.log('HTTP Status:', r.status);
console.log('Content-Range:', r.headers.get('content-range'));
const data = await r.json();
console.log('Sample rows (first 5):', JSON.stringify(data.slice(0,5)));
