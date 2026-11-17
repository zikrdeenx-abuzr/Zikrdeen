/* Zikr Deen App — intro sound (v16).
   The intro now opens with a real azan recording (audio/azan-intro.mp3, ~41 s) instead of the old synthesised ambience.
   It plays once from the very start of the intro and fades out when the intro ends.
   Played from a decoded buffer with latencyHint:'playback' (big safety buffer) = no crackle.
   Optional mode "reciteonly": a soft recitation of the opening ayat of Surah Al-Mulk (downloaded first, then played). */
(function(){'use strict';
const ZD=window.ZD;
let ctx=null,master=null,src=null,stopT=0,rec=null,recT=0,recFade=0,recUrls=[],recTok=0,mode='azan',muted=false,level=0.85,an=null;
const AC=window.AudioContext||window.webkitAudioContext;
const AZAN_URL='./audio/azan-intro.mp3',AZAN_LEVEL=0.85;

function build(){
  try{ctx=new AC({latencyHint:'playback'})}catch(e){ctx=new AC()}
  const c=ctx;
  master=ctx.createGain();master.gain.value=0;
  an=ctx.createAnalyser();an.fftSize=1024;
  master.connect(an);an.connect(ctx.destination);
  if(mode==='azan')fetch(AZAN_URL).then(r=>{if(!r.ok)throw new Error('azan missing');return r.arrayBuffer()})
    .then(b=>new Promise((ok,no)=>{const p=c.decodeAudioData(b,ok,no);if(p&&p.catch)p.catch(no)}))
    .then(buf=>{if(ctx!==c)return;const s=c.createBufferSource();s.buffer=buf;s.loop=false;s.connect(master);s.start(0);src=s})
    .catch(()=>{/* file unavailable: stay silent */});
}

const S=ZD.sound={
  supported:!!AC,
  state:()=>ctx?ctx.state:'none',
  start(m){mode=m||'azan';if(!AC||mode==='off')return false;if(!ctx)build();muted=false;level=AZAN_LEVEL;S.resume();S.level(level,1.2);return true},
  resume(){if(!ctx)return Promise.resolve();if(rec&&rec.paused&&!rec.ended&&rec.src&&!muted)rec.play().catch(()=>{});return ctx.resume().catch(()=>{})},
  /* the azan is always played at its own fixed level; other callers cannot make it quieter mid-recitation */
  level(v,sec){if(mode==='azan')v=AZAN_LEVEL;level=v;if(!master||muted)return;const t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(master.gain.value,t);master.gain.linearRampToValueAtTime(v,t+(sec||1))},
  mute(on){muted=!!on;if(!master)return;const t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(master.gain.value,t);master.gain.linearRampToValueAtTime(muted?0:level,t+.6);if(rec)rec.muted=muted},
  isMuted:()=>muted,
  /* soft recitation of the first ayat of Al-Mulk (mode "reciteonly"); the 3 short files are downloaded FIRST, then played from memory */
  recite(){if(mode!=='reciteonly'||rec||muted)return;
    const r=ZD.prefs().reciter||'Alafasy_128kbps',tok=++recTok;
    const a=new Audio();a.preload='auto';a.volume=0;rec=a;
    const grab=async u=>{const ac=new AbortController(),t=setTimeout(()=>ac.abort(),15000);
      try{const resp=await fetch(u,{signal:ac.signal,mode:'cors'});if(!resp.ok)throw new Error('http');return URL.createObjectURL(await resp.blob())}
      finally{clearTimeout(t)}};
    Promise.all([1,2,3].map(n=>grab('https://everyayah.com/data/'+r+'/067'+ZD.pad3(n)+'.mp3').catch(()=>null))).then(urls=>{
      if(tok!==recTok||rec!==a){urls.forEach(u=>u&&URL.revokeObjectURL(u));return}
      recUrls=urls.filter(Boolean);if(!recUrls.length)return;
      let i=0;const next=()=>{if(tok!==recTok||rec!==a||i>=recUrls.length)return;a.src=recUrls[i++];a.play().catch(()=>{})};
      a.addEventListener('ended',()=>{recT=setTimeout(next,700)});
      const vmax=.7;let v=0;recFade=setInterval(()=>{if(rec!==a){clearInterval(recFade);return}v=Math.min(vmax,v+.02);a.volume=muted?0:v;if(v>=vmax)clearInterval(recFade)},180);
      next()})},
  fadeOut(sec){sec=sec||1.4;clearTimeout(recT);clearInterval(recFade);recTok++;
    if(rec){const r=rec,urls=recUrls;recUrls=[];rec=null;let v=r.volume;const f=setInterval(()=>{v=Math.max(0,v-.04);r.volume=v;if(v<=0){clearInterval(f);r.pause();r.removeAttribute('src');urls.forEach(u=>URL.revokeObjectURL(u))}},sec*1000/10)}
    if(master){const t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(master.gain.value,t);master.gain.linearRampToValueAtTime(0,t+sec)}
    clearTimeout(stopT);const c=ctx;stopT=setTimeout(()=>{try{if(src)src.stop()}catch(e){}try{if(c)c.close()}catch(e){}if(ctx===c){ctx=null;master=null;src=null;an=null}},sec*1000+300)},
  rms(){if(!an)return -1;const d=new Float32Array(an.fftSize);an.getFloatTimeDomainData(d);let s=0;for(const v of d)s+=v*v;return Math.sqrt(s/d.length)},
  /* try it from More */
  preview(m){m=(m==='off'||!m)?'azan':m;S.start(m);if(m==='reciteonly')S.recite();clearTimeout(S._pt);S._pt=setTimeout(()=>S.fadeOut(1.6),m==='azan'?12000:9000)}
};
})();
