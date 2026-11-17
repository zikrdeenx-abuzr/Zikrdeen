/* Zikr Deen App — learning folders: hub, ayah-by-ayah, repeat, puzzles, revision series, namaz, learning path. */
(function(){'use strict';
const ZD=window.ZD,$=ZD.$,esc=ZD.esc,icon=ZD.icon,P=ZD.player,R=ZD.R;
const view=()=>$('#view');
const INT=[1,3,7,15,30,60,90];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.floor(Math.random()*a.length)];
function top(title,sub,o){o=o||{};return '<header class="topbar">'+(o.back?'<button class="ibtn" data-act="back" aria-label="Back">'+icon('back')+'</button>':'')+'<h1>'+esc(title)+(sub?'<span class="sub">'+esc(sub)+'</span>':'')+'</h1>'+(o.right||'')+'</header>'}
const surahOpts=sel=>ZD.surahs().map(s=>'<option value="'+s.n+'"'+(s.n===sel?' selected':'')+'>'+s.n+'. '+esc(s.en)+' ('+s.count+')</option>').join('');
const numSel=(id,vals,cur,fmt)=>'<select id="'+id+'" class="sl">'+vals.map(v=>'<option value="'+v+'"'+(v===cur?' selected':'')+'>'+fmt(v)+'</option>').join('')+'</select>';
const seg=(id,items,cur)=>'<div class="seg" id="'+id+'" role="tablist">'+items.map(([k,l])=>'<button role="tab" aria-selected="'+(k===cur)+'" data-k="'+k+'">'+l+'</button>').join('')+'</div>';
async function loadOrFail(s,box){try{return await ZD.loadSurah(s)}catch(e){box.innerHTML='<div class="empty"><div class="big">📡</div><p><b>Could not load '+esc(ZD.surah(s).en)+'.</b></p><p class="small">Connect to the internet once; the text is then saved on this phone.</p><button class="btn" id="retry">Try again</button></div>';$('#retry').addEventListener('click',()=>ZD.route());return null}}
const revDue=()=>{const t=ZD.today();return ZD.state().rev.filter(r=>r.due<=t)};
const mulkDue=()=>ZD.mulkDueList?ZD.mulkDueList().length:0;
const inRevision=s=>ZD.state().rev.some(r=>r.s===s);
function addRevision(s,a1,a2){const st=ZD.state();if(st.rev.some(r=>r.s===s&&r.a1===a1&&r.a2===a2))return false;if(st.rev.length>=300){ZD.toast('Revision list is full (300 items)');return false}
  st.rev.push({s,a1,a2,stage:0,due:ZD.addDays(ZD.today(),1),added:ZD.today()});ZD.save();return true}

/* ================= FOLDERS HUB ================= */
ZD.foldersHTML=function(){
  const due=revDue().length+mulkDue();
  const F=[['#/juz','book','Quran','Juz index, resume reading, the full Mushaf'],['#/surahs','hash','Surahs','All 114 surahs — read or play'],
    ['#/learn','ayah','Ayah by Ayah','Learn one ayah at a time, step by step'],['#/namaz','pray','Namaz','How to pray, rakats and what to recite'],
    ['#/repeat','repeat','Repeat','Loop any ayahs with pauses to recite'],['#/puzzle','puzzle','Puzzles','Order the words, find the missing word'],
    ['#/revision','timer','Revision','Spaced revision series'+(due?' · '+due+' due':''),due],['#/path','steps','Start here','A simple path for beginners']];
  return '<div class="folders">'+F.map(f=>'<a class="folder" href="'+f[0]+'">'+(f[4]?'<i class="badge">'+f[4]+'</i>':'')+icon(f[1])+'<b>'+f[2]+'</b><span>'+f[3]+'</span></a>').join('')+
   '<a class="folder wide" href="#/mulk">'+icon('moon')+'<div><b>Surah Al-Mulk</b><span>Hifz hub · lab · revision · listening</span></div></a></div>'};
R.folders=function(){view().innerHTML=top('Learn','Everything in one place')+'<main>'+ZD.foldersHTML()+
  '<p class="muted small" style="margin:16px 2px">Not sure where to begin? Open <a href="#/path">Start here</a> — it takes you from the first short surahs to Al-Mulk, one small step at a time.</p></main>'};

/* ================= AYAH BY AYAH ================= */
const LS={rep:3,gap:4,level:0,meaning:false};
const BEGIN=[1,112,113,114,108,103,110,109,105,106,107,67];
R.learn=async function(args){
  const s=Number(args[0]);
  if(!ZD.surah(s)){
    view().innerHTML=top('Ayah by Ayah','Pick a surah to learn')+'<main><label class="search">'+icon('search')+'<input id="q" type="search" placeholder="Search surah" autocomplete="off" aria-label="Search surah"></label><div id="lst"></div></main>';
    const all=ZD.surahs(),draw=f=>{const q=String(f||'').toLowerCase().replace(/[^a-z0-9]/g,'');const rows=q?all.filter(x=>String(x.n)===q||x.en.toLowerCase().replace(/[^a-z0-9]/g,'').includes(q)||x.mean.toLowerCase().replace(/[^a-z0-9]/g,'').includes(q)):BEGIN.map(n=>all[n-1]);
      $('#lst').innerHTML=(q?'':'<div class="lvl" style="margin-top:4px">Good places to start</div>')+rows.map(x=>'<a class="row" href="#/learn/'+x.n+'/1"><div class="num"><span>'+x.n+'</span></div><div class="mid"><b>'+esc(x.en)+'</b><small>'+esc(x.mean)+' · '+x.count+' ayat</small></div><div class="arn" lang="ar">'+esc(x.ar)+'</div></a>').join('')};
    draw('');$('#q').addEventListener('input',e=>draw(e.target.value));return}
  const sr=ZD.surah(s);let a=clamp(Number(args[1])||1,1,sr.count);
  view().innerHTML=top(sr.en,'Ayah by Ayah',{back:true})+'<main id="lbody"><div class="skeleton"></div></main>';
  const box=$('#lbody'),d=await loadOrFail(s,box);if(!d)return;
  const draw=()=>{
    const x=d.ayahs[a-1],words=ZD.words(x.ar),langs=ZD.prefs().langs,hs=ZD.hiddenSet(a*7+s,words.length,LS.level);
    try{history.replaceState(null,'','#/learn/'+s+'/'+a)}catch(e){}
    ZD.setLast(s,a);
    box.innerHTML='<div class="card"><div class="progress-line"><div class="bar"><i style="width:'+Math.round((a-1)/sr.count*100)+'%"></i></div><span class="muted small">Ayah '+a+' / '+sr.count+'</span></div>'+
     '<div class="lab-ayah" lang="ar" id="lText">'+words.map((w,i)=>'<span class="w'+(hs.has(i)?' hid':'')+'">'+esc(w)+'</span>').join(' ')+'</div>'+
     '<div class="tr" id="lMean" lang="en" '+(LS.meaning?'':'hidden')+'>'+(x.en&&langs.en?'<small>English</small>'+esc(x.en):'')+(x.hi&&langs.hi?'<small style="margin-top:6px">हिन्दी</small>'+esc(x.hi):'')+(!(x.en&&langs.en)&&!(x.hi&&langs.hi)&&x.en?esc(x.en):'')+'</div>'+
     '<button class="btn sm ghost" id="lMeanBtn">'+(LS.meaning?'Hide meaning':'Show meaning')+'</button></div>'+
    '<section class="block card"><h2 class="h2">Step 1 · Listen</h2><div class="field"><label for="lRep">Repeat</label>'+numSel('lRep',[1,3,5,10],LS.rep,v=>v+'×')+'</div><div class="field"><label for="lGap">Pause to say it yourself</label>'+numSel('lGap',[0,3,4,6,10],LS.gap,v=>v?v+' s':'none')+'</div><button class="btn" id="lPlay" style="width:100%;margin-top:10px">'+icon('play')+' Listen to this ayah</button></section>'+
    '<section class="block card"><h2 class="h2">Step 2 · Hide & recite</h2>'+seg('lLvl',[[0,'Show'],[50,'Half'],[100,'Hide']],LS.level)+'<p class="muted small" style="margin:0">Recite from memory. Tap a hidden word to peek.</p></section>'+
    '<div style="display:flex;gap:8px;margin:12px 0"><button class="btn ghost" id="lPrev" '+(a===1?'disabled':'')+' aria-label="Previous ayah">'+icon('prev')+'</button><button class="btn" id="lNext" style="flex:1">'+(a<sr.count?'I know it — next ayah':'I know it — finish')+'</button></div>';
    $('#lText').addEventListener('click',e=>{const w=e.target.closest('.w.hid');if(w)w.classList.remove('hid')});
    $('#lMeanBtn').addEventListener('click',()=>{LS.meaning=!LS.meaning;draw()});
    $('#lRep').addEventListener('change',e=>{LS.rep=Number(e.target.value)});$('#lGap').addEventListener('change',e=>{LS.gap=Number(e.target.value)});
    $('#lPlay').addEventListener('click',()=>ZD.playRange(s,a,a,{repeat:LS.rep,gap:LS.gap,autoNext:false,nextSurah:false}));
    $('#lLvl').addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(b){LS.level=Number(b.dataset.k);draw()}});
    $('#lPrev').addEventListener('click',()=>{P.stop();a=Math.max(1,a-1);draw();window.scrollTo(0,0)});
    $('#lNext').addEventListener('click',()=>{P.stop();if(a<sr.count){a++;draw();window.scrollTo(0,0)}else done()});
  };
  const done=()=>{
    box.innerHTML='<div class="card" style="text-align:center"><div style="font-size:44px">🌟</div><h2 class="h2" style="margin:6px 0">'+esc(sr.en)+' — done!</h2><p class="muted">You went through all '+sr.count+' ayat. Now lock it in with revision.</p>'+
     '<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px"><button class="btn" id="dRev">Add to Revision series</button><a class="btn ghost" href="#/puzzle/'+s+'">Solve puzzles</a><a class="btn ghost" href="#/path">Back to Start here</a></div></div>';
    $('#dRev').addEventListener('click',e=>{const ok=addRevision(s,1,sr.count);e.target.disabled=true;e.target.textContent=ok?'Added — first revision tomorrow':'Already in your revision list'});
  };
  draw();
};

/* ================= REPEAT ================= */
const RP={s:1,from:1,to:3,rep:3,gap:5,loop:1,speed:1};
R.repeat=function(args){
  if(ZD.surah(Number(args[0]))){RP.s=Number(args[0]);RP.from=Number(args[1])||1;RP.to=Number(args[2])||ZD.surah(RP.s).count}
  const draw=()=>{const sr=ZD.surah(RP.s);RP.from=clamp(RP.from,1,sr.count);RP.to=clamp(RP.to,RP.from,sr.count);
    view().innerHTML=top('Repeat','Loop ayahs to memorise them')+'<main id="rpRoot">'+
    '<section class="card"><div class="field"><label for="rS">Surah</label><select id="rS" class="sl" style="max-width:62%">'+surahOpts(RP.s)+'</select></div>'+
    '<div class="field"><label for="rF">From ayah</label><input id="rF" type="number" min="1" max="'+sr.count+'" value="'+RP.from+'" inputmode="numeric" style="width:92px"></div>'+
    '<div class="field"><label for="rT">To ayah</label><input id="rT" type="number" min="1" max="'+sr.count+'" value="'+RP.to+'" inputmode="numeric" style="width:92px"></div>'+
    '<div class="field"><label for="rR">Repeat each ayah</label>'+numSel('rR',[1,3,5,7,10,20],RP.rep,v=>v+'×')+'</div>'+
    '<div class="field"><label for="rG">Pause after each</label>'+numSel('rG',[0,3,5,8,12],RP.gap,v=>v?v+' s':'none')+'</div>'+
    '<div class="field"><label for="rL">Loop the whole range</label>'+numSel('rL',[1,2,3,5,10],RP.loop,v=>v===1?'once':v+' times')+'</div>'+
    '<div class="field"><label for="rSp">Speed</label>'+numSel('rSp',[0.75,0.9,1,1.15,1.3],RP.speed,v=>v+'×')+'</div>'+
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn" id="rGo" style="flex:1">'+icon('play')+' Start</button><button class="btn ghost" id="rStop">Stop</button></div><p class="muted small" id="rStat" style="margin:10px 0 0">Ready.</p></section>'+
    '<section class="block"><h2 class="h2">Quick presets</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill" data-pre="mem">Memorise · 3× + 5 s</button><button class="pill" data-pre="rev">Revise · 1× ×3 loops</button><button class="pill" data-pre="night">Night · loop ×5</button></div></section></main>';
    const g=id=>$(id);
    g('#rS').addEventListener('change',e=>{RP.s=Number(e.target.value);RP.from=1;RP.to=Math.min(ZD.surah(RP.s).count,5);draw()});
    g('#rF').addEventListener('change',e=>{RP.from=Number(e.target.value)||1;if(RP.to<RP.from)RP.to=RP.from;draw()});g('#rT').addEventListener('change',e=>{RP.to=Number(e.target.value)||RP.from;draw()});
    g('#rR').addEventListener('change',e=>{RP.rep=Number(e.target.value)});g('#rG').addEventListener('change',e=>{RP.gap=Number(e.target.value)});g('#rL').addEventListener('change',e=>{RP.loop=Number(e.target.value)});g('#rSp').addEventListener('change',e=>{RP.speed=Number(e.target.value)});
    g('#rGo').addEventListener('click',()=>ZD.playRange(RP.s,RP.from,RP.to,{repeat:RP.rep,gap:RP.gap,speed:RP.speed,autoNext:true,nextSurah:false},RP.loop));
    g('#rStop').addEventListener('click',()=>P.stop());
    $('#rpRoot').addEventListener('click',e=>{const b=e.target.closest('[data-pre]');if(!b)return;const k=b.dataset.pre;if(k==='mem'){RP.rep=3;RP.gap=5;RP.loop=1}else if(k==='rev'){RP.rep=1;RP.gap=0;RP.loop=3}else{RP.rep=1;RP.gap=0;RP.loop=5}draw()});
  };
  draw();
  const un=ZD.onPlayer(p=>{const el=$('#rStat');if(!el)return;const it=p.cur();el.textContent=it&&it.s===RP.s?('Ayah '+it.a+' · repeat '+Math.min(p.rep+1,RP.rep)+'/'+RP.rep+(p.waiting?' · your turn to recite…':'')+(p.playing?'':' (paused)')):'Ready.'});ZD.onLeave(un);
};

/* ================= PUZZLES ================= */
const PZ={s:1,mode:'order',score:0,total:0};
R.puzzle=async function(args){
  if(ZD.surah(Number(args[0])))PZ.s=Number(args[0]);
  view().innerHTML=top('Puzzles','Train your memory by playing')+'<main id="pzRoot"><section class="card"><div class="field"><label for="pS">Surah</label><select id="pS" class="sl" style="max-width:62%">'+surahOpts(PZ.s)+'</select></div>'+
   seg('pMode',[['order','Word order'],['missing','Missing word'],['next','What’s next?']],PZ.mode)+'<div style="display:flex;justify-content:space-between;align-items:center"><span class="muted small" id="pScore"></span><button class="btn sm ghost" id="pNew">New puzzle</button></div></section><div id="pzBody" class="mt"><div class="skeleton"></div></div></main>';
  const body=$('#pzBody'),d=await loadOrFail(PZ.s,body);if(!d)return;
  const score=()=>{$('#pScore').textContent=PZ.total?'Score: '+PZ.score+' / '+PZ.total:'Solve puzzles to build your score.'};score();
  const tr=x=>x.en?'<div class="tr" lang="en"><small>Hint · meaning</small>'+esc(x.en)+'</div>':'';
  const next=()=>{const m=PZ.mode;if(m==='order')order();else if(m==='missing')missing();else whatNext()};
  function randAyah(minW,maxW){const ids=d.ayahs.map((x,i)=>i).filter(i=>{const n=ZD.words(d.ayahs[i].ar).length;return n>=minW&&n<=maxW});return pick(ids.length?ids:d.ayahs.map((x,i)=>i))}
  function order(){
    const i=randAyah(3,12),x=d.ayahs[i],words=ZD.words(x.ar);let bank=shuffle(words.map((w,k)=>k)),built=[];if(words.length>1&&bank.every((v,k)=>v===k))bank.reverse();let fin=false;
    const paint=()=>{body.innerHTML='<div class="card"><div class="muted small">Ayah '+(i+1)+' of '+esc(ZD.surah(PZ.s).en)+'</div>'+tr(x)+'<div class="built mt" id="built">'+(built.map((k,n)=>'<button class="wchip" data-un="'+n+'">'+esc(words[k])+'</button>').join('')||'<span class="muted small" style="font-family:var(--sans)">Tap the words below in order…</span>')+'</div><div class="chipbank">'+bank.map(k=>'<button class="wchip'+(built.includes(k)?' used':'')+'" data-ch="'+k+'">'+esc(words[k])+'</button>').join('')+'</div><div class="fb" id="fb"></div><div style="display:flex;gap:8px"><button class="btn sm ghost" id="again">Reset</button><button class="btn sm" id="nx" hidden>Next puzzle</button></div></div>';
      const fb=$('#fb');if(built.length===words.length){const ok=built.every((k,n)=>words[k]===words[n]);fb.className='fb '+(ok?'ok':'bad');fb.textContent=ok?'Correct — mashaAllah!':'Not quite. Tap a word above to remove it.';if(ok&&!fin){fin=true;PZ.score++;PZ.total++;score()}if(ok)$('#nx').hidden=false;if(!ok&&!fin){}}else fb.textContent=built.length+' / '+words.length;
      body.onclick=e=>{const c=e.target.closest('[data-ch]'),u=e.target.closest('[data-un]');if(c&&!built.includes(Number(c.dataset.ch))&&built.length<words.length&&!fin){built.push(Number(c.dataset.ch));paint()}if(u&&!fin){built.splice(Number(u.dataset.un),1);paint()}if(e.target.id==='again'&&!fin){bank=shuffle(bank);built=[];paint()}if(e.target.id==='nx')order()};
    };paint();
  }
  function missing(){
    const i=randAyah(4,14),x=d.ayahs[i],words=ZD.words(x.ar),idxs=words.map((w,k)=>k).filter(k=>words[k].replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\s]/g,'').length>=3);const k=pick(idxs.length?idxs:words.map((w,n)=>n)),right=words[k];
    const pool=[...new Set(d.ayahs.flatMap(a=>ZD.words(a.ar)))].filter(w=>w!==right);let opts=shuffle([right,...shuffle(pool).slice(0,3)]);let done=false;
    body.innerHTML='<div class="card"><div class="muted small">Ayah '+(i+1)+' of '+esc(ZD.surah(PZ.s).en)+' — which word is missing?</div>'+tr(x)+'<div class="lab-ayah" lang="ar">'+words.map((w,n)=>n===k?'<span class="w hid" style="min-width:2.4em">&nbsp;</span>':esc(w)).join(' ')+'</div>'+opts.map(o=>'<button class="opt" data-o="'+esc(o)+'" lang="ar">'+esc(o)+'</button>').join('')+'<div class="fb" id="fb"></div><button class="btn sm" id="nx" hidden>Next puzzle</button></div>';
    body.onclick=e=>{if(e.target.id==='nx'){missing();return}const b=e.target.closest('[data-o]');if(!b||done)return;done=true;const ok=b.dataset.o===right;PZ.total++;if(ok)PZ.score++;score();
      ZD.$$('.opt',body).forEach(o=>{if(o.dataset.o===right)o.classList.add('ok');else if(o===b)o.classList.add('bad')});const fb=$('#fb');fb.className='fb '+(ok?'ok':'bad');fb.textContent=ok?'Correct!':'The missing word was shown in green.';$('#nx').hidden=false};
  }
  function whatNext(){
    const n=d.ayahs.length;if(n<4){body.innerHTML='<div class="empty"><div class="big">🧩</div><p>This surah is too short for this puzzle.</p><p class="small">Try “Word order” or “Missing word”, or pick a longer surah.</p></div>';return}
    const i=randAyah(2,16);const a=Math.min(i,n-2),right=a+1;const wrong=shuffle(d.ayahs.map((x,k)=>k).filter(k=>k!==right&&k!==a)).slice(0,3);const opts=shuffle([right,...wrong]);let done=false;
    const fw=(t,k)=>{const w=ZD.words(t);return w.slice(0,k).join(' ')+(w.length>k?' …':'')};
    body.innerHTML='<div class="card"><div class="muted small">Which ayah comes right after ayah '+(a+1)+'?</div><div class="lab-ayah" lang="ar" style="font-size:calc(var(--ar-size) - 6px)">'+esc(fw(d.ayahs[a].ar,14))+'</div>'+opts.map(o=>'<button class="opt" data-o="'+o+'" lang="ar">'+esc(fw(d.ayahs[o].ar,7))+'</button>').join('')+'<div class="fb" id="fb"></div><button class="btn sm" id="nx" hidden>Next puzzle</button></div>';
    body.onclick=e=>{if(e.target.id==='nx'){whatNext();return}const b=e.target.closest('[data-o]');if(!b||done)return;done=true;const ok=Number(b.dataset.o)===right;PZ.total++;if(ok)PZ.score++;score();
      ZD.$$('.opt',body).forEach(o=>{if(Number(o.dataset.o)===right)o.classList.add('ok');else if(o===b)o.classList.add('bad')});const fb=$('#fb');fb.className='fb '+(ok?'ok':'bad');fb.textContent=ok?'Correct!':'It was ayah '+(right+1)+'.';$('#nx').hidden=false};
  }
  $('#pS').addEventListener('change',e=>{PZ.s=Number(e.target.value);ZD.route()});
  $('#pMode').addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;PZ.mode=b.dataset.k;ZD.$$('#pMode button').forEach(x=>x.setAttribute('aria-selected',x===b));next()});
  $('#pNew').addEventListener('click',next);next();
};

/* ================= REVISION SERIES ================= */
R.revision=function(){
  const st=ZD.state(),t=ZD.today(),due=revDue().sort((a,b)=>a.due.localeCompare(b.due)),all=st.rev.slice().sort((a,b)=>a.due.localeCompare(b.due)),later=all.filter(r=>r.due>t),md=mulkDue();
  const label=r=>{const sr=ZD.surah(r.s);return esc(sr.en)+' '+(r.a1===1&&r.a2===sr.count?'(full surah)':r.a1===r.a2?r.s+':'+r.a1:r.s+':'+r.a1+'–'+r.a2)};
  const idx=r=>st.rev.indexOf(r);
  view().innerHTML=top('Revision','Spaced revision series')+'<main id="rvRoot">'+
   '<section class="card"><div class="stat3" style="margin-top:0"><div><b>'+due.length+'</b><span>due today</span></div><div><b>'+st.rev.length+'</b><span>in your series</span></div><div><b>'+md+'</b><span>Al-Mulk due</span></div></div>'+
   (md?'<a class="btn sm mt" href="#/mulk/revise">Revise Al-Mulk ayat ('+md+')</a>':'')+
   '<p class="muted small" style="margin:10px 0 0">After you memorise something, add it here. It comes back after 1, 3, 7, 15, 30, 60 and 90 days — the schedule that helps memory last.</p></section>'+
   '<section class="block"><h2 class="h2">Due today</h2>'+(due.length?due.map(r=>'<div class="row"><div class="mid"><b>'+label(r)+'</b><small>'+(r.due<t?'overdue since '+r.due:'due today')+' · step '+(r.stage+1)+' of 7</small></div><div class="acts"><button class="btn sm" data-rv="'+idx(r)+'">Review</button></div></div>').join(''):'<div class="empty" style="padding:18px"><div class="big">✅</div>Nothing due today.</div>')+'</section>'+
   '<section class="block card"><h2 class="h2">Add to series</h2><div class="field"><label for="aS">Surah</label><select id="aS" class="sl" style="max-width:62%">'+surahOpts(1)+'</select></div><div class="field"><label for="aF">From ayah</label><input id="aF" type="number" min="1" value="1" style="width:92px"></div><div class="field"><label for="aT">To ayah</label><input id="aT" type="number" min="1" value="7" style="width:92px"></div><button class="btn mt" id="aGo" style="width:100%">Add — first revision tomorrow</button></section>'+
   (later.length?'<section class="block"><h2 class="h2">Coming up</h2>'+later.map(r=>'<div class="row"><div class="mid"><b>'+label(r)+'</b><small>next on '+r.due+'</small></div><div class="acts"><button class="ibtn" data-rd="'+idx(r)+'" aria-label="Remove from series">'+icon('trash')+'</button></div></div>').join('')+'</section>':'')+'</main>';
  const sr=()=>ZD.surah(Number($('#aS').value)),fix=()=>{const n=sr().count;$('#aF').max=n;$('#aT').max=n;$('#aT').value=Math.min(n,Number($('#aT').value)||n);if(Number($('#aF').value)>n)$('#aF').value=1};
  $('#aS').addEventListener('change',()=>{$('#aF').value=1;$('#aT').value=sr().count;fix()});$('#aS').dispatchEvent(new Event('change'));
  $('#aGo').addEventListener('click',()=>{const s=Number($('#aS').value),n=ZD.surah(s).count,a1=clamp(Math.round(Number($('#aF').value))||1,1,n),a2=clamp(Math.round(Number($('#aT').value))||n,a1,n);if(addRevision(s,a1,a2)){ZD.toast('Added to your revision series');R.revision()}else ZD.toast('That range is already in your series')});
  $('#rvRoot').addEventListener('click',e=>{const rv=e.target.closest('[data-rv]'),rd=e.target.closest('[data-rd]');
    if(rd){st.rev.splice(Number(rd.dataset.rd),1);ZD.save();R.revision();ZD.toast('Removed')}
    if(rv)review(st.rev[Number(rv.dataset.rv)])});
};
async function review(r){
  if(!r)return;const sr=ZD.surah(r.s);let d;
  ZD.openSheet('<h3>'+esc(sr.en)+' '+r.a1+(r.a2>r.a1?'–'+r.a2:'')+'</h3><div id="rvBody"><div class="spin"></div></div>');
  try{d=await ZD.loadSurah(r.s)}catch(e){$('#rvBody').innerHTML='<p class="err">Could not load the text. Connect to the internet and try again.</p>';return}
  const shown=Math.min(r.a2,r.a1+5);let h='<p class="muted small" style="margin-top:0">Recite it from memory first, then tap each ayah to check.</p><button class="btn sm ghost" id="rvPlay">'+icon('play')+' Listen</button>';
  for(let a=r.a1;a<=shown;a++)h+='<button class="opt" data-a="'+a+'" lang="ar" style="margin:8px 0">Ayah '+a+' — tap to reveal</button>';
  if(r.a2>shown)h+='<p class="muted small">Showing the first 6 ayat of this range.</p>';
  h+='<div class="rate"><button class="hard" data-rate="forgot">Forgot</button><button data-rate="hard">Shaky</button><button class="good" data-rate="easy">Solid</button></div>';
  $('#rvBody').innerHTML=h;const sh=$('#sheet');
  sh.addEventListener('click',e=>{const o=e.target.closest('[data-a]');if(o&&o.dataset.a){o.textContent=d.ayahs[Number(o.dataset.a)-1].ar;o.removeAttribute('data-a')}
    if(e.target.closest('#rvPlay'))ZD.playRange(r.s,r.a1,r.a2,{repeat:1,gap:0,autoNext:true,nextSurah:false},1);
    const b=e.target.closest('[data-rate]');if(b){const k=b.dataset.rate;if(k==='easy')r.stage=Math.min(6,r.stage+1);else if(k==='hard')r.stage=Math.max(0,r.stage-1);else r.stage=0;
      r.due=ZD.addDays(ZD.today(),k==='forgot'?1:INT[r.stage]);ZD.save();ZD.closeSheet();ZD.toast('Next revision: '+(k==='forgot'?'tomorrow':r.due));R.revision()}});
}

/* ================= NAMAZ ================= */
const STEPS=[
 ['Intention (niyyah)','Stand facing the Qiblah. Make the intention in your heart for the prayer you are praying. No special words are required.',''],
 ['Takbir (start)','Raise your hands and say the takbir. Now you are in prayer.','اللَّهُ أَكْبَرُ'],
 ['Qiyam — standing','Say the opening supplication (thana), seek refuge, say Bismillah, then recite Surah Al-Fatihah and one more surah (in the first two rakats of fard prayers).','سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلَهَ غَيْرُكَ'],
 ['Ruku — bowing','Say takbir, bow with a straight back, and say the tasbih three times.','سُبْحَانَ رَبِّيَ الْعَظِيمِ'],
 ['Qawmah — rising','Rise from the bow saying the first phrase; then stand straight and say the second.','سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ — رَبَّنَا لَكَ الْحَمْدُ'],
 ['Sajdah — prostration','Say takbir and go down: forehead, nose, both palms, knees and toes on the ground. Say the tasbih three times. Sit briefly, then do a second sajdah.','سُبْحَانَ رَبِّيَ الْأَعْلَى'],
 ['Next rak’ah, then Qa’dah','Stand for the next rak’ah and repeat. After two rak’ahs, sit and recite the tashahhud.','التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ'],
 ['Final sitting','In the last rak’ah, after the tashahhud, send blessings on the Prophet ﷺ (Durood Ibrahim) and make a dua.','اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ'],
 ['Salam — finish','Turn your face to the right, then to the left, saying the salam each time. The prayer is complete.','السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ']];
const SHORT=[[1,'Required in every rak’ah'],[112,'Al-Ikhlas'],[108,'Al-Kawthar — shortest surah'],[103,'Al-Asr'],[110,'An-Nasr'],[109,'Al-Kafirun'],[105,'Al-Fil'],[106,'Quraysh'],[113,'Al-Falaq'],[114,'An-Nas']];
R.namaz=function(args){
  const tab=args[0]||'steps';
  const tabs='<div class="seg" role="tablist">'+[['steps','Steps'],['rakats','Rakats'],['recite','What to recite']].map(([k,l])=>'<button role="tab" aria-selected="'+(k===tab)+'" data-go="#/namaz/'+k+'">'+l+'</button>').join('')+'</div>';
  let body='';
  if(tab==='rakats'){
    body='<section class="card"><h2 class="h2">Fard (obligatory) rak’ahs</h2><table class="tbl"><tr><th>Prayer</th><th>Fard</th></tr><tr><td>Fajr</td><td>2</td></tr><tr><td>Dhuhr</td><td>4</td></tr><tr><td>Asr</td><td>4</td></tr><tr><td>Maghrib</td><td>3</td></tr><tr><td>Isha</td><td>4</td></tr><tr><td>Jumu’ah (Friday)</td><td>2, in place of Dhuhr</td></tr></table></section>'+
    '<section class="block card"><h2 class="h2">Sunnah & Witr (common Hanafi practice)</h2><table class="tbl"><tr><th>Prayer</th><th>Before</th><th>After</th></tr><tr><td>Fajr</td><td>2</td><td>—</td></tr><tr><td>Dhuhr</td><td>4</td><td>2</td></tr><tr><td>Asr</td><td>—</td><td>—</td></tr><tr><td>Maghrib</td><td>—</td><td>2</td></tr><tr><td>Isha</td><td>—</td><td>2, then Witr 3</td></tr></table><p class="muted small">Sunnah and Witr details differ between schools of thought. Follow your own madhab and ask a local scholar if unsure.</p></section>';
  }else if(tab==='recite'){
    body='<section class="card"><h2 class="h2">Short surahs to learn first</h2>'+SHORT.map(([n,note])=>{const sr=ZD.surah(n);return '<div class="row"><div class="num"><span>'+n+'</span></div><div class="mid"><b>'+esc(sr.en)+'</b><small>'+esc(note)+' · '+sr.count+' ayat</small></div><div class="acts"><a class="pill" href="#/learn/'+n+'/1">Learn</a><button class="ibtn" data-pl="'+n+'" aria-label="Play '+esc(sr.en)+'">'+icon('play')+'</button></div></div>'}).join('')+'</section>'+
    '<section class="block card"><h2 class="h2">Tashahhud & Durood</h2><p class="muted small" style="margin-top:0">Both are in the Steps tab with their Arabic text. Please learn pronunciation from a teacher — apps can only help you practise.</p><a class="btn sm" href="#/namaz/steps">Open steps</a></section>';
  }else{
    body='<ol class="steps">'+STEPS.map(([t,p,ar])=>'<li><b>'+esc(t)+'</b>'+(ar?'<div class="ar-line" lang="ar">'+esc(ar)+'</div>':'')+'<p>'+esc(p)+'</p></li>').join('')+'</ol><p class="muted small">This is a simple outline, not a substitute for learning to pray with a teacher. Small details (hand placement, saying “Ameen” aloud, and so on) differ between madhabs.</p>';
  }
  view().innerHTML=top('Namaz','Learn the prayer step by step',{back:false})+'<main id="nzRoot">'+tabs+body+'</main>';
  $('#nzRoot').addEventListener('click',e=>{const b=e.target.closest('[data-pl]');if(b){ZD.playSurah(Number(b.dataset.pl),1,{noChain:true});ZD.toast('Playing '+ZD.surah(Number(b.dataset.pl)).en)}});
};

/* ================= LEARNING PATH ================= */
const LEVELS=[['Level 1 · Prayer essentials',[1,112,108,103,110]],['Level 2 · Short surahs',[109,105,106,113,114]],['Level 3 · Growing',[107,104,102,101,100]],['Level 4 · Your big goal',[67]]];
function pathDone(s){if(s===67){const m=ZD.state().mulk.status;let c=0;for(let i=1;i<=30;i++)if(m[i]==='memorised')c++;return c===30}return inRevision(s)}
R.path=function(args){
  const s=Number(args[0]);
  if(ZD.surah(s)){
    const sr=ZD.surah(s),mulk=s===67;
    view().innerHTML=top(sr.en,sr.mean+' · '+sr.count+' ayat',{back:true})+'<main id="phRoot"><p class="muted" style="margin:0 2px 8px">Five small steps. Do one at a time, and come back tomorrow for revision.</p><ol class="steps">'+
     '<li><b>Listen</b><p>Play the whole surah once. Just listen.</p><button class="btn sm mt" data-do="listen">'+icon('play')+' Play surah</button></li>'+
     '<li><b>Read along</b><p>Follow the Arabic with the meaning.</p><a class="btn sm mt" href="#/read/'+s+'/1">Open reader</a></li>'+
     '<li><b>Learn ayah by ayah</b><p>Listen, repeat, hide, recite — one ayah at a time.</p><a class="btn sm mt" href="'+(mulk?'#/mulk/lab/1':'#/learn/'+s+'/1')+'">Start learning</a></li>'+
     '<li><b>Play the puzzles</b><p>Put the words in order and find the missing word.</p><a class="btn sm mt" href="#/puzzle/'+s+'">Solve puzzles</a></li>'+
     '<li><b>Add to revision</b><p>So you remember it for good. First revision tomorrow.</p><button class="btn sm mt" data-do="rev">'+(inRevision(s)?'Already added ✓':'Add to revision')+'</button></li></ol></main>';
    $('#phRoot').addEventListener('click',e=>{const b=e.target.closest('[data-do]');if(!b)return;if(b.dataset.do==='listen')ZD.playSurah(s,1,{noChain:true});else{const ok=addRevision(s,1,sr.count);b.textContent=ok?'Added ✓':'Already added ✓';ZD.toast(ok?'Added — first revision tomorrow':'Already in your revision list')}});
    return}
  const total=LEVELS.reduce((n,l)=>n+l[1].length,0),done=LEVELS.reduce((n,l)=>n+l[1].filter(pathDone).length,0);
  view().innerHTML=top('Start here','A simple path from first surahs to Al-Mulk')+'<main><section class="card"><div class="progress-line"><div class="bar"><i style="width:'+Math.round(done/total*100)+'%"></i></div><span class="muted small">'+done+' / '+total+' in revision</span></div><p class="muted small" style="margin:10px 0 0">Go in order. A surah counts as done when you add it to your revision series.</p></section>'+
   LEVELS.map(([name,list])=>'<div class="lvl">'+esc(name)+'</div>'+list.map(n=>{const sr=ZD.surah(n),dn=pathDone(n);return '<a class="pathrow" href="#/path/'+n+'"><span class="tick'+(dn?' done':'')+'">'+(dn?icon('check'):'')+'</span><div style="flex:1;min-width:0"><b>'+esc(sr.en)+'</b><div class="muted small">'+esc(sr.mean)+' · '+sr.count+' ayat</div></div><span class="arn ar" style="font-size:22px;color:var(--gold-soft)">'+esc(sr.ar)+'</span></a>'}).join('')).join('')+'</main>';
};
})();
