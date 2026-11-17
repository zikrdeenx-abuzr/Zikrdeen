/* Zikr Deen App — "Aaj ki Ayah" (ayah of the day) card on Home + streak reminder.
   Uses the built-in Al-Mulk text (with Roman + Hinglish), so it always works offline. */
(function(){'use strict';
const ZD=window.ZD,esc=ZD.esc,icon=ZD.icon;
const dayNo=()=>{const p=ZD.today().split('-').map(Number);return Math.floor(Date.UTC(p[0],p[1]-1,p[2])/86400000)};
let shift=0,shiftDay='';
ZD.dailyAyah=function(){if(shiftDay!==ZD.today()){shift=0;shiftDay=ZD.today()}return(((dayNo()+shift)%30)+30)%30+1};
ZD.dailyHTML=function(){
  const a=ZD.dailyAyah(),M=window.ZD_MULK&&window.ZD_MULK[a-1];if(!M)return'';
  const done=ZD.isRead(67,a),st=ZD.streak(),tr=M.hinglish||M.en||'';
  const nudge=(st>0&&ZD.todayCount()===0)?'<div class="dy-nudge">🔥 '+st+' din ka streak chal raha hai — aaj ek ayah padh kar ise bachao.</div>':'';
  return '<section class="block card daily" id="daily">'+nudge+
    '<div class="dy-top"><h2 class="h2" style="margin:0">Aaj ki Ayah</h2><span class="muted small">Al-Mulk 67:'+a+'</span></div>'+
    '<div class="ar dy-ar" lang="ar">'+esc(M.ar)+'</div>'+
    (M.roman?'<div class="dy-ro">'+esc(M.roman)+'</div>':'')+
    (tr?'<div class="dy-tr">'+esc(tr)+'</div>':'')+
    '<div class="dy-btns"><button class="btn sm" data-dy="play">'+icon('play')+' Suno</button>'+
    '<button class="btn sm ghost" data-dy="done">'+(done?icon('check')+' Padh li':'Maine padh li')+'</button>'+
    '<button class="ibtn" data-dy="share" aria-label="Share as image">'+icon('share')+'</button>'+
    '<button class="ibtn" data-dy="next" aria-label="Next ayah">'+icon('next')+'</button></div></section>';
};
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-dy]');if(!b)return;const a=ZD.dailyAyah(),k=b.dataset.dy;
  if(k==='play'){ZD.playAyah(67,a,{single:true})}
  else if(k==='done'){const on=ZD.toggleRead(67,a);ZD.toast(on?'Mashallah! Aaj ki ayah poori ✓':'Mark hata diya');ZD.route()}
  else if(k==='share'){b.disabled=true;try{await ZD.shareImage(67,a)}catch(err){ZD.toast('Could not create the image')}b.disabled=false}
  else if(k==='next'){shift++;ZD.route()}
});
})();
