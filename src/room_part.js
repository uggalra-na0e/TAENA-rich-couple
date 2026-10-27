const W=212,H=166,U=8,OX=106,OY=62;
const cv=document.getElementById('cv');cv.width=W;cv.height=H;
const ctx=cv.getContext('2d');const img=ctx.createImageData(W,H);const buf=new Uint32Array(img.data.buffer);
const C=h=>{h=h.replace('#','');const n=parseInt(h,16);return (255<<24)|((n&255)<<16)|(((n>>8)&255)<<8)|(n>>16)};
const px=(x,y,c)=>{x|=0;y|=0;if(x>=0&&y>=0&&x<W&&y<H)buf[y*W+x]=c};
const P=(x,y,z=0)=>[OX+(x-y)*U,OY+(x+y)*U/2-z*U];
function inside(pts,x,y){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c}
function poly(pts,c){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const[a,b]of pts){x0=Math.min(x0,a);y0=Math.min(y0,b);x1=Math.max(x1,a);y1=Math.max(y1,b)}
  for(let y=Math.floor(y0);y<=y1;y++)for(let x=Math.floor(x0);x<=x1;x++)if(inside(pts,x+.5,y+.5))px(x,y,c)}
function line(a,b,c){let[x0,y0]=a.map(Math.round),[x1,y1]=b.map(Math.round);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;
  for(;;){px(x0,y0,c);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}}
function outline(pts,c){for(let i=0;i<pts.length;i++)line(pts[i],pts[(i+1)%pts.length],c)}
const K=C('#3a2a2e');
function box(x,y,z,w,d,h,top,fa,fb,ol=K){
  const A=[P(x,y+d,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x,y+d,z+h)];
  const B=[P(x+w,y,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x+w,y,z+h)];
  const T=[P(x,y,z+h),P(x+w,y,z+h),P(x+w,y+d,z+h),P(x,y+d,z+h)];
  poly(A,fa);poly(B,fb);poly(T,top);outline(A,ol);outline(B,ol);outline(T,ol);return{A,B,T}}
// quad on left wall (x=0 plane): y range, z range
const LW=(y0,y1,z0,z1)=>[P(0,y0,z0),P(0,y1,z0),P(0,y1,z1),P(0,y0,z1)];
const RW=(x0,x1,z0,z1)=>[P(x0,0,z0),P(x1,0,z0),P(x1,0,z1),P(x0,0,z1)];
// face A (y=const) quad, face B (x=const) quad helpers for details
const FA=(y,x0,x1,z0,z1)=>[P(x0,y,z0),P(x1,y,z0),P(x1,y,z1),P(x0,y,z1)];
const FB=(x,y0,y1,z0,z1)=>[P(x,y0,z0),P(x,y1,z0),P(x,y1,z1),P(x,y0,z1)];

// background
for(let i=0;i<W*H;i++)buf[i]=C('#cfe6ef');
// walls
const N=12,WH=7;
poly([P(0,0,0),P(0,N,0),P(0,N,WH),P(0,0,WH)],C('#d9eef3'));
poly([P(0,0,0),P(N,0,0),P(N,0,WH),P(0,0,WH)],C('#c4e2ea'));
// polka dots on walls
for(let y=0.5;y<N;y+=1)for(let z=0.6;z<WH;z+=1){const p=P(0,y+((z*2|0)%2?.5:0),z);px(p[0],p[1],C('#b6d8e3'));}
for(let x=0.5;x<N;x+=1)for(let z=0.6;z<WH;z+=1){const p=P(x+((z*2|0)%2?.5:0),0,z);px(p[0],p[1],C('#a7cfdc'));}
// wall top caps
outline([P(0,N,WH),P(0,0,WH),P(N,0,WH)],K);
line(P(0,0,0),P(0,0,WH),C('#8fb9c7'));
// baseboard
poly([P(0,0,0),P(0,N,0),P(0,N,.35),P(0,0,.35)],C('#fff6e8'));
poly([P(0,0,0),P(N,0,0),P(N,0,.35),P(0,0,.35)],C('#f1e2c8'));
// floor
const FL=[P(0,0),P(N,0),P(N,N),P(0,N)];
poly(FL,C('#e9b97a'));
for(let k=0;k<N*2;k++){const y=k/2;line(P(0,y),P(N,y),C('#d6a263'));
  for(let s=(k%3)*1.3;s<N;s+=4){line(P(s,y),P(s,y+.5),C('#d6a263'))}}
outline(FL,K);

// window on left wall
const win=LW(2,5.2,2.8,5.8);poly(win,C('#ffffff'));outline(win,K);
const glass=LW(2.3,4.9,3.1,5.5);poly(glass,C('#9fd3f0'));
for(let i=0;i<40;i++){const y=2.4+rnd()*2.4,z=3.2+rnd()*2.2;const p=P(0,y,z);px(p[0],p[1],C('#d8f0ff'))}
// autumn tree blob in window
poly(LW(3.6,4.7,3.1,4.6),C('#f2a33a'));poly(LW(3.9,4.5,4.4,5.1),C('#f6c445'));line(P(0,4.15,3.1),P(0,4.15,3.6),C('#7a4a2a'));
line(P(0,3.6,3.1),P(0,3.6,5.5),C('#ffffff'));line(P(0,2.3,4.3),P(0,4.9,4.3),C('#ffffff'));
// curtain-ish sill
poly(LW(1.8,5.4,2.6,2.85),C('#fff6e8'));outline(LW(1.8,5.4,2.6,2.85),K);

// calendar on left wall (카드값)
const cal=LW(7.2,9,3.6,5.6);poly(cal,C('#ffffff'));poly(LW(7.2,9,5.0,5.6),C('#e05a5a'));outline(cal,K);
for(let r=0;r<3;r++)for(let c=0;c<4;c++){const p=P(0,7.5+c*.38,4.65-r*.38);px(p[0],p[1],C('#9a8a8a'));px(p[0]+1,p[1],C('#9a8a8a'))}
{const p=P(0,8.3,3.95);for(let a=0;a<8;a++){px(p[0]+Math.round(Math.cos(a*.8)*3),p[1]+Math.round(Math.sin(a*.8)*2),C('#e05a5a'))}}

// frame on right wall (goal picture: coin)
const fr=RW(2.2,4.4,4.2,6.2);poly(fr,C('#f6c445'));outline(fr,K);
poly(RW(2.5,4.1,4.5,5.9),C('#fff8ec'));
{const p=P(3.3,0,5.2);for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++)if(dx*dx+dy*dy<=16)px(p[0]+dx,p[1]+dy,C('#f6c445'));
 for(let dy=-2;dy<=2;dy++)px(p[0],p[1]+dy,C('#c98a1a'));px(p[0]-1,p[1]-1,C('#c98a1a'));px(p[0]+1,p[1]+1,C('#c98a1a'))}
// small heart frame
const fr2=RW(5.2,6.4,5.0,6.2);poly(fr2,C('#e7dbf6'));outline(fr2,K);
{const p=P(5.8,0,5.6);const hm=["0110110","1111111","1111111","0111110","0011100","0001000"];hm.forEach((r,i)=>[...r].forEach((v,j)=>{if(v==='1')px(p[0]-3+j,p[1]-3+i,C('#e05a5a'))}))}

// plant in corner
box(.3,.3,0,1,1,1.1,C('#c96f4a'),C('#b55d3b'),C('#9e4f31'));
{const p=P(.8,.8,1.1);const leaves=[[0,-14],[-4,-10],[4,-10],[-6,-5],[6,-5],[-2,-7],[2,-7],[0,-4]];
 for(const[dx,dy]of leaves)for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)if(a*a+b*b<=4)px(p[0]+dx+a,p[1]+dy+b,C(((dx+dy)&2)?'#5fae5b':'#4b9649'));}

// bookshelf on right wall
const sh=box(3.6,0,0,3.6,1.2,3.6,C('#fff6e8'),C('#f3dcb6'),C('#e4c79a'));
for(let r=0;r<3;r++)for(let c=0;c<3;c++){const x0=3.75+c*1.17,z0=.15+r*1.15;const cell=FA(1.2,x0,x0+1.05,z0,z0+1.0);poly(cell,C('#d9b98a'));outline(cell,K);
  const cols=['#e05a5a','#4f8de0','#f6c445','#5fae5b','#9a6fd0','#ff9ab0'];
  if((r+c)%3!==1){for(let b=0;b<4;b++){const bx=x0+.08+b*.22;poly(FA(1.2,bx,bx+.18,z0,z0+.8-(b%2)*.15),C(cols[(r*3+c+b)%6]))}}
  else{poly(FA(1.2,x0+.25,x0+.8,z0,z0+.5),C('#f6c445'));outline(FA(1.2,x0+.25,x0+.8,z0,z0+.5),K)}}
// teddy-ish money bag on top of shelf
box(4.2,.2,3.6,.9,.8,.7,C('#f0d9a8'),C('#e2c48a'),C('#cfae70'));

// safe (금고)
const sf=box(8.4,0,0,1.8,1.5,2.2,C('#b8c2cc'),C('#9aa6b2'),C('#7d8996'));
poly(FA(1.5,8.65,9.95,.25,1.95),C('#aab5c0'));outline(FA(1.5,8.65,9.95,.25,1.95),K);
{const p=P(9.3,1.5,1.1);for(let a=0;a<16;a++)px(p[0]+Math.round(Math.cos(a*.4)*3),p[1]+Math.round(Math.sin(a*.4)*3),K);px(p[0],p[1],C('#f6c445'));px(p[0]+1,p[1],C('#f6c445'))}

// desk on left wall
box(0,6.0,0,2.2,3.8,.1,C('#2f4f8a'),C('#2f4f8a'),C('#2f4f8a'));
box(.05,6.05,0,2.1,1.3,2.3,C('#4f8de0'),C('#4f8de0'),C('#3a72c0')); // drawer block
for(let i=0;i<3;i++){const z=.35+i*.65;line(P(2.15,6.25,z+.45),P(2.15,7.15,z+.45),K);px(...P(2.15,6.7,z+.2),C('#f6c445'))}
box(1.75,9.4,0,.35,.35,2.3,C('#e05a5a'),C('#c94848'),C('#b03c3c'));
box(0,6.0,2.3,2.25,3.8,.3,C('#f07060'),C('#e05a5a'),C('#c94848'));
// monitor + pc
box(.25,7.3,2.6,.5,.5,.2,C('#cfd6dd'),C('#b7c0c9'),C('#9aa6b2'));
const mon=box(.15,6.7,2.8,.6,1.9,1.6,C('#dde3e9'),C('#c9d1d9'),C('#b7c0c9'));
const scr=FB(.75,6.85,8.45,3.0,4.25);poly(scr,C('#2a3a4a'));
// mini chart on screen
{const pts=[[6.95,3.2],[7.3,3.5],[7.6,3.35],[7.9,3.8],[8.3,4.1]];for(let i=0;i<pts.length-1;i++)line(P(.75,pts[i][0],pts[i][1]),P(.75,pts[i+1][0],pts[i+1][1]),C('#7ee08f'))}
box(1.0,7.0,2.6,.7,1.5,.12,C('#f4f6f8'),C('#dfe4e9'),C('#c9d1d9')); // keyboard
box(1.2,8.9,2.6,.35,.3,.12,C('#f4f6f8'),C('#dfe4e9'),C('#c9d1d9'));
// chair
box(2.9,7.4,0,.2,.2,1.3,C('#555'),C('#444'),C('#333'));
box(2.5,7.0,1.3,1.1,1.1,.25,C('#e05a5a'),C('#c94848'),C('#b03c3c'));
box(3.45,7.0,1.55,.2,1.1,1.3,C('#e05a5a'),C('#c94848'),C('#b03c3c'));

// rug
const rug=[P(4.6,4.4),P(10.2,4.4),P(10.2,10.2),P(4.6,10.2)];poly(rug,C('#e7dbf6'));outline(rug,C('#9a6fd0'));
const rug2=[P(5.1,4.9),P(9.7,4.9),P(9.7,9.7),P(5.1,9.7)];outline(rug2,C('#c3a8ea'));
for(let i=0;i<5;i++)for(let j=0;j<5;j++){if((i+j)%2)continue;const p=P(5.6+i*.95,5.4+j*.95);px(p[0],p[1],C('#c3a8ea'));px(p[0]+1,p[1],C('#c3a8ea'))}

// coin stacks
function coins(x,y,n){for(let i=0;i<n;i++)box(x,y,i*.18,.5,.5,.18,C('#ffd966'),C('#f6c445'),C('#d9a52b'))}

const PIG=[
"...........yy.........",
"..........kyyk........",
".......kkkkkkkkkk.....",
"....kk.kxxxxxxxxxkk...",
"...kxkkxxxxxxxxxxxxk..",
"...kxxxxxxxxxxxxxxxxk.",
"..kxkxxxxxxxxxxxxxxxk.",
".kkxxxxxxxxxxxxxxxxxxk",
"kXkXxxxxxxxxxxxxxxxxkn",
"kXXXxxxxxxxxxxxxxxxxkk",
".kkxxxxxxxxxxxxxxxxxk.",
"..kxxxxxxxxxxxxxxxxxk.",
"...kkxxxxxxxxxxxxxkk..",
"...kXk.kkkkkkkkk.kXk..",
"...kkk...........kkk.."];
const PAL={k:'#241a22',y:'#f6c445',x:'#f5a3b8',X:'#e07c99',n:'#a85770'};
const HEART=["0110110","1111111","1111111","0111110","0011100","0001000"];
const CC={};const cc=h=>CC[h]??(CC[h]=C(h));

// 여기까지가 움직이지 않는 배경. 저장해 두고 매 프레임 그 위에 움직이는 것만 다시 그려요
const BG=buf.slice();
function grid(g,x,y){for(let i=0;i<g.length;i++){const r=g[i];for(let j=0;j<r.length;j++)if(r[j])px(x+j,y+i,cc(r[j]))}}
function frame(st){
  buf.set(BG);
  const items=[
    {d:16.8,f:()=>coins(9.2,7.6,4)},{d:18.1,f:()=>coins(9.9,8.2,2)},{d:17,f:()=>coins(8.6,8.4,3)},
    {d:14.8,f:()=>{const p=P(8.9,5.9);const dx=st.pigX||0;PIG.forEach((r,i)=>[...r].forEach((ch,j)=>{if(ch!=='.')px(p[0]-11+j+dx,p[1]-15+i,cc(PAL[ch]))}));
      if(st.coin!=null){const cy=Math.round(p[1]-34+st.coin*20);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)px(p[0]+1+a,cy+b,cc(Math.abs(a)+Math.abs(b)===2?'#d9a52b':'#ffd966'))}}},
    ...st.chars.map(c=>({d:c.x+c.y,f:()=>{const p=P(c.x,c.y);grid(c.g,Math.round(p[0])-8,Math.round(p[1])-c.g.length+c.dy)}}))];
  items.sort((a,b)=>a.d-b.d).forEach(i=>i.f());
  if(st.heart){const p=P(st.heart.x,st.heart.y);const y0=Math.round(p[1]-40-st.heart.rise);HEART.forEach((r,i)=>[...r].forEach((v,j)=>{if(v==='1')px(Math.round(p[0])-3+j,y0+i,cc('#ff6f91'))}))}
  ctx.putImageData(img,0,0);
}
