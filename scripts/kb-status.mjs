import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = {};
for (const f of ['.env', '.env.local']) {
  try {
    for (const l of readFileSync(f, 'utf-8').split('\n')) {
      const t = l.trim();
      if (!t || t[0] === '#') continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch {}
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb
  .from('knowledge_documents')
  .select('title, chunk_count, status, created_at')
  .order('created_at');

let tot = 0;
console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║          KNOWLEDGE BASE STATUS                   ║');
console.log('╚══════════════════════════════════════════════════╝');
for (const d of (data || [])) {
  tot += d.chunk_count || 0;
  const ok = d.status === 'ready' && d.chunk_count > 0;
  const icon = ok ? '✅' : '❌';
  const date = String(d.created_at).slice(0, 10);
  console.log(`${icon} ${String(d.chunk_count || 0).padStart(4)} chunks  ${date}  ${d.title}`);
}
console.log('─'.repeat(52));
console.log(`TOTAL: ${tot} chunks`);
console.log('');
