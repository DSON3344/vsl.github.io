// 威超 S18 进度云端同步：GET 公开读取，PUT 需要同步密码（环境变量 VES_SYNC_KEY）
import { get, put } from '@vercel/blob';

const PATH = 'ves/s18-progress.json';
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const authed = req => {
  const k = process.env.VES_SYNC_KEY;
  return !!k && req.headers.get('x-ves-key') === k;
};

export async function GET(req) {
  const inm = req.headers.get('if-none-match') || undefined;
  const r = await get(PATH, { access: 'private', useCache: false, ifNoneMatch: inm });
  if (!r) return json({ etag: null, state: null });
  if (r.statusCode === 304) return new Response(null, { status: 304, headers: { ETag: inm, 'Cache-Control': 'no-store' } });
  const text = await new Response(r.stream).text();
  return json({ etag: r.blob.etag, state: JSON.parse(text) }, 200, { ETag: r.blob.etag });
}

// 只用来校验密码
export async function POST(req) {
  return authed(req) ? json({ ok: true }) : json({ error: 'unauthorized' }, 401);
}

export async function PUT(req) {
  if (!authed(req)) return json({ error: 'unauthorized' }, 401);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const s = body && body.s;
  if (!body.key || !s || !Array.isArray(s.fx) || s.fx.length !== 38 || !Array.isArray(s.teams)) return json({ error: 'bad state' }, 400);
  const res = await put(PATH, JSON.stringify({ key: body.key, s }), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
  });
  return json({ ok: true, etag: res.etag || null });
}
