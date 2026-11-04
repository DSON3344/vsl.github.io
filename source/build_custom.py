d='/home/claude/src/'
s=open(d+'custom.html').read().replace('/*__ENGINE__*/',open(d+'engine.js').read()).replace('/*__SKILLS__*/',open(d+'custom_skills.js').read())
open(d+'out/custom.html','w').write(s); print('custom', len(s))
