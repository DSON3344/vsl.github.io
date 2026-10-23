"""构建时压缩：JSON 去空白；有 esbuild 时再压缩脚本和样式（没有就原样输出）。"""
import json, os, re, shutil, subprocess
def mjson(text):
    return json.dumps(json.loads(text), ensure_ascii=False, separators=(',', ':'))
def _esb():
    return os.environ.get('ESBUILD') or shutil.which('esbuild')
def _run(code, loader):
    exe = _esb()
    if not exe: return code
    r = subprocess.run([exe, '--minify', '--loader=' + loader, '--charset=utf8'], input=code.encode(), capture_output=True)
    if r.returncode: raise SystemExit(r.stderr.decode()[:2000])
    return r.stdout.decode().rstrip('\n')
def minify_html(html):
    if not _esb(): return html
    out, pos = [], 0
    for m in re.finditer(r'(<script>)(.*?)(</script>)|(<style>)(.*?)(</style>)', html, re.S):
        out.append(html[pos:m.start()])
        if m.group(1): out.append('<script>' + _run(m.group(2), 'js').replace('</script', '<\\/script') + '</script>')
        else: out.append('<style>' + _run(m.group(5), 'css') + '</style>')
        pos = m.end()
    out.append(html[pos:])
    return ''.join(out)
