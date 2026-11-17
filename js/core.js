/* Zikr Deen App — core: state, storage, helpers, Quran text loading (offline-first). */
(function(){'use strict';
const ZD=window.ZD={};
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
ZD.$=$;ZD.$$=$$;
ZD.esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
ZD.icon=(id,cls)=>'<svg'+(cls?' class="'+cls+'"':'')+' aria-hidden="true"><use href="#i-'+id+'"/></svg>';
ZD.pad3=n=>String(n).padStart(3,'0');
ZD.today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
ZD.addDays=(iso,n)=>{const [y,m,d]=iso.split('-').map(Number),x=new Date(y,m-1,d,12);x.setDate(x.getDate()+n);return [x.getFullYear(),String(x.getMonth()+1).padStart(2,'0'),String(x.getDate()).padStart(2,'0')].join('-')};

/* ---------- metadata helpers ---------- */
const S=window.ZD_SURAHS,J=window.ZD_JUZ;
const CUM=[0];for(let i=0;i<114;i++)CUM.push(CUM[i]+S[i][4]);
ZD.surah=n=>{const r=S[n-1];return r?{n:r[0],en:r[1],ar:r[2],mean:r[3],count:r[4],type:r[5]==='M'?'Medinan':'Meccan'}:null};
ZD.surahs=()=>S.map(r=>ZD.surah(r[0]));
ZD.juzList=()=>J.map((r,i)=>({n:i+1,s:r[0],a:r[1],name:r[2]}));
ZD.globalAyah=(s,a)=>CUM[s-1]+a;            // 1..6236
ZD.juzOf=(s,a)=>{let j=1;for(let i=0;i<30;i++){if(J[i][0]<s||(J[i][0]===s&&J[i][1]<=a))j=i+1;else break}return j};
ZD.validRef=(s,a)=>Number.isInteger(s)&&s>=1&&s<=114&&Number.isInteger(a)&&a>=1&&a<=S[s-1][4];
ZD.TOTAL=6236;

/* ---------- state ---------- */
const KEY='zdApp_v1';
const defaults=()=>({v:1,
  prefs:{theme:'night',arSize:34,trSize:16,langs:{en:true,ur:false,hi:true,roman:false,hinglish:false},
    reciter:'Alafasy_128kbps',speed:1,repeat:1,gap:0,autoNext:true,nextSurah:false,wake:false,goal:3,intro:'daily',introDay:'',introSound:'azan'},
  bookmarks:[],last:null,log:{},rev:[],mulk:{status:{},rev:{},hist:[],quiz:[],seeded:false}});
let state=defaults();
const isObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
function merge(base,src){if(!isObj(src))return base;for(const k of Object.keys(base)){if(!(k in src))continue;if(isObj(base[k]))base[k]=merge(base[k],src[k]);else if(typeof base[k]===typeof src[k]||base[k]===null)base[k]=src[k]}return base}
ZD.sanitize=function(raw){
  const st=defaults();if(!isObj(raw))return st;
  merge(st.prefs,raw.prefs);const p=st.prefs;
  p.arSize=Math.min(56,Math.max(24,Math.round(p.arSize)||34));p.trSize=Math.min(26,Math.max(13,Math.round(p.trSize)||16));
  p.speed=[0.75,0.9,1,1.15,1.3,1.5].includes(p.speed)?p.speed:1;p.repeat=Math.min(20,Math.max(1,Math.round(p.repeat)||1));p.gap=Math.min(30,Math.max(0,Math.round(p.gap)||0));
  p.goal=Math.min(100,Math.max(1,Math.round(p.goal)||3));if(!['night','day','oled'].includes(p.theme))p.theme='night';if(!['always','daily','never'].includes(p.intro))p.intro='daily';if(p.introSound==='ambient'||p.introSound==='recite')p.introSound='azan';if(!['azan','reciteonly','off'].includes(p.introSound))p.introSound='azan';if(!/^\d{4}-\d{2}-\d{2}$/.test(p.introDay))p.introDay='';
  if(!ZD.RECITERS.some(r=>r[0]===p.reciter))p.reciter='Alafasy_128kbps';
  if(Array.isArray(raw.bookmarks))st.bookmarks=raw.bookmarks.filter(b=>isObj(b)&&ZD.validRef(b.s,b.a)).slice(0,2000).map(b=>({s:b.s,a:b.a,t:Number(b.t)||Date.now()}));
  if(isObj(raw.last)&&ZD.validRef(raw.last.s,raw.last.a))st.last={s:raw.last.s,a:raw.last.a,t:Number(raw.last.t)||Date.now()};
  if(Array.isArray(raw.rev))st.rev=raw.rev.filter(r=>isObj(r)&&ZD.validRef(r.s,r.a1)&&ZD.validRef(r.s,r.a2)&&r.a2>=r.a1&&Number.isInteger(r.stage)&&r.stage>=0&&r.stage<=6&&/^\d{4}-\d{2}-\d{2}$/.test(r.due)).slice(0,300).map(r=>({s:r.s,a1:r.a1,a2:r.a2,stage:r.stage,due:r.due,added:/^\d{4}-\d{2}-\d{2}$/.test(r.added)?r.added:r.due}));
  if(isObj(raw.log)){for(const [d,arr] of Object.entries(raw.log)){if(/^\d{4}-\d{2}-\d{2}$/.test(d)&&Array.isArray(arr))st.log[d]=arr.filter(x=>typeof x==='string'&&/^\d{1,3}:\d{1,3}$/.test(x)).slice(0,6236)}}
  if(isObj(raw.mulk)){const m=raw.mulk;st.mulk.seeded=!!m.seeded;
    if(isObj(m.status))for(const [k,v] of Object.entries(m.status)){if(/^([1-9]|[12]\d|30)$/.test(k)&&['learning','needs-revision','memorised'].includes(v))st.mulk.status[k]=v}
    if(isObj(m.rev))for(const [k,v] of Object.entries(m.rev)){if(/^([1-9]|[12]\d|30)$/.test(k)&&isObj(v)&&/^\d{4}-\d{2}-\d{2}$/.test(v.due)&&Number.isInteger(v.stage)&&v.stage>=0&&v.stage<=6)st.mulk.rev[k]={due:v.due,stage:v.stage}}
    if(Array.isArray(m.quiz))st.mulk.quiz=m.quiz.filter(q=>isObj(q)&&/^\d{4}-\d{2}-\d{2}$/.test(q.d)&&Number.isInteger(q.s)&&Number.isInteger(q.t)&&q.t>0&&q.s>=0&&q.s<=q.t).slice(-200);
  }
  return st;
};
ZD.RECITERS=[['Alafasy_128kbps','Mishary Alafasy'],['Abdurrahmaan_As-Sudais_192kbps','Abdur-Rahman As-Sudais'],['Husary_128kbps','Mahmoud Khalil Al-Husary (best for learning)'],['Minshawy_Murattal_128kbps','Mohamed Siddiq Al-Minshawi'],['Abdul_Basit_Murattal_192kbps','Abdul Basit Abdus-Samad'],['Maher_AlMuaiqly_128kbps','Maher Al-Muaiqly'],['Abu_Bakr_Ash-Shaatree_128kbps','Abu Bakr Ash-Shaatree']];
try{state=ZD.sanitize(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(e){state=defaults()}
let saveT=0,storageOk=true;
ZD.state=()=>state;ZD.prefs=()=>state.prefs;
ZD.save=function(now){clearTimeout(saveT);const w=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));storageOk=true}catch(e){if(storageOk)ZD.toast('Storage is full or blocked — progress may not be saved.');storageOk=false}};if(now)w();else saveT=setTimeout(w,300)};
window.addEventListener('pagehide',()=>ZD.save(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)ZD.save(true)});
ZD.replaceState=s=>{state=ZD.sanitize(s);ZD.save(true);ZD.applyPrefs()};

ZD.applyPrefs=function(){
  const p=state.prefs,r=document.documentElement;r.dataset.theme=p.theme;
  r.style.setProperty('--ar-size',p.arSize+'px');r.style.setProperty('--tr-size',p.trSize+'px');
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.content={night:'#010f45',day:'#f6f2e6',oled:'#000000'}[p.theme];
};

/* ---------- activity: daily log, streak, bookmarks ---------- */
const keyOf=(s,a)=>s+':'+a;
ZD.isRead=(s,a)=>(state.log[ZD.today()]||[]).includes(keyOf(s,a));
ZD.toggleRead=function(s,a){const d=ZD.today(),k=keyOf(s,a),l=state.log[d]||(state.log[d]=[]),i=l.indexOf(k);let on;if(i>=0){l.splice(i,1);on=false}else{l.push(k);on=true}
  const keys=Object.keys(state.log).sort();while(keys.length>400)delete state.log[keys.shift()];ZD.save();return on};
ZD.todayCount=()=>(state.log[ZD.today()]||[]).length;
ZD.streak=function(){let d=ZD.today(),n=0;if(!(state.log[d]||[]).length)d=ZD.addDays(d,-1);while((state.log[d]||[]).length){n++;d=ZD.addDays(d,-1)}return n};
ZD.totalRead=()=>{const set=new Set();for(const l of Object.values(state.log))for(const k of l)set.add(k);return set.size};
ZD.isBookmarked=(s,a)=>state.bookmarks.some(b=>b.s===s&&b.a===a);
ZD.toggleBookmark=function(s,a){const i=state.bookmarks.findIndex(b=>b.s===s&&b.a===a);let on;if(i>=0){state.bookmarks.splice(i,1);on=false}else{state.bookmarks.unshift({s,a,t:Date.now()});on=true}ZD.save();return on};
ZD.setLast=function(s,a){state.last={s,a,t:Date.now()};ZD.save()};

/* ---------- UI helpers: toast, sheet ---------- */
let toastT=0;
ZD.toast=function(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600)};
ZD.openSheet=function(html,onOpen){const old=$('#sheet'),sh=old.cloneNode(false);sh.className='sheet';sh.innerHTML='<div class="grab"></div>'+html;old.replaceWith(sh);$('#scrim').classList.add('open');void sh.offsetHeight;sh.classList.add('open');if(onOpen)onOpen(sh);const f=sh.querySelector('button,select,input');if(f)f.focus({preventScroll:true})};
ZD.closeSheet=function(){$('#sheet').classList.remove('open');$('#scrim').classList.remove('open')};
document.addEventListener('keydown',e=>{if(e.key==='Escape')ZD.closeSheet()});
ZD.copy=async function(text){try{await navigator.clipboard.writeText(text);ZD.toast('Copied');}catch(e){const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();try{document.execCommand('copy');ZD.toast('Copied')}catch(_){ZD.toast('Could not copy')}t.remove()}};
ZD.download=function(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)};

/* ---------- IndexedDB helper ---------- */
ZD.idb=function(name,store,keyPath){let p=null;
  const open=()=>p||(p=new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('IndexedDB unavailable'));const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(store))r.result.createObjectStore(store,{keyPath})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
  const tx=async(mode,fn)=>{const db=await open();return new Promise((res,rej)=>{const t=db.transaction(store,mode),o=t.objectStore(store);const rq=fn(o);t.oncomplete=()=>res(rq&&rq.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('aborted'))})};
  return{get:k=>tx('readonly',o=>o.get(k)),put:v=>tx('readwrite',o=>o.put(v)),del:k=>tx('readwrite',o=>o.delete(k)),keys:()=>tx('readonly',o=>o.getAllKeys()),clear:()=>tx('readwrite',o=>o.clear())}};
const textDB=ZD.idb('zikrDeenAppTextV1','surahs','n');

/* ---------- Quran text: baked file -> IndexedDB -> live API -> (Al-Mulk) embedded ---------- */
const EDS={ar:'quran-uthmani',en:'en.sahih',ur:'ur.jalandhry',hi:'hi.hindi'};
const strip=t=>t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'').replace(/[\u0671\u0623\u0625\u0622]/g,'\u0627');
ZD.stripBismillah=function(t){const w=String(t).trim().split(/\s+/);if(w.length>4&&strip(w[0])==='بسم'&&strip(w[1])==='الله'&&strip(w[2])==='الرحمن'&&strip(w[3])==='الرحيم')return w.slice(4).join(' ');return t};
const memo=new Map();
async function timed(url,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||20000);try{return await fetch(url,{signal:c.signal,cache:'no-store'})}finally{clearTimeout(t)}}
function fromApi(n,json){
  const eds=json&&json.data;if(!Array.isArray(eds)||eds.length<1)throw new Error('Unexpected API response');
  const by={};for(const e of eds)if(e&&e.edition&&Array.isArray(e.ayahs))by[e.edition.identifier]=e;
  const ar=by[EDS.ar];if(!ar)throw new Error('Arabic text missing');
  const want=ZD.surah(n).count;if(ar.ayahs.length!==want)throw new Error('Ayah count mismatch for surah '+n);
  const out={n,ts:Date.now(),src:{ar:ar.edition.name||'Quran (Uthmani)'},ayahs:[]};
  for(const k of ['en','ur','hi'])if(by[EDS[k]])out.src[k]=(by[EDS[k]].edition.englishName||by[EDS[k]].edition.name||k);
  ar.ayahs.forEach((x,i)=>{const o={a:x.numberInSurah||i+1,ar:(x.numberInSurah===1&&n!==1&&n!==9)?ZD.stripBismillah(x.text):x.text};
    for(const k of ['en','ur','hi']){const e=by[EDS[k]];if(e&&e.ayahs[i]&&e.ayahs[i].text)o[k]=e.ayahs[i].text}out.ayahs.push(o)});
  return out;
}
function mulkEmbedded(){const M=window.ZD_MULK;return{n:67,ts:0,embedded:true,src:{ar:'Zikr Deen original page',en:'Zikr Deen learning translation',ur:'Zikr Deen learning translation',hi:'Zikr Deen learning translation'},
  ayahs:M.map((v,i)=>({a:i+1,ar:v.ar,en:v.en,ur:v.ur,hi:v.hi,roman:v.roman,hinglish:v.hinglish}))}}
function addMulkExtras(d){if(d.n!==67||d.embedded)return d;const M=window.ZD_MULK;if(M&&M.length===d.ayahs.length)d.ayahs.forEach((x,i)=>{x.roman=M[i].roman;x.hinglish=M[i].hinglish});return d}
ZD.loadSurah=async function(n,opts){opts=opts||{};
  if(!opts.force&&memo.has(n))return memo.get(n);
  let d=null;
  try{if(!opts.force)d=await textDB.get(n)}catch(e){}
  if(d&&d.ayahs&&d.ayahs.length===ZD.surah(n).count){d.fromStore=true;addMulkExtras(d);memo.set(n,d);return d}
  d=null;
  try{const r=await timed('./data/quran/'+n+'.json',8000);if(r.ok&&/json/.test(r.headers.get('content-type')||'')){const j=await r.json();if(j&&Array.isArray(j.ayahs)&&j.ayahs.length===ZD.surah(n).count)d=j}}catch(e){}
  if(!d){try{const r=await timed('https://api.alquran.cloud/v1/surah/'+n+'/editions/'+Object.values(EDS).join(','),20000);if(!r.ok)throw new Error('HTTP '+r.status);d=fromApi(n,await r.json())}catch(e){ZD._lastErr=e;d=null}}
  if(d){d.ts=d.ts||Date.now();try{await textDB.put(d)}catch(e){}addMulkExtras(d);memo.set(n,d);return d}
  if(n===67){const m=mulkEmbedded();memo.set(n,m);return m}
  throw ZD._lastErr||new Error('Could not load surah');
};
ZD.cachedSurahs=async function(){try{return new Set(await textDB.keys())}catch(e){return new Set()}};
ZD.downloadAllText=async function(onProg,shouldStop){let done=0,fail=[];const have=await ZD.cachedSurahs();
  for(let n=1;n<=114;n++){if(shouldStop&&shouldStop())break;if(!have.has(n)){try{await ZD.loadSurah(n,{force:true});}catch(e){fail.push(n)}}done++;if(onProg)onProg(done,114,fail.length)}
  return fail};
ZD.clearTextCache=async function(){memo.clear();try{await textDB.clear()}catch(e){}};

ZD.refText=function(s,a,d){const sr=ZD.surah(s);return sr.en+' '+s+':'+a};
ZD.ayahPlain=function(d,a){const x=d.ayahs[a-1],p=ZD.prefs().langs,out=[x.ar];if(p.en&&x.en)out.push(x.en);if(p.hi&&x.hi)out.push(x.hi);if(p.ur&&x.ur)out.push(x.ur);return out.join('\n')};
})();
