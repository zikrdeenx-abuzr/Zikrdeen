/* Zikr Deen App — views and router. */
(function(){'use strict';
const ZD=window.ZD,$=ZD.$,esc=ZD.esc,icon=ZD.icon,P=ZD.player;
const view=()=>$('#view');
const R=ZD.R={};
let cleanups=[];
ZD.onLeave=f=>cleanups.push(f);
const BISM='بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

function top(title,sub,o){o=o||{};
  return '<header class="topbar">'+(o.back?'<button class="ibtn" data-act="back" aria-label="Back">'+icon('back')+'</button>':'')+
  '<h1'+(o.ar?' class="ar" style="direction:rtl"':'')+'>'+esc(title)+(sub?'<span class="sub">'+esc(sub)+'</span>':'')+'</h1>'+(o.right||'')+'</header>'}
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g,'');

/* ---------- router ---------- */
const NAVMAP={home:'home',surahs:'surahs',juz:'surahs',read:'surahs',goto:'surahs',mulk:'mulk',bookmarks:'home',more:'more',folders:'folders',learn:'folders',repeat:'folders',puzzle:'folders',revision:'folders',namaz:'folders',path:'folders'};
async function route(){
  cleanups.forEach(f=>{try{f()}catch(e){}});cleanups=[];ZD.closeSheet();
  const h=location.hash.replace(/^#\/?/,'')||'home',parts=h.split('/'),name=parts[0],args=parts.slice(1);
  ZD.$$('.nav a').forEach(a=>{if(a.dataset.nav===NAVMAP[name])a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  const fn=R[name]||R.home;view().replaceChildren();
  try{await fn(args)}catch(e){console.error(e);view().innerHTML=top('Something went wrong')+'<main><div class="empty"><div class="big">⚠️</div><p>This page could not be shown.</p><a class="btn" href="#/home">Go home</a></div></main>'}
  if(!(name==='read'&&args[1]))window.scrollTo(0,0);
}
ZD.route=route;
window.addEventListener('hashchange',route);
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act="back"]');if(b){e.preventDefault();if(history.length>1)history.back();else location.hash='#/surahs'}
  if(e.target.id==='scrim')ZD.closeSheet();
});

/* ---------- HOME ---------- */
function hijri(){try{return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'}).format(new Date()).replace(/ AH$/,' AH')}catch(e){return''}}
R.home=function(){
  const st=ZD.state(),p=ZD.prefs(),last=st.last,done=ZD.todayCount(),goal=p.goal,pct=Math.min(100,Math.round(done/goal*100));
  const date=new Intl.DateTimeFormat('en',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  let resume;
  if(last){const sr=ZD.surah(last.s),prog=Math.round(last.a/sr.count*100);
    resume='<a class="card resume" style="text-decoration:none;color:inherit" href="#/read/'+last.s+'/'+last.a+'"><div class="ring" style="--p:'+prog+'"><b>'+prog+'%</b></div><div style="flex:1;min-width:0"><div class="muted small">Resume reading</div><div style="font-size:19px;font-weight:600">'+esc(sr.en)+'</div><div class="muted small">Ayah '+last.a+' of '+sr.count+' · Juz '+ZD.juzOf(last.s,last.a)+'</div></div><span class="btn sm">Continue</span></a>';
  }else resume='<a class="card resume" style="text-decoration:none;color:inherit" href="#/read/1/1"><div class="ring" style="--p:0"><b>0%</b></div><div style="flex:1"><div class="muted small">Start reading</div><div style="font-size:19px;font-weight:600">Al-Fatihah</div><div class="muted small">The Opening · 7 ayat</div></div><span class="btn sm">Begin</span></a>';
  const mu=st.mulk.status,mem=Object.values(mu).filter(v=>v==='memorised').length,due=ZD.mulkDueList?ZD.mulkDueList().length:0;
  view().innerHTML=top('Zikr Deen',hijri()?date+' · '+hijri():date,{right:'<button class="ibtn" data-act="goto" aria-label="Go to surah and ayah">'+icon('hash')+'</button>'})+
  '<main>'+
  '<div class="hero"><div class="bism" lang="ar">'+BISM+'</div>'+resume.replace('class="card resume"','class="resume"').replace('style="text-decoration:none;color:inherit"','style="text-decoration:none;color:inherit;display:flex"')+'</div>'+
  (ZD.dailyHTML?ZD.dailyHTML():'')+
  '<section class="block card"><div style="display:flex;justify-content:space-between;align-items:baseline"><h2 class="h2" style="margin:0">Daily goal</h2><span class="muted small">'+done+' / '+goal+' ayat today</span></div>'+
  '<div class="bar" style="margin:12px 0 4px" role="progressbar" aria-valuemin="0" aria-valuemax="'+goal+'" aria-valuenow="'+Math.min(done,goal)+'"><i style="width:'+pct+'%"></i></div>'+
  '<div class="stat3"><div><b>'+ZD.streak()+'</b><span>day streak</span></div><div><b>'+ZD.totalRead()+'</b><span>ayat read</span></div><div><b>'+st.bookmarks.length+'</b><span>saved</span></div></div>'+
  '<p class="muted small" style="margin:10px 0 0">Tap ✓ under any ayah when you have read it. The streak counts days with at least one ayah.</p></section>'+
  '<section class="block"><h2 class="h2">Learning folders</h2>'+(ZD.foldersHTML?ZD.foldersHTML():'')+'</section>'+
  '<section class="block"><div class="tiles"><button class="tile" data-act="goto">'+icon('hash')+'<b>Go to ayah</b><span>e.g. 67:15</span></button><a class="tile" href="#/bookmarks">'+icon('mark')+'<b>Saved</b><span>'+st.bookmarks.length+' bookmarks</span></a></div></section>'+
  '<section class="block card" style="background:linear-gradient(150deg,var(--raised),var(--surface))"><div style="display:flex;gap:14px;align-items:center"><div class="ar" style="font-size:44px;color:var(--gold-soft);line-height:1.1">الملك</div><div style="flex:1"><h2 class="h2" style="margin:0">Surah Al-Mulk</h2><div class="muted small">'+mem+' of 30 ayat memorised'+(due?' · '+due+' due for revision':'')+'</div></div></div>'+
  '<div class="bar" style="margin:12px 0"><i style="width:'+Math.round(mem/30*100)+'%"></i></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn sm" href="#/mulk">Open Hifz hub</a><a class="btn sm ghost" href="journey.html">30-day journey</a></div></section>'+
  (deferred?'<section class="block"><button class="btn" data-act="install" style="width:100%">Install Zikr Deen on this phone</button></section>':'')+
  '</main>';
};

/* ---------- SURAH & JUZ INDEX ---------- */
function indexHead(tab){return '<div class="seg" role="tablist"><button role="tab" aria-selected="'+(tab==='surahs')+'" data-go="#/surahs">Surah</button><button role="tab" aria-selected="'+(tab==='juz')+'" data-go="#/juz">Juz</button></div>'}
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)location.hash=g.dataset.go});
R.surahs=async function(){
  const all=ZD.surahs();
  view().innerHTML=top('Quran','114 surahs · 6,236 ayat',{right:'<button class="ibtn" data-act="goto" aria-label="Go to surah and ayah">'+icon('hash')+'</button>'})+
   '<main>'+indexHead('surahs')+'<label class="search">'+icon('search')+'<input id="q" type="search" placeholder="Search by name, number or meaning" autocomplete="off" aria-label="Search surahs"></label><div id="list"></div></main>';
  const list=$('#list');let cached=new Set();
  const draw=f=>{const q=norm(f||'');const rows=all.filter(s=>!q||String(s.n)===q||norm(s.en).includes(q)||norm(s.mean).includes(q)||norm(s.ar).includes(q));
    list.innerHTML=rows.length?rows.map(s=>'<div class="row"><a href="#/read/'+s.n+'/1" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;color:inherit;text-decoration:none"><div class="num"><span>'+s.n+'</span></div><div class="mid"><b>'+esc(s.en)+(cached.has(s.n)?'<i class="dot" title="Saved for offline"></i>':'')+'</b><small>'+esc(s.mean)+' · '+s.count+' ayat<span class="tag">'+s.type+'</span></small></div><div class="arn" lang="ar">'+esc(s.ar)+'</div></a><div class="acts"><button class="ibtn" data-play="'+s.n+'" aria-label="Play '+esc(s.en)+'">'+icon('play')+'</button></div></div>').join(''):'<div class="empty"><div class="big">🔎</div>No surah matches “'+esc(f)+'”.</div>'};
  draw('');$('#q').addEventListener('input',e=>draw(e.target.value));
  list.addEventListener('click',e=>{const b=e.target.closest('[data-play]');if(b){e.preventDefault();ZD.playSurah(Number(b.dataset.play),1);ZD.toast('Playing '+ZD.surah(Number(b.dataset.play)).en)}});
  ZD.cachedSurahs().then(s=>{cached=s;if(location.hash.startsWith('#/surahs'))draw($('#q')&&$('#q').value)});
};
R.juz=function(){
  const J=ZD.juzList();
  view().innerHTML=top('Juz Index','30 paras')+'<main>'+indexHead('juz')+J.map(j=>{const sr=ZD.surah(j.s);return '<a class="row" href="#/read/'+j.s+'/'+j.a+'"><div class="num"><span>'+j.n+'</span></div><div class="mid"><b>'+esc(j.name)+'</b><small>Starts at '+esc(sr.en)+' '+j.s+':'+j.a+'</small></div><div class="arn" lang="ar">'+esc(sr.ar)+'</div></a>'}).join('')+'</main>';
};

/* ---------- GO TO ---------- */
function gotoSheet(){
  const opts=ZD.surahs().map(s=>'<option value="'+s.n+'">'+s.n+'. '+esc(s.en)+'</option>').join('');
  ZD.openSheet('<h3>Go to ayah</h3><div class="field"><label for="gS">Surah</label><select id="gS" style="max-width:62%">'+opts+'</select></div><div class="field"><label for="gA">Ayah <span class="muted small" id="gMax"></span></label><input id="gA" type="number" min="1" value="1" inputmode="numeric" style="width:96px"></div><div style="display:flex;gap:8px;margin-top:14px"><button class="btn" id="gGo">Open</button><button class="btn ghost" id="gX">Cancel</button></div>',sh=>{
    const sel=$('#gS',sh),ay=$('#gA',sh),mx=$('#gMax',sh),upd=()=>{const n=ZD.surah(Number(sel.value)).count;ay.max=n;mx.textContent='(1–'+n+')';if(Number(ay.value)>n)ay.value=n};
    sel.addEventListener('change',upd);upd();
    $('#gGo',sh).addEventListener('click',()=>{const s=Number(sel.value),a=Math.max(1,Math.min(ZD.surah(s).count,Math.round(Number(ay.value))||1));ZD.closeSheet();location.hash='#/read/'+s+'/'+a});
    $('#gX',sh).addEventListener('click',ZD.closeSheet);
  });
}
document.addEventListener('click',e=>{if(e.target.closest('[data-act="goto"]'))gotoSheet()});

/* ---------- READER ---------- */
const LANGS=[['en','English','en',false],['hi','हिन्दी','hi',false],['ur','اردو','ur',true],['roman','Roman (Al-Mulk)','en',false],['hinglish','Hinglish (Al-Mulk)','en',false]];
function ayahHTML(d,s,x,langs){
  const a=x.a;let h='<article class="ayah" id="ay-'+a+'" data-a="'+a+'"><div class="ayah-head"><span class="ref">'+a+'</span></div><div class="ar-text" lang="ar">'+esc(x.ar)+'</div>';
  for(const [k,label,lang,rtl] of LANGS){if(!langs[k]||!x[k])continue;h+='<div class="tr'+(rtl?' urdu':'')+'" lang="'+lang+'"><small>'+label+'</small>'+esc(x[k])+'</div>'}
  h+='<div class="ayah-acts">'+
   '<button class="ibtn" data-ay="play" aria-label="Play from ayah '+a+'">'+icon('play')+'</button>'+
   '<button class="ibtn'+(ZD.isBookmarked(s,a)?' on':'')+'" data-ay="mark" aria-label="Bookmark ayah '+a+'" aria-pressed="'+ZD.isBookmarked(s,a)+'">'+icon('mark')+'</button>'+
   '<button class="ibtn'+(ZD.isRead(s,a)?' on':'')+'" data-ay="read" aria-label="Mark ayah '+a+' as read today" aria-pressed="'+ZD.isRead(s,a)+'">'+icon('check')+'</button>'+
   '<button class="ibtn" data-ay="copy" aria-label="Copy ayah '+a+'">'+icon('copy')+'</button>'+
   '<button class="ibtn" data-ay="share" aria-label="Share ayah '+a+' as image">'+icon('share')+'</button></div></article>';
  return h}
R.read=async function(args){
  const s=Number(args[0]),a=Number(args[1]||1);
  if(!ZD.surah(s)){location.replace('#/surahs');return}
  const sr=ZD.surah(s),startA=Math.max(1,Math.min(sr.count,a||1));
  view().innerHTML=top(sr.en,sr.mean+' · '+sr.count+' ayat · '+sr.type,{back:true,right:'<button class="ibtn" data-act="playall" aria-label="Play surah">'+icon('play')+'</button><button class="ibtn" data-act="rset" aria-label="Reading and audio options">'+icon('gear')+'</button>'})+
   '<main><div id="rbody"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div></main>';
  let d;
  try{d=await ZD.loadSurah(s)}catch(e){
    $('#rbody').innerHTML='<div class="empty"><div class="big">📡</div><p><b>Could not load '+esc(sr.en)+'.</b></p><p class="small">The text is fetched once and then saved on this phone. Connect to the internet and try again.</p><button class="btn" id="retry">Try again</button></div>';
    $('#retry').addEventListener('click',()=>route());return}
  if(location.hash.indexOf('#/read/'+s)!==0)return;
  const body=$('#rbody');
  const draw=()=>{const langs=ZD.prefs().langs;let h='';
    if(s!==1&&s!==9)h+='<div class="bism-head" lang="ar">'+BISM+'</div>';
    h+=d.ayahs.map(x=>ayahHTML(d,s,x,langs)).join('');
    const src=d.src||{};h+='<p class="src-note">'+(d.embedded?'Showing the built-in Al-Mulk text (offline copy). Connect once to load the full edition. ':'')+'Arabic: '+esc(src.ar||'')+(src.en?' · English: '+esc(src.en):'')+(src.hi?' · Hindi: '+esc(src.hi):'')+(src.ur?' · Urdu: '+esc(src.ur):'')+'. Translations are reading aids — please compare with a trusted Mushaf and learn recitation from a qualified teacher.</p>';
    body.innerHTML=h;bind()};
  let curKey='';
  const refreshPlaying=()=>{const it=P.cur(),on=it&&it.s===s,key=on?it.a+':'+P.playing:'';if(key===curKey)return;const prev=curKey.split(':')[0];curKey=key;
    ZD.$$('.ayah.playing').forEach(e=>e.classList.remove('playing'));ZD.$$('[data-ay="play"]').forEach(b=>{b.innerHTML=icon('play')});
    if(on){const el=$('#ay-'+it.a);if(el){el.classList.add('playing');const b=el.querySelector('[data-ay="play"]');if(b&&P.playing)b.innerHTML=icon('pause');if(String(it.a)!==prev&&P.playing){const r=el.getBoundingClientRect();if(r.top<90||r.bottom>innerHeight-170)el.scrollIntoView({block:'center',behavior:'smooth'})}}}};
  function bind(){
    body.onclick=async e=>{const b=e.target.closest('[data-ay]');if(!b)return;const art=b.closest('.ayah'),a=Number(art.dataset.a),k=b.dataset.ay;
      if(k==='play'){const it=P.cur();if(it&&it.s===s&&it.a===a)P.toggle();else{ZD.playAyah(s,a);ZD.setLast(s,a)}}
      else if(k==='mark'){const on=ZD.toggleBookmark(s,a);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);ZD.toast(on?'Bookmarked '+sr.en+' '+s+':'+a:'Bookmark removed')}
      else if(k==='read'){const on=ZD.toggleRead(s,a);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);if(on){ZD.setLast(s,a);const c=ZD.todayCount(),g=ZD.prefs().goal;ZD.toast(c===g?'Daily goal reached — mashaAllah!':c+' / '+g+' ayat today')}}
      else if(k==='copy')ZD.copy(ZD.ayahPlain(d,a)+'\n— '+sr.en+' '+s+':'+a);
      else if(k==='share'){b.disabled=true;try{await ZD.shareImage(s,a)}catch(err){ZD.toast('Could not create the image')}b.disabled=false}};
    curKey='~';refreshPlaying();
  }
  draw();
  const unsub=ZD.onPlayer(refreshPlaying);ZD.onLeave(unsub);
  if(args[1]){ZD.setLast(s,startA);const el=$('#ay-'+startA);if(el)requestAnimationFrame(()=>el.scrollIntoView({block:'start'}))}
  let tmr=0;const onScroll=()=>{clearTimeout(tmr);tmr=setTimeout(()=>{const els=ZD.$$('.ayah');for(const el of els){if(el.getBoundingClientRect().top>=70){const a=Number(el.dataset.a);const l=ZD.state().last;if(!l||l.s!==s||Math.abs(l.a-a)>0)ZD.setLast(s,a);break}}},500)};
  window.addEventListener('scroll',onScroll,{passive:true});ZD.onLeave(()=>{window.removeEventListener('scroll',onScroll);clearTimeout(tmr)});
  $('[data-act="playall"]').onclick=()=>{const it=P.cur();if(it&&it.s===s)P.toggle();else ZD.playSurah(s,1)};
  $('[data-act="rset"]').onclick=()=>readerSheet(s,d,draw);
};

function toggleRow(label,id,on){return '<div class="field"><label>'+label+'</label><button class="switch" data-lang="'+id+'" role="switch" aria-checked="'+on+'" aria-label="'+label+'"></button></div>'}
function readerSheet(s,d,redraw){
  const p=ZD.prefs(),L=p.langs,sr=ZD.surah(s);
  ZD.openSheet('<h3>Reading options</h3>'+toggleRow('English translation','en',L.en)+toggleRow('हिन्दी अनुवाद','hi',L.hi)+toggleRow('اردو ترجمہ','ur',L.ur)+
   (s===67?toggleRow('Roman transliteration','roman',L.roman)+toggleRow('Hinglish meaning','hinglish',L.hinglish):'')+
   '<div class="field"><label for="rsAr">Arabic size</label><input type="range" id="rsAr" min="24" max="56" value="'+p.arSize+'"></div>'+
   '<div class="field"><label for="rsTr">Translation size</label><input type="range" id="rsTr" min="13" max="26" value="'+p.trSize+'"></div>'+
   '<div class="field"><label for="rsTh">Theme</label><select id="rsTh"><option value="night">Night (emerald)</option><option value="day">Day (parchment)</option><option value="oled">Pure black</option></select></div>'+
   '<h3 style="margin-top:14px">Audio for '+esc(sr.en)+'</h3><p class="muted small" id="dlInfo">Checking saved audio…</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="dlGo">'+icon('down')+' Save audio offline</button><button class="btn sm ghost" id="dlDel">'+icon('trash')+' Remove</button><button class="btn sm ghost" id="pbOpen">'+icon('repeat')+' Playback options</button></div><div class="bar" style="margin-top:10px" hidden id="dlBar"><i style="width:0"></i></div>',sh=>{
    $('#rsTh',sh).value=p.theme;
    sh.addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(!b)return;const on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',on);L[b.dataset.lang]=on;ZD.save();redraw()});
    $('#rsAr',sh).addEventListener('input',e=>{p.arSize=Number(e.target.value);ZD.applyPrefs();ZD.save()});
    $('#rsTr',sh).addEventListener('input',e=>{p.trSize=Number(e.target.value);ZD.applyPrefs();ZD.save()});
    $('#rsTh',sh).addEventListener('change',e=>{p.theme=e.target.value;ZD.applyPrefs();ZD.save()});
    $('#pbOpen',sh).addEventListener('click',()=>{ZD.closeSheet();setTimeout(ZD.playbackSheet,260)});
    const info=$('#dlInfo',sh),bar=$('#dlBar',sh),go=$('#dlGo',sh);let stop=false;
    const refresh=async()=>{const c=await ZD.offlineCount(p.reciter,s),rn=ZD.RECITERS.find(r=>r[0]===p.reciter)[1];info.textContent=c+' / '+sr.count+' ayat saved for '+rn+'.'};refresh();
    go.addEventListener('click',async()=>{go.disabled=true;bar.hidden=false;stop=false;const r=await ZD.downloadSurahAudio(p.reciter,s,1,sr.count,(done,total,fail)=>{bar.firstChild.style.width=(done/total*100)+'%';info.textContent='Saving… '+done+' / '+total+(fail?' ('+fail+' failed)':'')},()=>stop);
      bar.hidden=true;go.disabled=false;await refresh();ZD.toast(r.fail?'Saved '+r.ok+', failed '+r.fail+'. Check your connection and retry.':'Audio saved for offline listening')});
    $('#dlDel',sh).addEventListener('click',async()=>{stop=true;await ZD.deleteSurahAudio(p.reciter,s);await refresh();ZD.toast('Saved audio removed')});
    ZD.onLeave(()=>{stop=true});
  });
}

/* ---------- SHARE AS IMAGE ---------- */
function wrap(g,text,maxW){const words=text.split(/\s+/),lines=[];let line='';for(const w of words){const t=line?line+' '+w:w;if(g.measureText(t).width>maxW&&line){lines.push(line);line=w}else line=t}if(line)lines.push(line);return lines}
ZD.shareImage=async function(s,a){
  const d=await ZD.loadSurah(s),x=d.ayahs[a-1],sr=ZD.surah(s);
  try{await document.fonts.load('48px Amiri','ب')}catch(e){}
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#010f45');gr.addColorStop(1,'#0d3a8a');g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.strokeStyle='#d7b25e';g.lineWidth=3;g.strokeRect(36,36,W-72,H-72);g.lineWidth=1;g.strokeRect(54,54,W-108,H-108);
  g.textAlign='center';g.fillStyle='#d7b25e';g.font='46px Amiri, serif';g.direction='rtl';g.fillText(BISM,W/2,150);
  const maxW=W-200,region=640;let size=66,lines;
  for(const z of [66,58,50,44,38,33,29,26]){size=z;g.font=z+'px Amiri, serif';g.direction='rtl';lines=wrap(g,x.ar,maxW);if(lines.length*z*1.85<=region)break}
  const lh=size*1.85,blockH=lines.length*lh,y0=240+(region-blockH)/2+size;
  g.fillStyle='#f3ecd9';lines.forEach((l,i)=>g.fillText(l,W/2,y0+i*lh));
  const tr=x.en||x.hinglish||'';if(tr){g.direction='ltr';g.font='34px system-ui, sans-serif';g.fillStyle='#cfe0d6';let tl=wrap(g,tr,W-220);if(tl.length>6){tl=tl.slice(0,6);tl[5]=tl[5].replace(/\s*\S*$/,'')+'…'}tl.forEach((l,i)=>g.fillText(l,W/2,960+i*48))}
  g.direction='ltr';g.fillStyle='#d7b25e';g.font='bold 36px system-ui, sans-serif';g.fillText('Surah '+sr.en+' · '+s+':'+a,W/2,1240);g.fillStyle='#9db8aa';g.font='28px system-ui, sans-serif';g.fillText('Zikr Deen',W/2,1288);
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob)throw new Error('no blob');
  const file=new File([blob],'zikr-deen-'+s+'-'+a+'.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Zikr Deen'});return}catch(e){if(e&&e.name==='AbortError')return}}
  ZD.download(file.name,blob);ZD.toast('Image saved');
};

/* ---------- BOOKMARKS ---------- */
R.bookmarks=function(){
  const b=ZD.state().bookmarks;
  view().innerHTML=top('Bookmarks',b.length+' saved')+'<main id="bmRoot">'+(b.length?b.map(x=>{const sr=ZD.surah(x.s),dt=new Date(x.t).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'});
    return '<div class="row"><a href="#/read/'+x.s+'/'+x.a+'" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;color:inherit;text-decoration:none"><div class="num"><span>'+x.a+'</span></div><div class="mid"><b>'+esc(sr.en)+' '+x.s+':'+x.a+'</b><small>Juz '+ZD.juzOf(x.s,x.a)+' · saved '+dt+'</small></div><div class="arn" lang="ar">'+esc(sr.ar)+'</div></a><div class="acts"><button class="ibtn" data-bp="'+x.s+':'+x.a+'" aria-label="Play">'+icon('play')+'</button><button class="ibtn" data-bd="'+x.s+':'+x.a+'" aria-label="Remove bookmark">'+icon('trash')+'</button></div></div>'}).join(''):
    '<div class="empty"><div class="big">🔖</div><p>No bookmarks yet.</p><p class="small">Tap the bookmark icon under any ayah to save your place.</p><a class="btn" href="#/surahs">Open the Quran</a></div>')+'</main>';
  $('#bmRoot').onclick=e=>{const p=e.target.closest('[data-bp]'),d=e.target.closest('[data-bd]');
    if(p){const [s,a]=p.dataset.bp.split(':').map(Number);ZD.playAyah(s,a)}
    if(d){const [s,a]=d.dataset.bd.split(':').map(Number);ZD.toggleBookmark(s,a);R.bookmarks();ZD.toast('Bookmark removed')}};
};

/* ---------- MORE / SETTINGS ---------- */
let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;if(location.hash===''||location.hash==='#/home'||location.hash==='#/more')route()});
window.addEventListener('appinstalled',()=>{deferred=null;ZD.toast('Zikr Deen installed')});
document.addEventListener('click',async e=>{if(e.target.closest('[data-act="install"]')){if(deferred){deferred.prompt();try{await deferred.userChoice}catch(_){}deferred=null;route()}else ZD.toast(/iphone|ipad/i.test(navigator.userAgent)?'On iPhone: tap Share → Add to Home Screen':'Use your browser menu → Install app')}});
const fmtMB=b=>b>1e9?(b/1e9).toFixed(1)+' GB':(b/1e6).toFixed(b>1e8?0:1)+' MB';
R.more=async function(){
  const p=ZD.prefs(),L=p.langs;
  const rec=ZD.RECITERS.map(r=>'<option value="'+r[0]+'"'+(r[0]===p.reciter?' selected':'')+'>'+esc(r[1])+'</option>').join('');
  view().innerHTML=top('More','Settings, offline library & backup')+'<main id="moreRoot">'+
  '<section class="block card"><h2 class="h2">Appearance</h2>'+
   '<div class="field"><label for="sTh">Theme</label><select id="sTh"><option value="night">Night (emerald)</option><option value="day">Day (parchment)</option><option value="oled">Pure black</option></select></div>'+
   '<div class="field"><label for="sIntro">Opening intro</label><select id="sIntro"><option value="always">Every time I open the app</option><option value="daily">Once a day</option><option value="never">Never</option></select></div>'+
   '<div class="field"><label for="sSnd">Intro sound</label><select id="sSnd"><option value="azan">Azan (intro)</option><option value="reciteonly">Al-Mulk recitation only</option><option value="off">Off</option></select></div>'+
   '<div class="field"><label>Try the intro sound</label><button class="btn sm" id="sndTry">'+icon('play')+' Preview</button></div>'+
   '<div class="field"><label for="sAr">Arabic size</label><input type="range" id="sAr" min="24" max="56" value="'+p.arSize+'"></div>'+
   '<div class="field"><label for="sTr">Translation size</label><input type="range" id="sTr" min="13" max="26" value="'+p.trSize+'"></div>'+
   '<div class="ayah" style="border:0"><div class="ar-text" lang="ar" id="sPrev">'+BISM+'</div></div></section>'+
  '<section class="block card"><h2 class="h2">Reading & listening</h2>'+toggleRow('English translation','en',L.en)+toggleRow('हिन्दी अनुवाद','hi',L.hi)+toggleRow('اردو ترجمہ','ur',L.ur)+
   '<div class="field"><label for="sGoal">Daily goal (ayat)</label><input id="sGoal" type="number" min="1" max="100" value="'+p.goal+'" style="width:84px"></div>'+
   '<div class="field"><label for="sRec">Default reciter</label><select id="sRec" style="max-width:60%">'+rec+'</select></div>'+
   '<div class="field"><label>Keep screen on while listening</label><button class="switch" id="sWake" role="switch" aria-checked="'+p.wake+'" aria-label="Keep screen on while listening"></button></div></section>'+
  '<section class="block card"><h2 class="h2">Offline library</h2><p class="muted small" id="offInfo">Checking…</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="offAll">'+icon('down')+' Save all 114 surahs (text)</button><button class="btn sm ghost" id="offClr">Clear saved text</button></div><div class="bar" style="margin-top:10px" hidden id="offBar"><i style="width:0"></i></div><div id="audList" style="margin-top:12px"></div><p class="muted small" id="offStor"></p></section>'+
  (deferred?'<section class="block"><button class="btn" data-act="install" style="width:100%">Install Zikr Deen on this phone</button></section>':'')+
  '<section class="block card"><h2 class="h2">Backup</h2><p class="muted small">Your bookmarks, goal history and Al-Mulk progress live only on this device. Export a backup before clearing browser data or changing phones.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="bkOut">Export backup</button><button class="btn sm ghost" id="bkIn">Import backup</button><button class="btn sm ghost" id="bkReset">Reset progress</button></div><input type="file" id="bkFile" accept="application/json,.json" hidden></section>'+
  '<section class="block card"><h2 class="h2">About</h2><p class="small">Zikr Deen is a Quran reading, listening and Hifz companion. Surah Al-Mulk has a dedicated memorisation hub. <a href="journey.html">Open the original 30-day Al-Mulk journey</a>.</p><p class="muted small">Quran text and translations are loaded from the open alquran.cloud service and then saved on this phone; audio streams from everyayah.com. Translations are study aids, not a substitute for tafsir or a teacher. Please compare the Arabic with a trusted printed Hafs Mushaf. Amiri font: SIL Open Font License.</p><p class="small"><a href="https://www.instagram.com/zikr.deen_/" target="_blank" rel="noopener noreferrer">Follow @zikr.deen_ on Instagram</a></p></section></main>';
  const root=$('#moreRoot');$('#sTh').value=p.theme;$('#sIntro').value=p.intro;$('#sSnd').value=p.introSound;$('#sndTry').addEventListener('click',()=>{if(ZD.sound&&ZD.sound.supported)ZD.sound.preview($('#sSnd').value);else ZD.toast('Sound is not available here')});
  const prevAr=()=>{$('#sPrev').style.fontSize=p.arSize+'px'};
  root.addEventListener('input',e=>{if(e.target.id==='sAr'){p.arSize=Number(e.target.value);ZD.applyPrefs();ZD.save()}else if(e.target.id==='sTr'){p.trSize=Number(e.target.value);ZD.applyPrefs();ZD.save()}else if(e.target.id==='sGoal'){p.goal=Math.min(100,Math.max(1,Math.round(Number(e.target.value))||3));ZD.save()}});
  root.addEventListener('change',e=>{if(e.target.id==='sTh'){p.theme=e.target.value;ZD.applyPrefs();ZD.save()}else if(e.target.id==='sRec'){p.reciter=e.target.value;ZD.save();audioList()}else if(e.target.id==='sSnd'){p.introSound=e.target.value;ZD.save()}else if(e.target.id==='sIntro'){p.intro=e.target.value;ZD.save();ZD.toast('Intro: '+e.target.selectedOptions[0].text)}});
  root.addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b){const on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',on);L[b.dataset.lang]=on;ZD.save()}});
  $('#sWake').addEventListener('click',e=>{const b=e.currentTarget,on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',on);p.wake=on;ZD.save()});
  const offInfo=$('#offInfo'),bar=$('#offBar'),all=$('#offAll');let stop=false;ZD.onLeave(()=>{stop=true});
  const refreshText=async()=>{const c=await ZD.cachedSurahs();offInfo.textContent=c.size+' of 114 surahs saved for offline reading. Al-Mulk always works offline.'};
  const audioList=async()=>{const sum=await ZD.offlineSummary(),el=$('#audList');const ent=Object.entries(sum);
    el.innerHTML=ent.length?'<div class="muted small" style="margin-bottom:4px">Saved audio</div>'+ent.map(([k,c])=>{const [r,s]=k.split('|'),sr=ZD.surah(Number(s)),rn=(ZD.RECITERS.find(x=>x[0]===r)||[r,r])[1];return '<div class="row" style="padding:8px 2px"><div class="mid"><b>'+esc(sr.en)+'</b><small>'+esc(rn)+' · '+c+' / '+sr.count+' ayat</small></div><button class="ibtn" data-delaud="'+esc(k)+'" aria-label="Remove">'+icon('trash')+'</button></div>'}).join(''):'<p class="muted small">No audio saved yet. Open any surah → ⚙ → “Save audio offline”.</p>'};
  $('#audList').addEventListener('click',async e=>{const d=e.target.closest('[data-delaud]');if(!d)return;const [r,s]=d.dataset.delaud.split('|');await ZD.deleteSurahAudio(r,Number(s));audioList();storage()});
  const storage=async()=>{try{const e=await navigator.storage.estimate();$('#offStor').textContent='Storage used by Zikr Deen: '+fmtMB(e.usage||0)+(e.quota?' of '+fmtMB(e.quota)+' available.':'.')}catch(_){}};
  refreshText();audioList();storage();
  all.addEventListener('click',async()=>{all.disabled=true;bar.hidden=false;stop=false;const fail=await ZD.downloadAllText((d,t,f)=>{bar.firstChild.style.width=(d/t*100)+'%';offInfo.textContent='Saving surah text… '+d+' / '+t+(f?' ('+f+' failed)':'')},()=>stop);
    bar.hidden=true;all.disabled=false;await refreshText();storage();ZD.toast(fail.length?fail.length+' surahs failed — check your connection and retry.':'All surahs saved for offline reading')});
  $('#offClr').addEventListener('click',async()=>{await ZD.clearTextCache();await refreshText();storage();ZD.toast('Saved text cleared')});
  $('#bkOut').addEventListener('click',()=>{const o=Object.assign({app:'Zikr Deen App',exportedAt:new Date().toISOString()},JSON.parse(JSON.stringify(ZD.state())));ZD.download('zikr-deen-backup-'+ZD.today()+'.json',new Blob([JSON.stringify(o,null,1)],{type:'application/json'}))});
  $('#bkIn').addEventListener('click',()=>$('#bkFile').click());
  $('#bkFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>3e6)throw new Error('big');const j=JSON.parse(await f.text());if(!j||j.app!=='Zikr Deen App')throw new Error('wrong');if(!confirm('Replace the progress on this device with this backup?'))return;ZD.replaceState(j);ZD.toast('Backup restored');route()}catch(err){ZD.toast('That file is not a valid Zikr Deen backup')}e.target.value=''});
  $('#bkReset').addEventListener('click',()=>{if(confirm('Reset bookmarks, reading log and Al-Mulk progress on this device? Export a backup first if unsure.')){const keep=ZD.state().prefs;const fresh=ZD.sanitize({prefs:keep});ZD.replaceState(fresh);ZD.toast('Progress reset');route()}});
};
})();
