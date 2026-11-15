"""Run after tools/cutmascot.py (from pyramid/): python3 tools/fixanchors.py
Corrects the neck points in art/mascot/anchors.json so any head sits on any body:
- heads: each head is lined up against the neutral head by its outline, and takes neutral's chin point
  (the raw chin guess sometimes landed on the mouth, pushing heads sideways);
- bodies: the neck is the top of the largest patch of skin (the torso), not stray yellow tentacle highlights;
- hand overrides for bodies whose neck is hidden under a tentacle (checked by eye)."""
from PIL import Image; import numpy as np, json
from scipy import ndimage as nd
D="art/mascot/"; M=json.load(open(D+"anchors.json"))
OVERRIDE={"body_hurt":(60.5,8)}
for k in [k for k in M if k.startswith("body_")]:
    im=np.array(Image.open(D+k+".png")).astype(int); r,g,b,a=im[...,0],im[...,1],im[...,2],im[...,3]
    skin=(a>200)&(r>225)&(g>185)&(b>120)&(b<225)&(r-b>25)&(g-b>10)
    lab,n=nd.label(skin); big=lab==(np.argmax(nd.sum(skin,lab,range(1,n+1)))+1)
    ys,xs=np.nonzero(big); top=ys.min(); M[k]["ax"],M[k]["ay"]=round(float(xs[ys<top+10].mean()),1),int(top)
    if k in OVERRIDE: M[k]["ax"],M[k]["ay"]=OVERRIDE[k]
A=lambda k:np.array(Image.open(D+k+".png"))[:,:,3]>128
ref=A("head_neutral"); rx,ry=M["head_neutral"]["ax"],M["head_neutral"]["ay"]
for k in [k for k in M if k.startswith("head_")]:
    m=A(k); H=max(ref.shape[0],m.shape[0])+30; W=max(ref.shape[1],m.shape[1])+30
    R=np.zeros((H,W),bool); R[15:15+ref.shape[0],15:15+ref.shape[1]]=ref; best=None
    for dy in range(-14,15):
        for dx in range(-14,15):
            C=np.zeros((H,W),bool); C[15+dy:15+dy+m.shape[0],15+dx:15+dx+m.shape[1]]=m
            s=(R&C).sum()/(R|C).sum()
            if best is None or s>best[0]: best=(s,dx,dy)
    M[k]["ax"],M[k]["ay"]=round(rx-best[1],1),int(ry-best[2])
json.dump(M,open(D+"anchors.json","w"),indent=0); print("anchors fixed")
