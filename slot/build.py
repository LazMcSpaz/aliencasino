import base64
sh=open('shell.html').read()
eng=open('part_wallet.js').read()+'\n'+open('part_engine.js').read()
snd=open('part_sound.js').read().replace("    refill(){","    tone, arp, note, thud,\n    refill(){",1)
ids={"wild":"spiky_fruit","boar":"boar","chicken":"chicken","egg":"egg","drink":"drink","pasta":"pasta","wrap":"wrap","banana3":"banana3","banana2":"banana2","banana1":"banana1","bowl":"goop_bowl","jug":"jug"}
import json
src={}
for k,v in ids.items(): src["f_"+k]=open(f'icons/{v}.a.webp','rb').read()
src["f_spiky"]=src.pop("f_wild")
for n in ["crystals","dj","hostess","hovercar","mic","greencocktail","purplecocktail","beer3","beer2","beer1","via","disco"]: src["p_"+n]=open(f'icons2/{n}.a.webp','rb').read()
for n in ["bossSmoke","bossGun","tommy","cigar","cannoli","bar1","bar2","bar3","pistol","car","fedora","whiskey","briefcase"]: src["m_"+n]=open(f'icons3/{n}.a.webp','rb').read()
src["c_bar"]=src["m_bar1"]; src["m_caseBig"]=open('icons3/briefcase_big.webp','rb').read()
for k,f in [("bg_club","bg/club_bg.webp"),("bg_mob","bg/mob_bg.webp"),("via_hi","bg/via_card.webp")]: src[k]=open(f,'rb').read()
sjs="const SND_SRC="+json.dumps({k:"data:audio/mpeg;base64,"+base64.b64encode(open(f'audio/{k}.mp3','rb').read()).decode() for k in ["gun","tire"]})+";"
ijs=sjs+"\nconst ICON_SRC="+json.dumps({k:"data:image/webp;base64,"+base64.b64encode(v).decode() for k,v in src.items()})+";"
src=sh.replace("/* {{ENGINE}} */",eng).replace("/* {{SOUND}} */",snd)
open('template.html','w').write(src)
open('slot.html','w').write(src.replace("/* {{ICON_JS}} */",ijs))
print(len(src))
