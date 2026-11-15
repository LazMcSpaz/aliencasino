import base64,json
C='cap/'
d=lambda f:'data:image/webp;base64,'+base64.b64encode(open(C+f,'rb').read()).decode()
tex={'hud':d('tex_hud.webp'),'glass':d('tex_glass.webp'),'controls':d('tex_controls.webp'),'faces':{m:d(f'tex_face_{m}.webp') for m in ['happy','giddy','grumpy','sleepy','mischievous']}}
s=open('viewer.src.html').read().replace('/* {{MODEL}} */',open('model.js').read()).replace('/* {{TEX}} */',json.dumps(tex))
open('slot_bot.html','w').write(s); print(len(s))
