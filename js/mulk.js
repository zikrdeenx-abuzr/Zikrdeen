/* Zikr Deen App — Surah Al-Mulk (67) Hifz hub: overview, lab, spaced revision, listening. */
(function(){'use strict';
const ZD=window.ZD,$=ZD.$,esc=ZD.esc,icon=ZD.icon,P=ZD.player,R=ZD.R;
const view=()=>$('#view');
const INT=[1,3,7,15,30,60,90];                       // revision intervals in days
const STATUS_LABEL={'':'Not started',learning:'Learning',memorised:'Memorised','needs-revision':'Needs revision'};
const THEMES=[
 [1,2,'Sovereignty, life and death','All dominion belongs to Allah. He created death and life to test which of you is best in deeds.'],
 [3,5,'The flawless heavens','Seven heavens in layers. Look again — no flaw to be found. The lowest heaven is adorned with lamps.'],
 [6,11,'The Fire and the warners','The fate of those who rejected the warners, and their admission of it.'],
 [12,14,'Fearing Allah unseen','Forgiveness and a great reward for those who fear their Lord unseen. He knows what is in every heart.'],
 [15,19,'The earth and the signs around you','The earth made easy to walk; a warning against feeling secure; peoples who denied before; the birds above.'],
 [20,27,'Who can help or provide besides Ar-Rahman?','Questions that call to tawhid and accountability: provision, hearing, sight, hearts — and the Day of gathering.'],
 [28,29,'The reply: He is Ar-Rahman','We believe in Him and put our trust in Him.'],
 [30,30,'The closing question','If your water were to sink away, who could bring you flowing water?']];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mu=()=>ZD.state().mulk;
const statusOf=n=>mu().status[n]||'';

/* ---- Arabic words (waqf signs stay attached to the previous word) ---- */
ZD.words=function(t){const out=[];for(const w of String(t).trim().split(/\s+/)){if(out.length&&/^[\u0615-\u061A\u06D6-\u06ED\u2000-\u206F]+$/.test(w))out[out.length-1]+=' '+w;else out.push(w)}return out};

/* ---- progress / spaced revision ---- */
ZD.mulkSeed=function(){const m=mu();if(m.seeded)return;m.seeded=true;
  try{const raw=JSON.parse(localStorage.getItem('zikrDeen_step5_10_v1')||'null');
    if(raw&&raw.statuses&&typeof raw.statuses==='object'&&!Object.keys(m.status).length){const t=ZD.today();
      for(const [k,v] of Object.entries(raw.statuses)){const n=Number(k);if(n>=1&&n<=30&&['learning','memorised','needs-revision'].includes(v)){m.status[n]=v;if(v==='memorised')m.rev[n]={due:ZD.addDays(t,(n%7)+1),stage:1}}}}
  }catch(e){}
  ZD.save()};
ZD.mulkDueList=function(){const t=ZD.today(),m=mu();return Object.entries(m.rev).filter(([k,v])=>v.due<=t&&m.status[k]).map(([k,v])=>({n:Number(k),due:v.due})).sort((a,b)=>a.due.localeCompare(b.due)||a.n-b.n)};
function rate(n,r){const m=mu(),t=ZD.today(),cur=m.rev[n]||{stage:0,due:t};let stage=cur.stage;
  if(r==='easy'){m.status[n]='memorised';stage=m.rev[n]?Math.min(6,stage+1):0}
  else if(r==='hard'){if(!m.status[n]||m.status[n]==='needs-revision')m.status[n]='learning';stage=Math.max(0,stage-1)}
  else{m.status[n]='needs-revision';stage=0}
  const days=r==='forgot'?1:r==='hard'?Math.max(1,INT[Math.max(0,stage)]-0):INT[stage];
  m.rev[n]={stage,due:ZD.addDays(t,days)};
  m.hist.push({d:t,n,r});if(m.hist.length>600)m.hist.splice(0,m.hist.length-600);
  ZD.save();return m.rev[n]}
function setStatus(n,s){const m=mu();if(!s){delete m.status[n];delete m.rev[n]}else{m.status[n]=s;if(s==='memorised'&&!m.rev[n])m.rev[n]={stage:0,due:ZD.addDays(ZD.today(),1)}}ZD.save()}
const counts=()=>{const m=mu().status,c={memorised:0,learning:0,'needs-revision':0};for(let i=1;i<=30;i++)if(c[m[i]]!==undefined)c[m[i]]++;return c};

/* ---- shared UI bits ---- */
function tabs(cur){const T=[['overview','Overview'],['lab','Hifz lab'],['revise','Revise'],['listen','Listen']];
  return '<div class="seg" role="tablist">'+T.map(([k,l])=>'<button role="tab" aria-selected="'+(k===cur)+'" data-go="#/mulk'+(k==='overview'?'':'/'+k)+'">'+l+(k==='revise'&&ZD.mulkDueList().length?' ('+ZD.mulkDueList().length+')':'')+'</button>').join('')+'</div>'}
function head(cur){return '<header class="topbar"><h1>Al-Mulk<span class="sub">Surah 67 · Hifz hub</span></h1><button class="ibtn" data-go="#/read/67/1" aria-label="Read Surah Al-Mulk">'+icon('book')+'</button></header>'}
function grid(sel){let h='<div class="grid30" role="list">';for(let n=1;n<=30;n++){const s=statusOf(n);h+='<button class="cell '+s+(n===sel?' sel':'')+'" role="listitem" data-cell="'+n+'" aria-label="Ayah '+n+': '+STATUS_LABEL[s]+'">'+n+'</button>'}
  return h+'</div><div class="legend"><span><i class="l-m"></i>Memorised</span><span><i class="l-l"></i>Learning</span><span><i class="l-r"></i>Needs revision</span><span><i></i>Not started</span></div>'}
function firstWords(t,k){const w=ZD.words(t);return w.slice(0,k).join(' ')+(w.length>k?' …':'')}
async function getData(){return ZD.loadSurah(67)}

R.mulk=async function(args){
  ZD.mulkSeed();const tab=args[0]||'overview';
  const fn={overview:overview,lab:lab,revise:revise,listen:listen}[tab]||overview;
  const d=await getData().catch(()=>null);
  if(!d){view().innerHTML=head()+'<main><div class="empty"><div class="big">⚠️</div><p>Surah Al-Mulk could not be loaded.</p></div></main>';return}
  await fn(args.slice(1),d,tab);
};

/* ================= OVERVIEW ================= */
function overview(args,d,tab){
  const c=counts(),pct=Math.round(c.memorised/30*100),due=ZD.mulkDueList().length;
  view().innerHTML=head()+'<main id="mRoot">'+tabs('overview')+
  '<div class="hero mulk-hero"><div class="t" lang="ar">الملك</div><p>The Sovereignty · Meccan · Juz 29 (Tabarakalladhi)</p><div class="chips"><span class="chip">30 ayat</span><span class="chip">Surah 67</span><span class="chip">Starts Juz 29</span></div>'+
   '<div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn" data-go="#/mulk/lab/'+nextToLearn()+'">Continue Hifz</button><button class="btn ghost" data-act="mulkplay">'+icon('play')+' Listen</button></div></div>'+
  '<section class="block card"><div class="progress-line"><div style="flex:1"><div style="display:flex;justify-content:space-between"><b>Your progress</b><span class="muted small">'+c.memorised+' / 30 memorised</span></div><div class="bar" style="margin-top:8px"><i style="width:'+pct+'%"></i></div></div></div><div style="margin-top:14px">'+grid(0)+'</div><p class="muted small" style="margin:10px 0 0">Tap any ayah to practise it. '+(due?'<b>'+due+' ayat</b> are due for revision today.':'Nothing is due for revision today.')+'</p></section>'+
  '<section class="block"><h2 class="h2">Surah map</h2><p class="muted small" style="margin:-4px 2px 6px">A memorisation outline of the surah’s flow — my own summary of its themes, not a tafsir. Compare with a trusted tafsir.</p>'+
   THEMES.map(([a,b,t,desc])=>{let mem=0;for(let n=a;n<=b;n++)if(statusOf(n)==='memorised')mem++;const len=b-a+1;return '<button class="theme" data-go="#/mulk/lab/'+a+'"><div class="rng">Ayah '+(a===b?a:a+'–'+b)+' · '+mem+'/'+len+' memorised</div><b>'+esc(t)+'</b><p>'+esc(desc)+'</p><div class="bar"><i style="width:'+Math.round(mem/len*100)+'%"></i></div></button>'}).join('')+'</section>'+
  '<section class="block card"><h2 class="h2">Why many Muslims recite it</h2><p class="small" style="margin-top:0">It is reported that the Prophet ﷺ described a surah of thirty verses that intercedes for its reciter until he is forgiven — understood to be Surah Al-Mulk (narrated in Tirmidhi, Abu Dawud and Ibn Majah). It is also reported that he would not sleep until he had recited Surah as-Sajdah and Surah Al-Mulk (Tirmidhi).</p><p class="muted small" style="margin-bottom:0">Scholars differ on the grading and details of some narrations. Please confirm with a qualified teacher before quoting them.</p></section>'+
  '<section class="block"><div class="tiles"><button class="tile" data-go="#/mulk/lab/'+nextToLearn()+'">'+icon('repeat')+'<b>Hifz lab</b><span>Repeat, hide, order words</span></button><button class="tile" data-go="#/mulk/revise">'+icon('timer')+'<b>Revise</b><span>'+due+' due today</span></button></div></section></main>';
  const root=$('#mRoot');root.addEventListener('click',e=>{const cell=e.target.closest('[data-cell]');if(cell)location.hash='#/mulk/lab/'+cell.dataset.cell;if(e.target.closest('[data-act="mulkplay"]'))ZD.playSurah(67,1,{noChain:true,cfg:{autoNext:true}})});
}
function nextToLearn(){for(let n=1;n<=30;n++){const s=statusOf(n);if(s!=='memorised')return n}return 1}

/* ================= HIFZ LAB ================= */
const L={level:0,rep:3,gap:5,speed:1,loop:1,to:null};
const hash=(n,i)=>{let h=Math.imul(i+1,2654435761)^Math.imul(n,40503)^0x9e37;h=(h^(h>>>15))>>>0;return h%1009};
function hiddenSet(n,len,level){const k=Math.round(len*level/100);const idx=Array.from({length:len},(_,i)=>i).sort((a,b)=>hash(n,a)-hash(n,b)||a-b);return new Set(idx.slice(0,k))}
ZD.hiddenSet=hiddenSet;
function lab(args,d){
  const n=clamp(Number(args[0])||nextToLearn(),1,30),x=d.ayahs[n-1],words=ZD.words(x.ar),st=statusOf(n);
  if(L.to===null||L.to<n||L.to>30)L.to=n;
  const opts=Array.from({length:30},(_,i)=>'<option value="'+(i+1)+'"'+(i+1===n?' selected':'')+'>Ayah '+(i+1)+(statusOf(i+1)==='memorised'?' ✓':'')+'</option>').join('');
  const toOpts=Array.from({length:30-n+1},(_,i)=>'<option value="'+(n+i)+'"'+(n+i===L.to?' selected':'')+'>'+(n+i===n?'only this ayah':'to ayah '+(n+i))+'</option>').join('');
  const sel=(id,vals,cur,fmt)=>'<select id="'+id+'">'+vals.map(v=>'<option value="'+v+'"'+(v===cur?' selected':'')+'>'+fmt(v)+'</option>').join('')+'</select>';
  view().innerHTML=head()+'<main id="mRoot">'+tabs('lab')+
  '<div class="card"><div style="display:flex;align-items:center;gap:6px"><button class="ibtn" data-step="-1" aria-label="Previous ayah" '+(n===1?'disabled':'')+'>'+icon('prev')+'</button><select id="labN" style="flex:1;background:var(--bg2);color:var(--ink);border:1px solid var(--line);border-radius:12px;min-height:44px;padding:0 10px;font:inherit" aria-label="Choose ayah">'+opts+'</select><button class="ibtn" data-step="1" aria-label="Next ayah" '+(n===30?'disabled':'')+'>'+icon('next')+'</button></div>'+
   '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span class="tag" style="margin:0">'+STATUS_LABEL[st]+'</span><span class="muted small">'+words.length+' words</span></div>'+
   '<div class="lab-ayah" lang="ar" id="labText"></div>'+
   (x.en?'<div class="tr" id="labTr" lang="en" hidden><small>English</small>'+esc(x.en)+'</div><button class="btn sm ghost" id="trToggle">Show meaning</button>':'')+'</div>'+

  '<section class="block card"><h2 class="h2">1 · Listen & repeat</h2>'+
   '<div class="field"><label for="lTo">Range</label><select id="lTo">'+toOpts+'</select></div>'+
   '<div class="field"><label for="lRep">Repeat each ayah</label>'+sel('lRep',[1,3,5,7,10],L.rep,v=>v+'×')+'</div>'+
   '<div class="field"><label for="lGap">Pause to recite yourself</label>'+sel('lGap',[0,3,5,8,12],L.gap,v=>v?v+' s':'none')+'</div>'+
   '<div class="field"><label for="lLoop">Loop the range</label>'+sel('lLoop',[1,2,3,5,10],L.loop,v=>v===1?'once':v+' times')+'</div>'+
   '<div class="field"><label for="lSp">Speed</label>'+sel('lSp',[0.75,0.9,1,1.15],L.speed,v=>v+'×')+'</div>'+
   '<button class="btn" id="lPlay" style="width:100%;margin-top:10px">'+icon('play')+' Start</button></section>'+

  '<section class="block card"><h2 class="h2">2 · Hide & recall</h2><div class="seg" id="lvl">'+[0,25,50,75,100].map(v=>'<button role="tab" aria-selected="'+(v===L.level)+'" data-lvl="'+v+'">'+(v?v+'%':'Show')+'</button>').join('')+'</div><p class="muted small" style="margin:0">Recite from memory, then tap a hidden word to check it. Raise the level as you improve.</p></section>'+

  '<section class="block card"><h2 class="h2">3 · Put the words in order</h2><div class="built" id="built" aria-live="polite"></div><div class="chipbank" id="bank"></div><div class="fb" id="ordFb"></div><div style="display:flex;gap:8px"><button class="btn sm ghost" id="ordReset">Reset</button><button class="btn sm ghost" id="ordHint">Hint</button></div></section>'+

  '<section class="block card"><h2 class="h2">4 · How was it?</h2><p class="muted small" style="margin-top:0">Be honest — this schedules your next revision of ayah '+n+'.</p><div class="rate"><button class="hard" data-rate="forgot">Forgot</button><button data-rate="hard">Shaky</button><button class="good" data-rate="easy">Solid</button></div><div class="fb" id="rateFb"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><button class="btn sm ghost" data-set="learning">Mark learning</button><button class="btn sm ghost" data-set="">Reset this ayah</button><button class="btn sm ghost" data-go="#/read/67/'+n+'">Read in context</button></div></section></main>';
  const root=$('#mRoot');

  /* hide & recall */
  const paint=()=>{const hs=hiddenSet(n,words.length,L.level);$('#labText').innerHTML=words.map((w,i)=>'<span class="w'+(hs.has(i)?' hid':'')+'" data-w="'+i+'">'+esc(w)+'</span>').join(' ')};paint();
  $('#lvl').addEventListener('click',e=>{const b=e.target.closest('[data-lvl]');if(!b)return;L.level=Number(b.dataset.lvl);ZD.$$('#lvl button').forEach(x=>x.setAttribute('aria-selected',x===b));paint()});
  $('#labText').addEventListener('click',e=>{const w=e.target.closest('.w.hid');if(w)w.classList.remove('hid')});
  const tt=$('#trToggle');if(tt)tt.addEventListener('click',()=>{const t=$('#labTr');t.hidden=!t.hidden;tt.textContent=t.hidden?'Show meaning':'Hide meaning'});

  /* navigation */
  $('#labN').addEventListener('change',e=>{location.hash='#/mulk/lab/'+e.target.value});
  root.addEventListener('click',e=>{const s=e.target.closest('[data-step]');if(s)location.hash='#/mulk/lab/'+clamp(n+Number(s.dataset.step),1,30)});

  /* listen & repeat */
  $('#lTo').addEventListener('change',e=>{L.to=Number(e.target.value)});
  $('#lRep').addEventListener('change',e=>{L.rep=Number(e.target.value)});$('#lGap').addEventListener('change',e=>{L.gap=Number(e.target.value)});
  $('#lLoop').addEventListener('change',e=>{L.loop=Number(e.target.value)});$('#lSp').addEventListener('change',e=>{L.speed=Number(e.target.value)});
  $('#lPlay').addEventListener('click',()=>{ZD.playRange(67,n,L.to,{repeat:L.rep,gap:L.gap,speed:L.speed,autoNext:true,nextSurah:false},L.loop);ZD.toast('Listen, then recite in the pause')});

  /* word order */
  const order=words.map((w,i)=>i);let bank=[],built=[];
  const shuffle=()=>{bank=order.slice();for(let i=bank.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bank[i],bank[j]]=[bank[j],bank[i]]}if(words.length>1&&bank.every((v,i)=>v===i))bank.reverse();built=[]};
  const drawOrder=()=>{
    $('#built').innerHTML=built.map((i,k)=>'<button class="wchip" data-un="'+k+'" aria-label="Remove word">'+esc(words[i])+'</button>').join('')||'<span class="muted small" style="font-family:var(--sans)">Tap the words below in the correct order…</span>';
    $('#bank').innerHTML=bank.map(i=>'<button class="wchip'+(built.includes(i)?' used':'')+'" data-ch="'+i+'">'+esc(words[i])+'</button>').join('');
    const fb=$('#ordFb');fb.className='fb';
    if(built.length===words.length){const ok=built.every((i,k)=>words[i]===words[k]);fb.textContent=ok?'Correct — mashaAllah!':'Not quite. Tap a word in the box above to remove it and try again.';fb.classList.add(ok?'ok':'bad')}else fb.textContent=built.length+' / '+words.length+' words';
  };
  shuffle();drawOrder();
  $('#bank').addEventListener('click',e=>{const b=e.target.closest('[data-ch]');if(!b)return;const i=Number(b.dataset.ch);if(!built.includes(i)&&built.length<words.length){built.push(i);drawOrder()}});
  $('#built').addEventListener('click',e=>{const b=e.target.closest('[data-un]');if(!b)return;built.splice(Number(b.dataset.un),1);drawOrder()});
  $('#ordReset').addEventListener('click',()=>{shuffle();drawOrder()});
  $('#ordHint').addEventListener('click',()=>{const k=built.length;const need=bank.find(i=>words[i]===words[k]&&!built.includes(i));if(k<words.length&&need!==undefined){built.push(need);drawOrder()}});

  /* rating */
  root.addEventListener('click',e=>{const r=e.target.closest('[data-rate]'),s=e.target.closest('[data-set]');
    if(r){const res=rate(n,r.dataset.rate),fb=$('#rateFb');fb.className='fb '+(r.dataset.rate==='easy'?'ok':'');fb.textContent='Saved. Next revision: '+(res.due===ZD.addDays(ZD.today(),1)?'tomorrow':res.due)+'.';ZD.save();setTimeout(()=>{if(r.dataset.rate==='easy'&&n<30)location.hash='#/mulk/lab/'+(n+1);else lab([String(n)],d)},700)}
    if(s){setStatus(n,s.dataset.set);ZD.toast(s.dataset.set?'Marked as learning':'Ayah reset');lab([String(n)],d)}});
}

/* ================= REVISE ================= */
let quiz=null;
function revise(args,d){
  const due=ZD.mulkDueList(),m=mu(),weak=Object.entries(m.status).filter(([k,v])=>v==='needs-revision').map(([k])=>Number(k)).sort((a,b)=>a-b);
  const recent=m.quiz.slice(-10),avg=recent.length?Math.round(recent.reduce((a,q)=>a+q.s,0)/recent.reduce((a,q)=>a+q.t,0)*100):null;
  const row=(n,extra)=>'<button class="row" data-go="#/mulk/lab/'+n+'"><div class="num"><span>'+n+'</span></div><div class="mid"><b class="ar" style="font-weight:400;font-size:20px;direction:rtl;text-align:right;display:block" lang="ar">'+esc(firstWords(d.ayahs[n-1].ar,5))+'</b><small>'+extra+'</small></div></button>';
  view().innerHTML=head()+'<main id="mRoot">'+tabs('revise')+
  '<section class="block card"><h2 class="h2">Due today</h2>'+(due.length?due.map(x=>row(x.n,x.due<ZD.today()?'overdue since '+x.due:'due today')).join(''):'<p class="muted" style="margin:0">Nothing due. Mark ayat as “Solid” in the Hifz lab and they will return here after 1, 3, 7, 15, 30, 60 and 90 days.</p>')+'</section>'+
  (weak.length?'<section class="block card"><h2 class="h2">Needs revision</h2>'+weak.map(n=>row(n,'marked “forgot”')).join('')+'</section>':'')+
  '<section class="block card"><h2 class="h2">Quick quiz: what comes next?</h2><div id="quiz"></div>'+(avg!==null?'<p class="muted small">Your last '+recent.length+' quizzes: '+avg+'% correct.</p>':'')+'</section></main>';
  $('#mRoot').addEventListener('click',e=>{if(e.target.closest('[data-act="qstart"]'))startQuiz(d)});
  quizHome();
}
function quizHome(){$('#quiz').innerHTML='<p class="muted small" style="margin-top:0">Five questions. You see the beginning of an ayah’s predecessor and pick the ayah that follows.</p><button class="btn" data-act="qstart">Start quiz</button>'}
function startQuiz(d){
  const qs=[],pool=Array.from({length:29},(_,i)=>i+1);for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  for(const n of pool.slice(0,5)){const wrong=[];while(wrong.length<3){const k=1+Math.floor(Math.random()*30);if(k!==n+1&&k!==n&&!wrong.includes(k))wrong.push(k)}const opts=[n+1,...wrong];for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]]}qs.push({n,opts})}
  quiz={qs,i:0,score:0};showQ(d);
}
function showQ(d){
  const q=quiz.qs[quiz.i],box=$('#quiz');
  box.innerHTML='<div class="muted small">Question '+(quiz.i+1)+' / 5</div><p class="small" style="margin:6px 0">Which ayah comes right after ayah '+q.n+'?</p><div class="lab-ayah" style="font-size:calc(var(--ar-size) - 6px);line-height:1.9" lang="ar">'+esc(firstWords(d.ayahs[q.n-1].ar,12))+'</div>'+q.opts.map(o=>'<button class="opt" data-o="'+o+'" lang="ar">'+esc(firstWords(d.ayahs[o-1].ar,7))+'</button>').join('')+'<div class="fb" id="qfb"></div>';
  box.onclick=e=>{const b=e.target.closest('[data-o]');if(!b||box.dataset.lock==='1')return;box.dataset.lock='1';const ok=Number(b.dataset.o)===q.n+1;if(ok)quiz.score++;
    ZD.$$('.opt',box).forEach(x=>{if(Number(x.dataset.o)===q.n+1)x.classList.add('ok');else if(x===b)x.classList.add('bad')});
    $('#qfb').className='fb '+(ok?'ok':'bad');$('#qfb').textContent=ok?'Correct':'It was ayah '+(q.n+1)+'.';
    setTimeout(()=>{box.dataset.lock='';quiz.i++;if(quiz.i<5)showQ(d);else endQuiz()},1100)};
}
function endQuiz(){const box=$('#quiz');mu().quiz.push({d:ZD.today(),s:quiz.score,t:5});ZD.save();box.onclick=null;
  box.innerHTML='<div class="empty" style="padding:14px"><div class="big">'+(quiz.score>=4?'🌟':quiz.score>=2?'👍':'🌱')+'</div><b style="font-size:20px">'+quiz.score+' / 5</b><p class="muted small">'+(quiz.score>=4?'Strong — keep revising on schedule.':'Keep going — repeat the lab for the ayat you missed.')+'</p><button class="btn" data-act="qstart">Try again</button></div>'}

/* ================= LISTEN ================= */
const LC={from:1,loop:1,sleep:0};
function listen(args,d){
  const p=ZD.prefs(),rec=ZD.RECITERS.map(r=>'<option value="'+r[0]+'"'+(r[0]===p.reciter?' selected':'')+'>'+esc(r[1])+'</option>').join('');
  const fromOpts=Array.from({length:30},(_,i)=>'<option value="'+(i+1)+'"'+(i+1===LC.from?' selected':'')+'>Ayah '+(i+1)+'</option>').join('');
  view().innerHTML=head()+'<main id="mRoot">'+tabs('listen')+
  '<section class="block card"><h2 class="h2">Listen to Al-Mulk</h2>'+
   '<div class="field"><label for="liRec">Reciter</label><select id="liRec" style="max-width:60%">'+rec+'</select></div>'+
   '<div class="field"><label for="liFrom">Start from</label><select id="liFrom">'+fromOpts+'</select></div>'+
   '<div class="field"><label for="liLoop">Repeat surah</label><select id="liLoop">'+[1,2,3,5,7,10].map(v=>'<option value="'+v+'"'+(v===LC.loop?' selected':'')+'>'+(v===1?'once':v+' times')+'</option>').join('')+'</select></div>'+
   '<div class="field"><label for="liSp">Speed</label><select id="liSp">'+[0.75,0.9,1,1.15,1.3].map(v=>'<option value="'+v+'"'+(v===p.speed?' selected':'')+'>'+v+'×</option>').join('')+'</select></div>'+
   '<div class="field"><label for="liSl">Sleep timer</label><select id="liSl">'+[[0,'Off'],[10,'10 min'],[20,'20 min'],[30,'30 min'],[60,'60 min']].map(([v,l])=>'<option value="'+v+'"'+(v===LC.sleep?' selected':'')+'>'+l+'</option>').join('')+'</select></div>'+
   '<button class="btn" id="liGo" style="width:100%;margin-top:12px">'+icon('play')+' Play surah</button></section>'+
  '<section class="block card"><h2 class="h2">Offline audio</h2><p class="muted small" id="liInfo">Checking…</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="liDl">'+icon('down')+' Save all 30 ayat</button><button class="btn sm ghost" id="liDel">'+icon('trash')+' Remove</button></div><div class="bar" style="margin-top:10px" hidden id="liBar"><i style="width:0"></i></div><p class="muted small">Saved audio is stored for the selected reciter on this phone. Any Al-Mulk audio you saved earlier in the original page is detected automatically.</p></section></main>';
  const rc=()=>$('#liRec').value;
  const refresh=async()=>{let c=await ZD.offlineCount(rc(),67);if(!c){let k=0;for(let a=1;a<=30;a++)if(await ZD.hasOffline(rc(),67,a))k++;c=k}$('#liInfo').textContent=c+' / 30 ayat available offline for '+ZD.RECITERS.find(r=>r[0]===rc())[1]+'.'};refresh();
  $('#liRec').addEventListener('change',e=>{p.reciter=e.target.value;ZD.save();refresh()});
  $('#liFrom').addEventListener('change',e=>{LC.from=Number(e.target.value)});$('#liLoop').addEventListener('change',e=>{LC.loop=Number(e.target.value)});
  $('#liSp').addEventListener('change',e=>{p.speed=Number(e.target.value);ZD.save();ZD.updateCfg({speed:p.speed})});
  $('#liSl').addEventListener('change',e=>{LC.sleep=Number(e.target.value);ZD.setSleep(LC.sleep)});
  $('#liGo').addEventListener('click',()=>{ZD.playSurah(67,LC.from,{noChain:true,loop:LC.loop,cfg:{reciter:rc(),speed:p.speed,repeat:1,gap:0,autoNext:true}});if(LC.sleep)ZD.setSleep(LC.sleep)});
  let stop=false;ZD.onLeave(()=>{stop=true});
  $('#liDl').addEventListener('click',async()=>{const b=$('#liDl'),bar=$('#liBar');b.disabled=true;bar.hidden=false;stop=false;const r=await ZD.downloadSurahAudio(rc(),67,1,30,(done,total,fail)=>{bar.firstChild.style.width=(done/total*100)+'%';$('#liInfo').textContent='Saving… '+done+' / '+total+(fail?' ('+fail+' failed)':'')},()=>stop);bar.hidden=true;b.disabled=false;refresh();ZD.toast(r.fail?'Saved '+r.ok+', failed '+r.fail+'. Retry on a stronger connection.':'Al-Mulk audio saved for offline')});
  $('#liDel').addEventListener('click',async()=>{await ZD.deleteSurahAudio(rc(),67);refresh();ZD.toast('Saved audio removed')});
}
})();
