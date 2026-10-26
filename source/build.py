"""Build the static VES League site from source files."""
import os, json, sys, hashlib
d = os.path.dirname(os.path.abspath(__file__)) + '/'
sys.path.insert(0, d)
from minify import mjson, minify_html

hist_d = json.load(open(d + 'hist.json', encoding='utf-8'))
site = json.load(open(d + 'site_data.json', encoding='utf-8'))
hist_d['s18'] = [r['team'] for r in site['standings']['18']]
for pos, t in json.load(open(d + 'realign.json', encoding='utf-8')).get('18', {}).items():
    hist_d['s18'][int(pos) - 1] = t
hist = json.dumps(hist_d, ensure_ascii=False, separators=(',', ':'))

# Keep team crests as content-hashed static assets.
os.makedirs(d + '../logos', exist_ok=True)
logo_urls = {}
for f in sorted(os.listdir(d + 'assets/logos')):
    with open(d + 'assets/logos/' + f, 'rb') as fh:
        b = fh.read()
    name = hashlib.md5(b).hexdigest()[:8] + '.webp'
    with open(d + '../logos/' + name, 'wb') as fh:
        fh.write(b)
    logo_urls[f[:-5]] = 'logos/' + name

# Publish the W-League data separately for browser caching.
with open(d + 'wl.json', 'rb') as fh:
    wl_data = fh.read()
for old in os.listdir(d + '..'):
    if old.startswith('wl.') and old.endswith('.json'):
        os.remove(d + '../' + old)
wl_url = 'wl.' + hashlib.md5(wl_data).hexdigest()[:8] + '.json'
with open(d + '../' + wl_url, 'wb') as fh:
    fh.write(wl_data)

data = (
    open(d + 'lzstring.min.js', encoding='utf-8').read() + '\\n'
    + open(d + 'player_data.js', encoding='utf-8').read() + '\\n'
    + '(' + mjson(open(d + 'extra_players.json', encoding='utf-8').read()) + ').forEach(p => PLAYER_DATABASE[p.team].push(p));\\n'
    + open(d + 'teams_data.js', encoding='utf-8').read() + '\\n'
    + open(d + 'roster_overrides.js', encoding='utf-8').read()
    + '\\nconst TEAMS_DATA = window.TEAMS_DATA;\\nconst HISTORY = ' + mjson(open(d + 'history.json', encoding='utf-8').read())
    + ';\\nconst HIST = ' + hist + ';\\nconst EXT_REAL = ' + mjson(open(d + 'ext_squads.json', encoding='utf-8').read())
    + ';\\nconst EXT_CAREERS = ' + mjson(open(d + 'ext_careers.json', encoding='utf-8').read())
    + ';\\nconst LORE = ' + mjson(open(d + 'lore.json', encoding='utf-8').read())
    + ';\\nconst LOGO_URLS = ' + json.dumps(logo_urls, ensure_ascii=False)
    + ';\\nconst LOGOS_B64 = {};\\nconst WL_DATA = null;\\nconst WL_URL = ' + json.dumps(wl_url) + ';\\n'
)
body = open(d + 'app.html', encoding='utf-8').read().replace('/*__DATA__*/', data).replace('/*__ENGINE__*/', open(d + 'engine.js', encoding='utf-8').read())
policy = open(d + 'season_policy.js', encoding='utf-8').read()
marker = "const h0 = (location.hash || '').slice(1);"
if marker not in body:
    raise SystemExit('App initialization marker not found; build aborted safely.')
body = body.replace(marker, policy + '\\n' + marker, 1)

head = '''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" type="image/png" sizes="64x64" href="favicon.png">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="theme-color" content="#06080c">
<meta name="description" content="威伊士超联赛（VES League）联赛中心：积分榜、比赛模拟、数据榜、球队与球员资料，以及 S01 起的完整历史。">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.5 system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
'''
i = body.index('</style>') + len('</style>')
html = head + body[:i] + '\\n</head>\\n<body>\\n' + body[i:] + '\\n</body>\\n</html>\\n'
html = minify_html(html)
with open(d + '../index.html', 'w', encoding='utf-8') as fh:
    fh.write(html)
print('index.html', round(len(html) / 1e6, 2), 'MB')
