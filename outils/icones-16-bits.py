import math, json
N=32
BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]
def toile(): return [[None]*N for _ in range(N)]
def ramp(v, couleurs, x, y):
    """v dans [0,1] -> une couleur de la rampe, avec tramage ordonné entre deux teintes."""
    v=max(0,min(0.9999,v))*(len(couleurs)-1)
    i=int(v); f=v-i
    seuil=(BAYER[y%4][x%4]+0.5)/16
    return couleurs[min(i+1,len(couleurs)-1)] if f>seuil else couleurs[i]
def contour(t, c):
    """Contour d'un pixel autour de toute forme."""
    a=[r[:] for r in t]
    for y in range(N):
        for x in range(N):
            if t[y][x] is None and any(0<=x+dx<N and 0<=y+dy<N and t[y+dy][x+dx] not in (None,c) for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):
                a[y][x]=c
    return a
L=(-0.55,-0.65,0.52)  # lumière en haut à gauche
def norm(v):
    n=math.sqrt(sum(c*c for c in v)); return tuple(c/n for c in v)
L=norm(L)

# ---------- Boule de cristal ----------
def boule():
    t=toile(); cx,cy,r=16,13,11.2
    # Les violets de la boule de cristal du tour : du fond presque noir au mauve de la brume.
    violets=['#0e0820','#1c0f3d','#2e1863','#45258a','#6538ad','#8a5bc9']
    for y in range(N):
        for x in range(N):
            dx=(x+.5-cx)/r; dy=(y+.5-cy)/r; d=dx*dx+dy*dy
            if d<=1:
                nz=math.sqrt(1-d); n=(dx,dy,nz)
                lam=max(0,sum(a*b for a,b in zip(n,L)))
                # la brume qui tourne dans la boule, plus claire au cœur
                brume=0.22*math.sin(5*dx+3.5*dy+1.2)*math.exp(-2.2*d)
                v=0.16+0.66*lam+brume-0.2*d
                t[y][x]=ramp(v,violets,x,y)
                # un seul reflet, petit et blanc, en haut à gauche
                if (dx+0.42)**2+(dy+0.47)**2<0.03: t[y][x]='#ffffff'
                elif (dx+0.42)**2+(dy+0.47)**2<0.06: t[y][x]='#d9c8f2'
    # pied doré
    ors=['#5a3410','#8f5a1c','#c98c2e','#f2c55c','#fff0b0']
    for y in range(23,31):
        for x in range(N):
            if y<25: demi=4+(y-23)
            elif y<28: demi=3
            else: demi=7+(y-28)
            if abs(x+.5-16)<=demi:
                u=(x+.5-16)/demi
                v=0.75-0.55*u - (0.15 if y>=28 else 0)
                t[y][x]=ramp(v,ors,x,y)
    return contour(t,'#0d0a1c')

# ---------- Pile ou face : la pièce de 20 centimes ----------
CHIFFRES={'2':["0110","1001","0001","0010","0100","1000","1111"],'0':["0110","1001","1001","1001","1001","1001","0110"]}
def piece():
    t=toile(); cx,cy,r=16,16,13.2
    ors=['#4e2c0c','#7d4c16','#b37a26','#e0aa44','#f8d778','#fff4c4']
    for y in range(N):
        for x in range(N):
            dx=(x+.5-cx)/r; dy=(y+.5-cy)/r; d=math.sqrt(dx*dx+dy*dy)
            if d<=1:
                # sept encoches de la « fleur espagnole »
                a=math.atan2(dy,dx); enc=math.cos(7*(a+math.pi/2))
                if d>0.9 and enc>0.92: continue
                if d>0.8:   # tranche : relief éclairé en haut à gauche
                    v=0.55-0.4*(dx*L[0]+dy*L[1])/max(d,.01)*-1
                    v=0.5+0.35*(-(dx*L[0]+dy*L[1]))/max(d,.01)
                elif d>0.72: v=0.15  # sillon sombre
                else:
                    v=0.62+0.18*(-dx-dy)/1.4
                t[y][x]=ramp(v,ors,x,y)
    # « 20 » en relief
    for i,ch in enumerate('20'):
        ox=9+i*8; oy=13
        for yy,ligne in enumerate(CHIFFRES[ch]):
            for xx,b in enumerate(ligne):
                if b=='1':
                    for sx in range(2):
                        X=ox+xx*1+sx*0; 
                    X=ox+xx; Y=oy+yy
                    t[Y][X]='#7d4c16'; 
                    if t[Y-1][X] not in ('#7d4c16',): t[Y-1][X]='#fff4c4' if t[Y-1][X] else t[Y-1][X]
    # étoiles de l'Europe, petites, sur l'anneau
    for k in range(12):
        a=2*math.pi*k/12; x=int(16+math.cos(a)*9.7); y=int(16+math.sin(a)*9.7)
        if t[y][x] and k%2==0: t[y][x]='#fff4c4'
    return contour(t,'#2a1606')

# ---------- Les six prédictions : l'éventail ----------
def eventail():
    t=toile()
    rouges=['#4a0e1a','#7a1c2c','#b13e53','#e0646e']
    cremes=['#b9a98a','#e6dcc4','#fbf6ea']
    def carte(x0,y0,w,h,face):
        for y in range(y0,y0+h):
            for x in range(x0,x0+w):
                coin=(x in (x0,x0+w-1)) and (y in (y0,y0+h-1))
                if coin: continue
                if not face:
                    bord = x in (x0,x0+1,x0+w-2,x0+w-1) or y in (y0,y0+1,y0+h-2,y0+h-1)
                    if bord: t[y][x]=cremes[2] if x not in (x0,x0+w-1) and y not in (y0,y0+h-1) else cremes[1]
                    else:
                        motif=((x-x0)+(y-y0))%4==0 or ((x-x0)-(y-y0))%4==0
                        v=0.35+0.4*(1-(y-y0)/h)
                        t[y][x]='#f2c55c' if motif else ramp(v,rouges,x,y)
                else:
                    v=0.85-0.4*((x-x0)/w)
                    t[y][x]=ramp(v,cremes,x,y)
    carte(2,6,14,20,False)
    carte(8,4,14,20,False)
    carte(15,7,15,22,True)
    # écriture à l'encre sur la carte de face
    encre='#1c2743'
    for y,(a,b) in {11:(18,27),14:(18,25),20:(19,27),21:(20,26)}.items():
        for x in range(a,b):
            if (x+y)%5: t[y][x]=encre
    return contour(t,'#160a10')

# ---------- Analyseur Q : le pique dans son orbite ----------
def analyseur():
    t=toile()
    oranges=['#6b2a0a','#b0520f','#f7931e','#ffc46b']
    # orbite elliptique inclinée
    for k in range(720):
        a=2*math.pi*k/720
        x=16+13.2*math.cos(a); y=16+6.2*math.sin(a)
        xr=16+(x-16)*math.cos(-0.5)-(y-16)*math.sin(-0.5); yr=16+(x-16)*math.sin(-0.5)+(y-16)*math.cos(-0.5)
        X,Y=int(xr),int(yr)
        if 0<=X<N and 0<=Y<N: t[Y][X]=ramp(0.4+0.5*math.sin(a+1),oranges,X,Y)
    # le pique, blanc nacré ombré : un cœur retourné (équation du cœur), et sa tige
    blancs=['#5a6478','#9aa6bd','#d8e0ee','#ffffff']
    for y in range(N):
        for x in range(N):
            u=(x+.5-16)/8.0; v=(y+.5-14.0)/8.0   # v vers le bas
            # Deux lobes ronds, une pointe en haut (le haut d'un triangle), une tige évasée.
            lobes=min((u-0.47)**2+(v-0.22)**2,(u+0.47)**2+(v-0.22)**2)<=0.27
            pointe=-1.05<=v<=0.25 and abs(u)<=(v+1.05)*0.74
            coeur=lobes or pointe
            tige=0.45<v<1.3 and abs(u)<0.08+(v-0.45)**2*0.7
            if coeur or tige:
                lum=0.78-0.42*(u*0.7+v*0.5)
                t[y][x]=ramp(lum,blancs,x,y)
    t=contour(t,'#0b0b12')
    # l'orbite repasse devant le pique sur sa moitié basse
    for k in range(720):
        a=2*math.pi*k/720
        if math.sin(a)<0.2: continue
        x=16+13.2*math.cos(a); y=16+6.2*math.sin(a)
        xr=16+(x-16)*math.cos(-0.5)-(y-16)*math.sin(-0.5); yr=16+(x-16)*math.sin(-0.5)+(y-16)*math.cos(-0.5)
        X,Y=int(xr),int(yr)
        if 0<=X<N and 0<=Y<N: t[Y][X]=ramp(0.5+0.4*math.sin(a+1),oranges,X,Y)
    return t

# ---------- L'écrou ⚙, 24 × 24, symétrique, ombré en anneaux ----------
def ecrou():
    M=24; c=M/2
    ors=['#8f5a1c','#c98c2e','#f2c55c','#fff0b0']
    g=[[None]*M for _ in range(M)]
    for y in range(M):
        for x in range(M):
            dx=x+.5-c; dy=y+.5-c; d=math.hypot(dx,dy); a=math.degrees(math.atan2(dy,dx))%45
            dent=min(a,45-a)<15
            if d<3.3: continue
            if d<8.2 or (d<11.8 and dent):
                if d<4.4: col=ors[0]          # bord du trou, dans l'ombre
                elif d<6.6: col=ors[3]        # anneau éclairé
                elif d<8.2: col=ors[2]
                else: col=ors[1]              # dents
                g[y][x]=col
    # contour
    a=[r[:] for r in g]
    for y in range(M):
        for x in range(M):
            if g[y][x] is None and any(0<=x+dx<M and 0<=y+dy<M and g[y+dy][x+dx] for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):
                a[y][x]='#3a2208'
    return a

def en_grille(t):
    pal={}
    lettres='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    lignes=[]
    for r in t:
        l=''
        for c in r:
            if c is None: l+='.'
            else:
                if c not in pal: pal[c]=None
                l+='?'
        lignes.append(l)
    return lignes

icones={'boule-de-cristal':boule(),'pile-ou-face':piece(),'six-predictions':eventail(),'analyseur-q':analyseur()}
gear=ecrou()
# palette commune
couleurs=[]
for t in list(icones.values())+[gear]:
    for r in t:
        for c in r:
            if c and c not in couleurs: couleurs.append(c)
lettres='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
assert len(couleurs)<=len(lettres), len(couleurs)
code={c:lettres[i] for i,c in enumerate(couleurs)}
def g2(t): return [''.join(code[c] if c else '.' for c in r) for r in t]
out={'palette':{code[c]:c for c in couleurs},'icones':{k:g2(v) for k,v in icones.items()},'ecrou':g2(gear)}
json.dump(out,open(__import__('os').path.join(__import__('os').path.dirname(__file__) or '.', 'icones.json'),'w'),indent=1)
# aperçu SVG
def svg(grille,pal,ox,oy,s):
    r=''
    for y,l in enumerate(grille):
        for x,ch in enumerate(l):
            if ch!='.': r+=f'<rect x="{ox+x*s}" y="{oy+y*s}" width="{s}" height="{s}" fill="{pal[ch]}"/>'
    return r
corps=''
for i,(k,v) in enumerate(out['icones'].items()):
    corps+=svg(v,out['palette'],20+i*180,20,5)
corps+=svg(out['ecrou'],out['palette'],760,40,5)
open(__import__('os').path.join(__import__('os').path.dirname(__file__) or '.', 'apercu.svg'),'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="900" height="200" shape-rendering="crispEdges"><rect width="900" height="200" fill="#20306a"/>{corps}</svg>')
print(len(couleurs),'couleurs')
