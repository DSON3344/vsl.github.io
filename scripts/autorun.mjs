// 无头浏览器打开网站（带同步密码，跳过开场界面），等网页把到点的比赛补完并上传，然后结束。密码只放在浏览器的本机存储里，不会打印出来。
import { chromium } from 'playwright';
const key = process.env.VES_SYNC_KEY, url = (process.env.VES_URL || 'https://ves.dson.site/') + '?autorun=1';
if (!key) { console.log('VES_SYNC_KEY 没有设定，跳过'); process.exit(0); }
const b = await chromium.launch(); const p = await b.newPage();
await p.addInitScript(k => { try { localStorage.setItem('ves-sync-key', k); localStorage.setItem('ves_gate_skip', '1'); } catch (e) { } }, key);
p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(url, { waitUntil: 'load', timeout: 120000 });
let done = null; for (let i = 0; i < 240 && !done; i++) { await p.waitForTimeout(2000); done = await p.evaluate(() => window.__autoDone || null).catch(() => null); }
console.log(done ? `完成：补了 ${done.steps} 步，现在 S${done.season} 已踢 ${done.played} 轮 · ${done.status}` : '超时，没有拿到完成信号');
await p.waitForTimeout(3000); await b.close();
