/* Zikr Deen App — boot: preferences, service worker, opening sequence. */
(function(){'use strict';
const ZD=window.ZD;
ZD.applyPrefs();
if(ZD.mulkSeed)ZD.mulkSeed();
try{if(!location.hash)history.replaceState(null,'','#/home')}catch(e){/* sandboxed preview: the router already defaults to Home */}
ZD.route();

/* ---------- Bismillah, written stroke by stroke like a pen ----------
   icons/bismillah-ink.png  : the calligraphy as a crisp 2200px mask
   icons/bismillah-time.png : for every point of the ink, WHEN the pen reaches it (stroke order: right to left,
                              baseline first, tall strokes rise after it, dots and marks come last) */
const INK_SRC='./icons/bismillah-ink.png',TIME_SRC='./icons/bismillah-time.png';
function writeBismillah(cv,opts){
  opts=opts||{};const total=opts.ms||2400;
  return new Promise(resolve=>{
    const load=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src});
    Promise.all([load(INK_SRC),load(TIME_SRC)]).then(([ink,tm])=>{try{
      const dpr=Math.min(3,window.devicePixelRatio||1),cssW=cv.clientWidth||cv.getBoundingClientRect().width||340;
      const W=Math.max(700,Math.min(1500,Math.round(cssW*dpr))),H=Math.round(W*ink.height/ink.width);
      cv.width=W;cv.height=H;
      const off=document.createElement('canvas');off.width=W;off.height=H;const oc=off.getContext('2d',{willReadFrequently:true});
      oc.imageSmoothingEnabled=true;oc.imageSmoothingQuality='high';oc.drawImage(ink,0,0,W,H);const A=oc.getImageData(0,0,W,H).data;
      oc.clearRect(0,0,W,H);oc.drawImage(tm,0,0,W,H);const T=oc.getImageData(0,0,W,H).data;
      const N=W*H,B=256,cnt=new Int32Array(B+1);
      for(let i=0;i<N;i++)if(A[i*4+3]>4)cnt[T[i*4]+1]++;
      for(let k=0;k<B;k++)cnt[k+1]+=cnt[k];
      const order=new Int32Array(cnt[B]),pos=cnt.slice();
      for(let i=0;i<N;i++)if(A[i*4+3]>4)order[pos[T[i*4]]++]=i;
      const ctx=cv.getContext('2d'),out=ctx.createImageData(W,H),od=out.data;
      for(let y=0;y<H;y++){const f=y/H,g=Math.round(252-f*40),bb=Math.round(240-f*110);for(let x=0;x<W;x++){const i=(y*W+x)*4;od[i]=255;od[i+1]=g;od[i+2]=bb;od[i+3]=0}}
      const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
      let shown=0;const t0=performance.now()+(opts.delay||250);
      const ease=t=>t+((t*t*(3-2*t))-t)*0.35;
      const reveal=upto=>{for(let b=shown;b<upto;b++)for(let k=cnt[b];k<cnt[b+1];k++){const i=order[k];od[i*4+3]=A[i*4+3]}shown=Math.max(shown,upto)};
      const frame=now=>{
        const t=reduce?1:Math.min(1,Math.max(0,(now-t0)/total));
        if(t>=1){reveal(B);ctx.putImageData(out,0,0);resolve();return}
        reveal(Math.min(B,Math.floor(ease(t)*B)+1));ctx.putImageData(out,0,0);requestAnimationFrame(frame)};
      requestAnimationFrame(frame);
    }catch(e){resolve()}}).catch(()=>resolve());
  });
}

/* ---------- opening sequence: Bismillah (hand-written) -> cosmic intro -> app. Runs on every open unless turned off in More. ---------- */
(function(){
  const p=ZD.prefs(),splash=document.getElementById('splash'),frame=document.getElementById('intro'),cv=document.getElementById('bsCanvas');
  const show=p.intro==='always'||(p.intro==='daily'&&p.introDay!==ZD.today());
  const drop=()=>{if(splash)splash.remove();if(frame)frame.remove();document.body.classList.remove('introing')};
  if(!show||!splash||!frame){drop();return}
  document.body.classList.add('introing');frame.hidden=false;
  /* sound: starts as soon as the browser allows it; a button lets the viewer turn it on/off */
  const snd=document.getElementById('sndBtn'),S=ZD.sound;let sndOn=false;
  const paint=()=>{if(!snd)return;const needs=S&&S.state()==='suspended';snd.classList.toggle('need',!!needs&&sndOn);snd.setAttribute('aria-pressed',String(sndOn&&!S.isMuted()));
    snd.querySelector('use').setAttribute('href',sndOn&&!S.isMuted()&&!needs?'#i-vol':'#i-mute');snd.querySelector('span').textContent=needs&&sndOn?'Tap for sound':(sndOn&&!S.isMuted()?'Sound on':'Sound off')};
  if(snd&&S&&S.supported){snd.hidden=false;
    if(p.introSound!=='off'){sndOn=S.start(p.introSound)}
    snd.addEventListener('click',e=>{e.stopPropagation();
      if(!sndOn){sndOn=S.start(p.introSound==='off'?'azan':p.introSound);if(handed){S.level(.3,2.5)}}
      else if(S.state()==='suspended'){S.resume()}
      else S.mute(!S.isMuted());
      setTimeout(paint,150)});
    /* any first touch also unlocks audio */
    const unlock=()=>{if(sndOn&&S.state()==='suspended')S.resume().then(()=>setTimeout(paint,100))};
    window.addEventListener('pointerdown',unlock,{once:false});
    const iv=setInterval(()=>{paint();if(ended)clearInterval(iv)},500);paint()}
  let ready=false,written=false,handed=false,ended=false;
  const finish=()=>{if(ended)return;ended=true;clearTimeout(fail);if(S&&sndOn)S.fadeOut(1.4);if(snd)snd.remove();document.body.classList.remove('introing');
    p.introDay=ZD.today();ZD.save();
    if(splash.parentNode){splash.classList.add('out');setTimeout(()=>splash.remove(),1000)}
    frame.classList.remove('show');frame.classList.add('gone');setTimeout(()=>frame.remove(),700)};
  const hand=()=>{if(handed||ended)return;handed=true;if(S&&sndOn){S.level(.3,3.5);if(p.introSound==='reciteonly')setTimeout(()=>S.recite(),2200)}frame.classList.add('show');splash.classList.add('out');setTimeout(()=>{if(splash.parentNode)splash.remove()},1000)};
  const tryHand=()=>{if(ready&&written)hand()};
  window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||!e.data)return;
    if(e.data.zd==='intro-ready'){ready=true;tryHand()}
    if(e.data.zd==='intro-done')finish()});
  writeBismillah(cv,{ms:2400,delay:250}).then(()=>setTimeout(()=>{written=true;tryHand()},650));
  splash.addEventListener('click',()=>{written=true;tryHand()});          /* tap to skip the writing */
  const fail=setTimeout(()=>{if(!ready)finish()},12000);                    /* intro could not load: go straight to the app */
  frame.addEventListener('error',finish);
  if(window.ZD_INTRO_DOC)frame.srcdoc=window.ZD_INTRO_DOC;else frame.src='./intro.html';
})();

if('serviceWorker' in navigator&&window.isSecureContext){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').then(reg=>{
    reg.addEventListener('updatefound',()=>{const w=reg.installing;if(w)w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)ZD.toast('Update ready — it will apply next time you open the app')})});
  }).catch(()=>{})});
}
})();
