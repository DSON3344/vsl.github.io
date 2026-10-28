// 威超进度云端同步：GET 公开读取，PUT 需要同步密码（环境变量 VES_SYNC_KEY）
// 存储：优先用 Upstash Redis（Vercel Marketplace 加的 KV_REST_API_URL / KV_REST_API_TOKEN，或 UPSTASH_REDIS_REST_URL / TOKEN）；
// 没配 Redis 时退回 Vercel Blob。Redis 里进度分块存（每块 400KB），另外存一份 meta（etag、块数），读取时先比 etag，没变化就只读 meta。
import { get, put } from '@vercel/blob';
import { createHash } from 'node:crypto';

const PATH = 'ves/s18-progress.json';
const RKEY = 'ves:progress';
const CHUNK = 400000;
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const authed = req => {
  const k = process.env.VES_SYNC_KEY;
  return !!k && req.headers.get('x-ves-key') === k;
};
// 环境变量名会带上连接时设的前缀（例如 STORAGE_KV_REST_API_URL），按结尾找
const envEnd = (suf, not) => { const k = Object.keys(process.env).find(x => x.endsWith(suf) && !(not && not.test(x))); return k ? process.env[k] : undefined; };
const R_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || envEnd('REST_API_URL') || envEnd('REDIS_REST_URL');
const R_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || envEnd('REST_API_TOKEN', /READ_ONLY/) || envEnd('REDIS_REST_TOKEN', /READ_ONLY/);
const useRedis = !!(R_URL && R_TOK);
async function redis(cmds) {
  const r = await fetch(R_URL.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + R_TOK, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('redis http ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const out = await r.json(); const bad = out.find(x => x && x.error); if (bad) throw new Error('redis ' + bad.error);
  return out.map(x => x.result);
}

export async function GET(req) {
  try { return await (useRedis ? getRedis(req) : getBlob(req)); } catch (e) { return json({ error: 'store_get_failed', message: String(e && e.message || e).slice(0, 300) }, 503); }
}
async function getRedis(req) {
  const inm = req.headers.get('if-none-match') || undefined;
  const [metaS] = await redis([['GET', RKEY + ':meta']]);
  if (!metaS) return json({ etag: null, state: null, store: 'redis' });
  const meta = JSON.parse(metaS);
  if (inm && inm === meta.etag) return new Response(null, { status: 304, headers: { ETag: inm, 'Cache-Control': 'no-store' } });
  const parts = await redis([['MGET', ...Array.from({ length: meta.n }, (_, i) => RKEY + ':' + meta.etag + ':' + i)]]);
  const text = (parts[0] || []).join('');
  return json({ etag: meta.etag, state: JSON.parse(text), store: 'redis' }, 200, { ETag: meta.etag });
}
async function getBlob(req) {
  const inm = req.headers.get('if-none-match') || undefined;
  const r = await get(PATH, { access: 'private', useCache: false, ifNoneMatch: inm });
  if (!r) return json({ etag: null, state: null });
  if (r.statusCode === 304) return new Response(null, { status: 304, headers: { ETag: inm, 'Cache-Control': 'no-store' } });
  const text = await new Response(r.stream).text();
  return json({ etag: r.blob.etag, state: JSON.parse(text) }, 200, { ETag: r.blob.etag });
}

// 只用来校验密码
export async function POST(req) {
  return authed(req) ? json({ ok: true, store: useRedis ? 'redis' : 'blob' }) : json({ error: 'unauthorized' }, 401);
}

export async function PUT(req) {
  try { return await putImpl(req); } catch (e) { return json({ error: 'store_put_failed', message: String(e && e.message || e).slice(0, 300) }, 503); }
}
async function putImpl(req) {
  if (!authed(req)) return json({ error: 'unauthorized' }, 401);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  // 新版网页上传压缩后的进度（z）；旧版上传原样的 s，两种都收
  const s = body && body.s, z = body && body.z;
  const okS = s && Array.isArray(s.fx) && s.fx.length === 38 && Array.isArray(s.teams), okZ = typeof z === 'string' && z.length > 200;
  if (!body.key || (!okS && !okZ)) return json({ error: 'bad state' }, 400);
  const text = JSON.stringify(okZ ? { key: body.key, z, season: body.season, played: body.played } : { key: body.key, s });
  if (useRedis) {
    const etag = '"' + createHash('sha1').update(text).digest('hex').slice(0, 20) + '"', n = Math.ceil(text.length / CHUNK);
    const [old] = await redis([['GET', RKEY + ':meta']]);
    const cmds = []; for (let i = 0; i < n; i++) cmds.push(['SET', RKEY + ':' + etag + ':' + i, text.slice(i * CHUNK, (i + 1) * CHUNK)]);
    cmds.push(['SET', RKEY + ':meta', JSON.stringify({ etag, n, t: Date.now() })]);
    if (old) { const o = JSON.parse(old); if (o.etag !== etag) for (let i = 0; i < o.n; i++) cmds.push(['DEL', RKEY + ':' + o.etag + ':' + i]); }
    await redis(cmds);
    return json({ ok: true, etag, store: 'redis' });
  }
  const res = await put(PATH, text, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
  return json({ ok: true, etag: res.etag || null });
}
