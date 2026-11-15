# Cuts the mascot heads and bodies out of art/mascot/sheet.png and records each piece's neck anchor. Run from pyramid/: python3 tools/cutmascot.py
# Then run tools/fixanchors.py to correct the neck points.
import numpy as np
from PIL import Image
from scipy import ndimage as nd
im=np.array(Image.open('art/mascot/sheet.png').convert('RGB')).astype(int)
# "ink" = clearly not paper: saturated or dark
mx=im.max(2); mn=im.min(2)
ink=(mn<200)|((mx-mn)>40)
lab,n=nd.label(ink)
objs=nd.find_objects(lab)
areas=nd.sum(ink,lab,range(1,n+1))
for i,(s,a) in enumerate([]):
    h=s[0].stop-s[0].start; w=s[1].stop-s[1].start
    if a>3000 and h<300 and w<300:
        print(i+1,int(a),'y',s[0].start,s[0].stop,'x',s[1].start,s[1].stop)
import json
heads=["neutral","happy","excited","wink","surprised","confused","concerned","angry","laughing"]
b1=["idle","bounce","celebrate","thinking","crossed","point","present","wave","sit"]
b2=["front","left34","left","back","right","right34","jump","land","hurt"]
sel=[(i,objs[i]) for i in range(n) if areas[i]>9000 and (objs[i][0].stop-objs[i][0].start)<300 and (objs[i][1].stop-objs[i][1].start)<300]
def row(y0,y1): return sorted([i for i,s in sel if y0<=s[0].start<y1], key=lambda i:objs[i][1].start)
groups=list(zip(heads,row(0,250)))+list(zip(b1,row(250,540)))+list(zip(b2,row(540,780)))
skin=(im[:,:,0]>230)&(im[:,:,1]>195)&(im[:,:,2]>140)&(im[:,:,2]<220)&(im[:,:,0]-im[:,:,2]>30)
meta={}
P=4
for name,i in groups:
    s=objs[i]; y0,y1,x0,x1=s[0].start-P,s[0].stop+P,s[1].start-P,s[1].stop+P
    m=nd.binary_fill_holes(lab[y0:y1,x0:x1]==i+1)
    crop=im[y0:y1,x0:x1]
    light=(crop.min(2)>150)&((crop.max(2)-crop.min(2))<60)   # paper-ish fringe pixels
    edge=m&~nd.binary_erosion(m,iterations=2)
    m=m&~(edge&light)
    m=nd.binary_erosion(m,iterations=1)
    a=nd.gaussian_filter(m.astype(float),0.7)*1.15
    rgba=np.dstack([im[y0:y1,x0:x1],(np.clip(a,0,1)*255)]).astype(np.uint8)
    sk=skin[y0:y1,x0:x1]&m
    ys,xs=np.nonzero(sk)
    kind='head' if name in heads else 'body'
    if kind=='body':
        top=ys.min(); sel_=ys<top+12; ax,ay=xs[sel_].mean(),top
    else:
        bot=ys.max(); sel_=ys>bot-8; ax,ay=xs[sel_].mean(),bot
    Image.fromarray(rgba).save(f'art/mascot/{kind}_{name}.png')
    meta[f'{kind}_{name}']={'w':int(x1-x0),'h':int(y1-y0),'ax':round(float(ax),1),'ay':int(ay)}
json.dump(meta,open('art/mascot/anchors.json','w'),indent=0)
print(len(groups))
