/* Zikr Deen App — audio engine: ayah queue, repeat/gap (Hifz mode), speed, sleep timer, offline audio. */
(function(){'use strict';
const ZD=window.ZD,$=ZD.$;
const audioDB=ZD.idb('zikrDeenAppAudioV1','audio','key');
const akey=(r,s,a)=>r+'|'+ZD.pad3(s)+':'+ZD.pad3(a);
ZD.audioKey=akey;

/* The older Al-Mulk page stored blobs as "reciter|NNN" in its own DB. Read it only if it already exists, never create it. */
let legacy=undefined;
async function legacyGet(r,a){
  if(legacy===undefined){legacy=null;try{if(indexedDB.databases){const l=await indexedDB.databases();if(l.some(d=>d.name==='zikrDeenOfflineAudioV1')){legacy=await new Promise((res,rej)=>{const q=indexedDB.open('zikrDeenOfflineAudioV1');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});if(!legacy.objectStoreNames.contains('recitations')){legacy.close();legacy=null}}}}catch(e){legacy=null}}
  if(!legacy)return null;
  return new Promise(res=>{try{const q=legacy.transaction('recitations','readonly').objectStore('recitations').get(r+'|'+ZD.pad3(a));q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)}catch(e){res(null)}});
}
ZD.audioUrls=function(r,s,a){const n=ZD.pad3(s)+ZD.pad3(a),u=['https://everyayah.com/data/'+r+'/'+n+'.mp3'];if(r==='Alafasy_128kbps')u.push('https://verses.quran.com/Alafasy/mp3/'+n+'.mp3');return u};
ZD.hasOffline=async function(r,s,a){try{if(await audioDB.get(akey(r,s,a)))return true}catch(e){}if(s===67){const l=await legacyGet(r,a);if(l&&l.blob)return true}return false};
ZD.offlineCount=async function(r,s){let c=0;try{const keys=await audioDB.keys(),p=r+'|'+ZD.pad3(s)+':';c=keys.filter(k=>String(k).startsWith(p)).length}catch(e){}return c};
ZD.offlineSummary=async function(){const out={};try{for(const k of await audioDB.keys()){const m=/^(.+)\|(\d{3}):\d{3}$/.exec(String(k));if(m){const id=m[1]+'|'+Number(m[2]);out[id]=(out[id]||0)+1}}}catch(e){}return out};
ZD.deleteSurahAudio=async function(r,s){const p=r+'|'+ZD.pad3(s)+':';try{for(const k of await audioDB.keys())if(String(k).startsWith(p))await audioDB.del(k)}catch(e){}};
ZD.clearAllAudio=async function(){try{await audioDB.clear()}catch(e){}};
async function fetchAyah(r,s,a){const key=akey(r,s,a);if(await audioDB.get(key))return'have';let err;for(const u of ZD.audioUrls(r,s,a)){try{const c=new AbortController(),t=setTimeout(()=>c.abort(),30000);let resp;try{resp=await fetch(u,{mode:'cors',signal:c.signal})}finally{clearTimeout(t)}if(!resp.ok)throw new Error('HTTP '+resp.status);const blob=await resp.blob();if(!blob.size)throw new Error('empty');await audioDB.put({key,blob,t:Date.now()});return'saved'}catch(e){err=e}}throw err||new Error('failed')}
ZD.downloadSurahAudio=async function(r,s,from,to,onProg,stop){const total=to-from+1;let ok=0,fail=0;
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  for(let a=from;a<=to;a++){if(stop&&stop())break;try{await fetchAyah(r,s,a);ok++}catch(e){fail++}if(onProg)onProg(ok+fail,total,fail)}
  return{ok,fail,total}};

/* ---------- player ---------- */
const au=new Audio();au.preload='auto';
let objUrl='';
/* next-ayah prefetch: while one ayah plays, the next one is downloaded, so there is no silent gap between ayat */
let pre=null,preBusy='';
async function prefetchNext(i,c){const n=P.queue[i+1];if(!n||c.autoNext===false||navigator.onLine===false)return;
  const key=akey(c.reciter,n.s,n.a);if((pre&&pre.key===key)||preBusy===key)return;
  try{if(await audioDB.get(key))return}catch(e){}
  if(n.s===67){try{const l=await legacyGet(c.reciter,n.a);if(l&&l.blob)return}catch(e){}}
  preBusy=key;
  try{const ac=new AbortController(),t=setTimeout(()=>ac.abort(),25000);let r;
    try{r=await fetch(ZD.audioUrls(c.reciter,n.s,n.a)[0],{mode:'cors',signal:ac.signal})}finally{clearTimeout(t)}
    if(r&&r.ok){const b=await r.blob();if(b&&b.size>500)pre={key,blob:b}}}catch(e){}
  preBusy='';}
const P=ZD.player={queue:[],i:-1,playing:false,rep:0,gapT:0,sleepT:0,sleepEnd:0,loop:0,loopDone:0,cfg:null,listeners:new Set()};
const emit=()=>P.listeners.forEach(f=>{try{f(P)}catch(e){}});
ZD.onPlayer=f=>{P.listeners.add(f);return()=>P.listeners.delete(f)};
P.cur=()=>P.queue[P.i]||null;
function cfg(){const p=ZD.prefs();return Object.assign({repeat:p.repeat,gap:p.gap,speed:p.speed,reciter:p.reciter,autoNext:p.autoNext,nextSurah:p.nextSurah},P.cfg||{})}
function freeUrl(){if(objUrl){URL.revokeObjectURL(objUrl);objUrl=''}}
async function sourceFor(item,c){
  try{const rec=await audioDB.get(akey(c.reciter,item.s,item.a));if(rec&&rec.blob){objUrl=URL.createObjectURL(rec.blob);return[objUrl]}}catch(e){}
  if(item.s===67){const l=await legacyGet(c.reciter,item.a);if(l&&l.blob){objUrl=URL.createObjectURL(l.blob);return[objUrl]}}
  const urls=ZD.audioUrls(c.reciter,item.s,item.a);
  if(pre&&pre.key===akey(c.reciter,item.s,item.a)){const b=pre.blob;pre=null;objUrl=URL.createObjectURL(b);return[objUrl].concat(urls)}
  return urls;
}
let token=0;
async function load(i,opts){
  opts=opts||{};clearTimeout(P.gapT);const my=++token;P.i=i;const item=P.queue[i];if(!item)return;
  P.rep=opts.keepRep?P.rep:0;const c=cfg();freeUrl();au.pause();emit();
  const urls=await sourceFor(item,c);if(my!==token)return;
  let k=0;au.onerror=()=>{if(my!==token)return;k++;if(k<urls.length){au.src=urls[k];au.playbackRate=c.speed;au.play().catch(()=>{})}else{P.playing=false;emit();ZD.toast('Audio could not load. Check your internet connection or download this surah for offline.')}};
  au.src=urls[0];au.playbackRate=c.speed;au.defaultPlaybackRate=c.speed;
  try{await au.play();P.playing=true}catch(e){P.playing=false}
  try{prefetchNext(i,c)}catch(e){}
  setMedia(item);emit();
}
au.addEventListener('playing',()=>{P.playing=true;emit()});
au.addEventListener('pause',()=>{if(!au.ended){P.playing=false;emit()}});
au.addEventListener('timeupdate',()=>{emit()});
au.addEventListener('ended',()=>{
  const c=cfg(),item=P.cur();if(!item)return;
  P.rep++;
  const advance=()=>{
    if(P.rep<c.repeat){load(P.i,{keepRep:true});return}
    if(P.i+1<P.queue.length){if(c.autoNext!==false)load(P.i+1);else{P.playing=false;emit()}return}
    if(P.loop>1&&P.loopDone+1<P.loop){P.loopDone++;load(0);return}
    if(c.nextSurah&&item.s<114&&!P.noChain){ZD.playSurah(item.s+1,1,{keepCfg:true});return}
    P.playing=false;emit();
  };
  const gapSec=c.gap>0?c.gap:0;
  if(gapSec>0){P.playing=false;P.waiting=true;emit();P.gapT=setTimeout(()=>{P.waiting=false;advance()},gapSec*1000)}else advance();
});
P.toggle=function(){if(!P.queue.length)return;if(P.waiting){clearTimeout(P.gapT);P.waiting=false;P.rep=Math.max(0,P.rep);return load(P.i,{keepRep:true})}if(au.paused){if(au.src)au.play().catch(()=>load(P.i));else load(P.i)}else au.pause()};
P.next=function(){if(P.i+1<P.queue.length)load(P.i+1);else if(P.i>=0&&P.queue[P.i].s<114&&!P.noChain)ZD.playSurah(P.queue[P.i].s+1,1,{keepCfg:true})};
P.prev=function(){if(au.currentTime>3){au.currentTime=0;return}if(P.i>0)load(P.i-1);else if(P.i===0)au.currentTime=0};
P.stop=function(){token++;clearTimeout(P.gapT);au.pause();P.playing=false;P.waiting=false;P.queue=[];P.i=-1;P.cfg=null;P.noChain=false;P.loop=0;P.loopDone=0;freeUrl();ZD.setSleep(0);emit()};
P.seekFrac=f=>{if(au.duration)au.currentTime=au.duration*f};
P.progress=()=>au.duration?au.currentTime/au.duration:0;
P.audio=au;

/* queue builders */
ZD.playSurah=function(s,from,opts){opts=opts||{};const n=ZD.surah(s).count;from=Math.max(1,Math.min(n,from||1));const to=Math.max(from,Math.min(n,opts.to||n));
  P.queue=[];for(let a=from;a<=to;a++)P.queue.push({s,a});P.cfg=opts.cfg||(opts.keepCfg?P.cfg:null);P.noChain=!!opts.noChain;P.loop=opts.loop||(opts.keepCfg?P.loop:0);if(!opts.keepCfg)P.loopDone=0;P.waiting=false;
  document.body.classList.remove('no-mini');return load(0)};
ZD.playAyah=function(s,a,opts){opts=opts||{};const n=ZD.surah(s).count;
  if(opts.single){P.queue=[{s,a}];P.cfg=opts.cfg||null;P.noChain=true;P.loop=0;P.loopDone=0;document.body.classList.remove('no-mini');return load(0)}
  /* play from this ayah to the end of the surah */
  return ZD.playSurah(s,a,{cfg:opts.cfg,noChain:opts.noChain})};
ZD.playRange=function(s,from,to,cfg,loop){return ZD.playSurah(s,from,{to,cfg,noChain:true,loop})};
ZD.updateCfg=function(c){P.cfg=Object.assign(P.cfg||{},c);if(c.speed)au.playbackRate=c.speed};

/* sleep timer */
ZD.setSleep=function(min){clearTimeout(P.sleepT);P.sleepEnd=0;if(min>0){P.sleepEnd=Date.now()+min*60000;P.sleepT=setTimeout(()=>{au.pause();P.sleepEnd=0;ZD.toast('Sleep timer finished');emit()},min*60000)}emit()};

/* lock-screen / notification controls */
function setMedia(item){if(!('mediaSession' in navigator)||!item)return;const sr=ZD.surah(item.s);
  try{navigator.mediaSession.metadata=new MediaMetadata({title:sr.en+' — Ayah '+item.a,artist:(ZD.RECITERS.find(r=>r[0]===cfg().reciter)||['','']) [1],album:'Zikr Deen',artwork:[{src:'./icons/icon-192.png',sizes:'192x192',type:'image/png'},{src:'./icons/icon-512.png',sizes:'512x512',type:'image/png'}]});
    navigator.mediaSession.setActionHandler('play',()=>P.toggle());navigator.mediaSession.setActionHandler('pause',()=>P.toggle());
    navigator.mediaSession.setActionHandler('nexttrack',()=>P.next());navigator.mediaSession.setActionHandler('previoustrack',()=>P.prev())}catch(e){}}

/* keep screen on while listening (optional) */
let wake=null;
async function syncWake(){try{if(ZD.prefs().wake&&P.playing&&'wakeLock' in navigator){if(!wake){wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null})}}else if(wake){await wake.release();wake=null}}catch(e){wake=null}}
ZD.onPlayer(syncWake);

/* ---------- mini player UI ---------- */
function updateMini(){
  const m=$('#mini'),it=P.cur();if(!it){m.hidden=true;document.body.classList.add('no-mini');return}
  m.hidden=false;document.body.classList.remove('no-mini');const sr=ZD.surah(it.s),c=cfg();
  $('#miniTitle').textContent=sr.en+' · '+it.a+' / '+sr.count;
  let sub=(ZD.RECITERS.find(r=>r[0]===c.reciter)||['',''])[1];if(c.repeat>1)sub+=' · repeat '+Math.min(P.rep+1,c.repeat)+'/'+c.repeat;if(P.waiting)sub+=' · your turn to recite…';if(P.sleepEnd)sub+=' · sleep '+Math.max(1,Math.round((P.sleepEnd-Date.now())/60000))+'m';
  $('#miniSub').textContent=sub;
  $('#miniPlay').innerHTML=ZD.icon(P.playing?'pause':'play');
  $('#miniFill').style.width=(P.progress()*100).toFixed(1)+'%';
}
ZD.onPlayer(updateMini);
document.addEventListener('DOMContentLoaded',()=>{
  $('#miniPlay').addEventListener('click',()=>P.toggle());$('#miniNext').addEventListener('click',()=>P.next());$('#miniPrev').addEventListener('click',()=>P.prev());
  $('#miniOpen').addEventListener('click',()=>{const it=P.cur();if(it)location.hash='#/read/'+it.s+'/'+it.a});
  $('#miniSet').addEventListener('click',()=>ZD.playbackSheet());
});

ZD.playbackSheet=function(){
  const p=ZD.prefs(),c=cfg();
  const rec=ZD.RECITERS.map(r=>'<option value="'+r[0]+'"'+(r[0]===c.reciter?' selected':'')+'>'+ZD.esc(r[1])+'</option>').join('');
  const sp=[0.75,0.9,1,1.15,1.3,1.5].map(x=>'<option value="'+x+'"'+(x===c.speed?' selected':'')+'>'+x+'×</option>').join('');
  ZD.openSheet('<h3>Playback & Hifz mode</h3>'+
   '<div class="field"><label for="pbRec">Reciter</label><select id="pbRec">'+rec+'</select></div>'+
   '<div class="field"><label for="pbSpeed">Speed</label><select id="pbSpeed">'+sp+'</select></div>'+
   '<div class="field"><label for="pbRep">Repeat each ayah</label><input type="number" id="pbRep" min="1" max="20" value="'+c.repeat+'" style="width:84px"></div>'+
   '<div class="field"><label for="pbGap">Pause after each ayah (seconds) <span class="muted small">— recite it yourself in the gap</span></label><input type="number" id="pbGap" min="0" max="30" value="'+c.gap+'" style="width:84px"></div>'+
   '<div class="field"><label>Continue to next ayah</label><button class="switch" id="pbAuto" role="switch" aria-checked="'+(c.autoNext!==false)+'" aria-label="Continue to next ayah"></button></div>'+
   '<div class="field"><label>Continue into the next surah</label><button class="switch" id="pbNext" role="switch" aria-checked="'+(!!c.nextSurah)+'" aria-label="Continue into next surah"></button></div>'+
   '<div class="field"><label for="pbSleep">Sleep timer</label><select id="pbSleep"><option value="0">Off</option><option value="10">10 min</option><option value="20">20 min</option><option value="30">30 min</option><option value="60">60 min</option></select></div>'+
   '<p class="muted small">Tip: Repeat 3× with a 5-second pause works well for memorising one ayah at a time. Speeds above 1.15× can sound choppy on some phones.</p>'+
   '<div style="display:flex;gap:8px;margin-top:8px"><button class="btn" id="pbDone">Done</button><button class="btn ghost" id="pbStop">Stop playback</button></div>',
   sh=>{
    const apply=()=>{const n={reciter:$('#pbRec',sh).value,speed:Number($('#pbSpeed',sh).value),repeat:Math.min(20,Math.max(1,Number($('#pbRep',sh).value)||1)),gap:Math.min(30,Math.max(0,Number($('#pbGap',sh).value)||0)),autoNext:$('#pbAuto',sh).getAttribute('aria-checked')==='true',nextSurah:$('#pbNext',sh).getAttribute('aria-checked')==='true'};
      Object.assign(p,n);ZD.updateCfg(n);ZD.save();updateMini()};
    sh.addEventListener('change',e=>{if(e.target.id==='pbSleep'){ZD.setSleep(Number(e.target.value));return}apply()});
    ['pbAuto','pbNext'].forEach(id=>$('#'+id,sh).addEventListener('click',e=>{const b=e.currentTarget;b.setAttribute('aria-checked',b.getAttribute('aria-checked')!=='true');apply()}));
    $('#pbDone',sh).addEventListener('click',ZD.closeSheet);$('#pbStop',sh).addEventListener('click',()=>{P.stop();ZD.closeSheet()});
   });
};
})();
