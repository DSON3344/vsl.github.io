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


/* ---- GitHub 存储（2026-11-11 起）：进度写进本仓库的 data 分支，网页直接从 raw.githubusercontent 读，不经过这里。
   data 分支：meta.json（小：时间、赛季、轮次、旧赛季文件清单）· live.json（当季进度，压缩，不含旧赛季）
   · a/<文件名>（每个结束赛季一份，内容不变，只上传一次）· bak/（每 3 小时留一份 live 备份，最多 12 份）。
   每次写入都是一个没有父提交的新提交，强制覆盖分支：仓库不会因为历史越堆越大。
   需要 Vercel 环境变量 VES_GH_TOKEN（GitHub fine-grained token，只给本仓库 Contents 读写）。没设时照旧用 Redis。 */
const GH_TOK = process.env.VES_GH_TOKEN || process.env.GH_TOKEN || '';
const GH_REPO = process.env.VES_GH_REPO || 'DSON3344/vsl.github.io', GH_BR = process.env.VES_GH_BRANCH || 'data';
const useGh = !!GH_TOK;
async function gh(path, method = 'GET', body) {
  const r = await fetch((process.env.VES_GH_API || 'https://api.github.com') + '/repos/' + GH_REPO + path, { method, headers: { Authorization: 'Bearer ' + GH_TOK, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'ves-league', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 404 && method === 'GET') return null;
  if (!r.ok) throw new Error('github ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
}
const blobText = async sha => { const b = await gh('/git/blobs/' + sha); return Buffer.from(b.content, 'base64').toString('utf8'); };
const okName = f => typeof f === 'string' && /^s\d{1,4}-[0-9a-z]{4,16}\.lz$/.test(f);
async function ghPut(body) { let W_NOW = null;
  const ref = await gh('/git/ref/heads/' + GH_BR);
  let have = {}, meta = null, bak = [];
  if (ref) { const c = await gh('/git/commits/' + ref.object.sha); const t = await gh('/git/trees/' + c.tree.sha + '?recursive=1'); (t.tree || []).forEach(e => { if (e.type === 'blob') have[e.path] = e.sha; });
    if (have['meta.json']) try { meta = JSON.parse(await blobText(have['meta.json'])); } catch (e) { }
    if (have['bak/index.json']) try { bak = JSON.parse(await blobText(have['bak/index.json'])); } catch (e) { } }
  const files = body.files && typeof body.files === 'object' ? body.files : {}, mk = async text => (await gh('/git/blobs', 'POST', { content: text, encoding: 'utf-8' })).sha;
  const add = {}; for (const f of Object.keys(files)) { if (!okName(f) || typeof files[f] !== 'string') return { status: 400, body: { error: 'bad file ' + f } }; if (!have['a/' + f]) add['a/' + f] = await mk(files[f]); }
  let tree = {}; // path -> sha
  if (body.filesOnly) { tree = { ...have, ...add }; }
  else {
    const arch = Array.isArray(body.arch) ? body.arch : []; if (arch.some(f => !okName(f))) return { status: 400, body: { error: 'bad arch' } };
    /* 版本检查：这台设备是基于云端哪个版本改的（base = 当时云端的写入时间）。云端在那之后已经被别的设备更新过，就不覆盖，让这台设备先同步 */
    if (meta && meta.w && body.base != null && body.base !== meta.w && !body.force) return { status: 409, body: { error: 'conflict', meta: { ...meta, key: undefined } } };
    const need = arch.filter(f => !have['a/' + f] && !add['a/' + f]); if (need.length) return { status: 409, body: { error: 'need files', need } };
    const now = Date.now(); W_NOW = now; const m2 = { v: 2, key: body.key, t: body.t || now, season: body.season ?? null, played: body.played ?? null, arch, w: now };
    if (meta && have['live.json'] && now - ((bak[0] && bak[0].w) || 0) > 3 * 3600e3) { bak.unshift({ ...meta, w: now, sha: have['live.json'] }); bak = bak.slice(0, 12); }
    tree['live.json'] = await mk(JSON.stringify({ v: 2, key: body.key, t: m2.t, season: m2.season, played: m2.played, arch, ...(typeof body.zg === 'string' ? { zg: body.zg } : { z: body.z }) })); /* zg = 浏览器原生 gzip（较新版本），z = LZ（旧版本） */
    tree['meta.json'] = await mk(JSON.stringify(m2));
    if (bak.length) { tree['bak/index.json'] = await mk(JSON.stringify(bak)); bak.forEach(b => { tree['bak/live-' + b.w + '.json'] = b.sha; }); }
    const keep = new Set(arch); bak.forEach(b => (b.arch || []).forEach(f => keep.add(f)));
    keep.forEach(f => { tree['a/' + f] = add['a/' + f] || have['a/' + f]; });
    tree = Object.fromEntries(Object.entries(tree).filter(([, v]) => v));
  }
  /* data 分支自带一份 vercel.json 关掉自动部署：存进度不会触发 Vercel 建站 */
  tree['vercel.json'] = have['vercel.json'] || await mk(JSON.stringify({ git: { deploymentEnabled: false } }));
  const t = await gh('/git/trees', 'POST', { tree: Object.entries(tree).map(([path, sha]) => ({ path, mode: '100644', type: 'blob', sha })) });
  const c = await gh('/git/commits', 'POST', { message: body.filesOnly ? 'archive files' : 'progress S' + (body.season ?? '?') + ' R' + (body.played ?? '?'), tree: t.sha, parents: [] });
  if (ref) await gh('/git/refs/heads/' + GH_BR, 'PATCH', { sha: c.sha, force: true }); else await gh('/git/refs', 'POST', { ref: 'refs/heads/' + GH_BR, sha: c.sha });
  return { status: 200, body: { ok: true, etag: c.sha, store: 'github', added: Object.keys(add).length, w: body.filesOnly ? null : W_NOW } };
}
export async function GET(req) {
  if (new URL(req.url).searchParams.get('mode') != null) return json({ store: useGh ? 'github' : useRedis ? 'redis' : 'blob', repo: useGh ? GH_REPO : null, branch: useGh ? GH_BR : null });
  try { return await (useRedis ? getRedis(req) : getBlob(req)); } catch (e) { return json({ error: 'store_get_failed', message: String(e && e.message || e).slice(0, 300) }, 503); }
}
// 备份：PUT 时每隔 3 小时把被覆盖的旧进度留成一份备份（最多 12 份）；另外有一份永久快照 pre-custom（开始做自定义联赛之前的进度）
const BAK = RKEY + ':bak', BAK_MAX = 12, BAK_GAP = 3 * 3600e3, SNAP = RKEY + ':snap:pre-custom';
let snapDone = false;
async function ensureSnap(meta, parts) {
  if (snapDone) return; const [have] = await redis([['GET', SNAP + ':meta']]); if (have) { snapDone = true; return; }
  const cmds = parts.map((x, i) => ['SET', SNAP + ':' + i, x]); cmds.push(['SET', SNAP + ':meta', JSON.stringify({ ...meta, snap: Date.now() })]); await redis(cmds); snapDone = true;
}
async function getRedis(req) {
  const inm = req.headers.get('if-none-match') || undefined, url = new URL(req.url);
  if (url.searchParams.get('backups') != null) { const [L, sm] = await redis([['LRANGE', BAK, 0, -1], ['GET', SNAP + ':meta']]); return json({ backups: (L || []).map(x => JSON.parse(x)).map(({ etag, t, season, played }) => ({ etag, t, season, played })), snapshot: sm ? JSON.parse(sm) : null }); }
  const [metaS] = await redis([['GET', RKEY + ':meta']]);
  if (!metaS) return json({ etag: null, state: null, store: 'redis' });
  const meta = JSON.parse(metaS);
  if (inm && inm === meta.etag) return new Response(null, { status: 304, headers: { ETag: inm, 'Cache-Control': 'no-store' } });
  const parts = await redis([['MGET', ...Array.from({ length: meta.n }, (_, i) => RKEY + ':' + meta.etag + ':' + i)]]);
  const text = (parts[0] || []).join('');
  try { if (!snapDone) await ensureSnap(meta, parts[0] || []); } catch (e) { }
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
  if (!authed(req)) return json({ error: 'unauthorized' }, 401);
  let body = null; try { body = await req.json(); } catch { body = null; }
  if (useRedis && body && body.restore) { /* 还原备份：把备份内容读出来，当作一次新的上传写回去（当前进度会先被留成一份备份） */
    let parts;
    if (body.restore === 'pre-custom') { const [sm] = await redis([['GET', SNAP + ':meta']]); if (!sm) return json({ error: 'no snapshot' }, 404); const m = JSON.parse(sm); [parts] = await redis([['MGET', ...Array.from({ length: m.n }, (_, i) => SNAP + ':' + i)]]); }
    else { const [L] = await redis([['LRANGE', BAK, 0, -1]]); const b = (L || []).map(x => JSON.parse(x)).find(x => x.etag === body.restore); if (!b) return json({ error: 'no such backup' }, 404); [parts] = await redis([['MGET', ...Array.from({ length: b.n }, (_, i) => RKEY + ':' + b.etag + ':' + i)]]); }
    const st = JSON.parse((parts || []).join('')); return json({ ok: true, state: st });
  }
  return json({ ok: true, store: useGh ? 'github' : useRedis ? 'redis' : 'blob' });
}

export async function PUT(req) {
  try { return await putImpl(req); } catch (e) { return json({ error: 'store_put_failed', message: String(e && e.message || e).slice(0, 300) }, 503); }
}
async function putImpl(req) {
  if (!authed(req)) return json({ error: 'unauthorized' }, 401);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  if (useGh && body && body.v === 2) { const zz = typeof body.zg === 'string' ? body.zg : body.z; if (!body.filesOnly && (!body.key || typeof zz !== 'string' || zz.length < 200)) return json({ error: 'bad state' }, 400); const r = await ghPut(body); return json(r.body, r.status); }
  // 新版网页上传压缩后的进度（z）；旧版上传原样的 s，两种都收
  const s = body && body.s, z = body && body.z;
  const okS = s && Array.isArray(s.fx) && s.fx.length === 38 && Array.isArray(s.teams), okZ = typeof z === 'string' && z.length > 200;
  if (!body.key || (!okS && !okZ)) return json({ error: 'bad state' }, 400);
  const text = JSON.stringify(okZ ? { key: body.key, z, season: body.season, played: body.played } : { key: body.key, s });
  if (useRedis) {
    const etag = '"' + createHash('sha1').update(text).digest('hex').slice(0, 20) + '"', n = Math.ceil(text.length / CHUNK);
    const [old] = await redis([['GET', RKEY + ':meta']]);
    const cmds = []; for (let i = 0; i < n; i++) cmds.push(['SET', RKEY + ':' + etag + ':' + i, text.slice(i * CHUNK, (i + 1) * CHUNK)]);
    cmds.push(['SET', RKEY + ':meta', JSON.stringify({ etag, n, t: Date.now(), season: body.season || null, played: body.played ?? null })]);
    if (old) { const o = JSON.parse(old); if (o.etag !== etag) {
      const [last] = await redis([['LINDEX', BAK, 0]]), lt = last ? JSON.parse(last).t || 0 : 0;
      if (Date.now() - lt > BAK_GAP) { /* 旧进度留作备份，超过上限的最旧备份连同分块一起删掉 */
        cmds.push(['LPUSH', BAK, JSON.stringify(o)]); const [ev] = await redis([['LRANGE', BAK, BAK_MAX - 1, -1]]);
        (ev || []).forEach(x => { const b = JSON.parse(x); for (let i = 0; i < b.n; i++) cmds.push(['DEL', RKEY + ':' + b.etag + ':' + i]); }); cmds.push(['LTRIM', BAK, 0, BAK_MAX - 1]);
      } else for (let i = 0; i < o.n; i++) cmds.push(['DEL', RKEY + ':' + o.etag + ':' + i]); } }
    await redis(cmds);
    return json({ ok: true, etag, store: 'redis' });
  }
  const res = await put(PATH, text, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
  return json({ ok: true, etag: res.etag || null });
}
