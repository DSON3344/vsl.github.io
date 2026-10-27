"""把 source/ 里的数据和代码打包成网站根目录的 index.html。
用法：
  node build_history.js   # 重新还原 S01–S17（改了球员/官网数据时才需要）
  python3 build.py        # 生成 ../index.html
"""
import base64, os, json, sys, hashlib
d = os.path.dirname(os.path.abspath(__file__)) + '/'
sys.path.insert(0, d)
from minify import mjson, minify_html
hist_d = json.load(open(d + 'hist.json'))
site = json.load(open(d + 'site_data.json'))
hist_d['s18'] = [r['team'] for r in site['standings']['18']]
for pos, t in json.load(open(d + 'realign.json')).get('18', {}).items(): hist_d['s18'][int(pos) - 1] = t  # S18 名单合理化
hist = json.dumps(hist_d, ensure_ascii=False, separators=(',', ':'))
# 队徽输出成单独文件（浏览器可长期缓存），页面里只放文件地址
os.makedirs(d + '../logos', exist_ok=True)
logo_urls = {}
for f in sorted(os.listdir(d + 'assets/logos')):
    b = open(d + 'assets/logos/' + f, 'rb').read(); h = hashlib.md5(b).hexdigest()[:8]
    name = h + '.webp'; open(d + '../logos/' + name, 'wb').write(b); logo_urls[f[:-5]] = 'logos/' + name
logos = {}
# 威联赛时代数据单独成文件（打开威联赛栏目时才下载，可长期缓存）
_wl = open(d + 'wl.json', 'rb').read()
for _f in os.listdir(d + '..'):
    if _f.startswith('wl.') and _f.endswith('.json'): os.remove(d + '../' + _f)
wl_url = 'wl.' + hashlib.md5(_wl).hexdigest()[:8] + '.json'
open(d + '../' + wl_url, 'wb').write(_wl)
data = (open(d + 'lzstring.min.js').read() + '\n' + open(d + 'player_data.js').read() + '\n'
        + '(' + mjson(open(d + 'extra_players.json').read()) + ').forEach(p => PLAYER_DATABASE[p.team].push(p));\n'
        + open(d + 'teams_data.js').read() + '\n' + open(d + 'roster_overrides.js').read()
        + '\nconst TEAMS_DATA = window.TEAMS_DATA;\nconst HISTORY = ' + mjson(open(d + 'history.json').read())
        + ';\nconst HIST = ' + hist + ';\nconst EXT_REAL = ' + mjson(open(d + 'ext_squads.json').read()) + ';\nconst EXT_CAREERS = ' + mjson(open(d + 'ext_careers.json').read()) + ';\nconst RERATE = ' + mjson(open(d + 'rerate.json').read()) + ';\nconst LORE = ' + mjson(open(d + 'lore.json').read()) + ';\nconst LOGO_URLS = ' + json.dumps(logo_urls, ensure_ascii=False) + ';\nconst LOGOS_B64 = {};\nconst WL_DATA = null;\nconst WL_URL = ' + json.dumps(wl_url) + ';\n')
body = open(d + 'app.html').read().replace('/*__DATA__*/', data).replace('/*__ENGINE__*/', open(d + 'engine.js').read())
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
html = head + body[:i] + '\n</head>\n<body>\n' + body[i:] + '\n</body>\n</html>\n'
html = minify_html(html)
open(d + '../index.html', 'w').write(html)
print('index.html', round(len(html) / 1e6, 2), 'MB')
