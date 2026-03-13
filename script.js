/* ───────────── FRONTEND ONLY ───────────── */

// HERO CANVAS
const HeroCanvas = (() => {
  let canvas, ctx, W, H, raf;
  let time = 0;
  const curves = [];
  const PALETTE = ['rgba(232,112,72,','rgba(180,80,200,','rgba(72,160,232,','rgba(72,220,140,','rgba(232,72,120,'];

  function init() {
    canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    buildCurves();
    loop();
    window.addEventListener('resize', () => { resize(); buildCurves(); });
  }
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function buildCurves() {
    curves.length = 0;
    const defs = [
      { a:3, b:2, delta:0, amp:0.28, speed:0.004, colorIdx:0, alpha:.55, width:1.5 },
      { a:5, b:4, delta:Math.PI/4, amp:0.22, speed:0.003, colorIdx:2, alpha:.4, width:1.2 },
      { a:2, b:3, delta:Math.PI/3, amp:0.32, speed:0.005, colorIdx:1, alpha:.3, width:1.0 },
      { a:7, b:6, delta:Math.PI/6, amp:0.18, speed:0.002, colorIdx:3, alpha:.25, width:0.8 },
      { a:3, b:5, delta:Math.PI/2, amp:0.25, speed:0.0035, colorIdx:4, alpha:.35, width:1.1 },
    ];
    defs.forEach(d => curves.push({ ...d, phase: Math.random() * Math.PI * 2 }));
  }
  function loop() { raf = requestAnimationFrame(loop); time += 0.016; draw(); }
  function draw() {
    ctx.fillStyle = 'rgba(9,8,10,.18)'; ctx.fillRect(0,0,W,H);
    const cx = W/2, cy = H/2;
    curves.forEach(c => {
      const phase = c.phase + time * c.speed * 60;
      const rx = Math.min(W,H)*c.amp, ry = rx*0.75;
      ctx.beginPath();
      ctx.strokeStyle = PALETTE[c.colorIdx]+c.alpha+')';
      ctx.lineWidth = c.width;
      ctx.shadowColor = PALETTE[c.colorIdx]+'0.4)';
      ctx.shadowBlur = 8;
      for(let t=0;t<=Math.PI*2;t+=0.015){
        const x=cx+rx*Math.sin(c.a*t+phase+c.delta);
        const y=cy+ry*Math.sin(c.b*t+phase);
        t<0.015?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke();
      ctx.shadowBlur=0;
    });
    drawIntegralViz();
  }
  function drawIntegralViz() {
    const baseY=H*0.85, startX=W*0.1, endX=W*0.9, amp=H*0.06, freq=0.008;
    ctx.beginPath(); ctx.strokeStyle='rgba(232,112,72,0.15)'; ctx.lineWidth=1;
    for(let x=startX;x<=endX;x++){ const y=baseY-amp*(Math.sin((x-startX)*freq+time*0.5)*0.7+0.3); x===startX?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.stroke();
    ctx.beginPath();
    for(let x=startX;x<=endX;x++){ const y=baseY-amp*(Math.sin((x-startX)*freq+time*0.5)*0.7+0.3); x===startX?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.lineTo(endX,baseY); ctx.lineTo(startX,baseY); ctx.closePath();
    ctx.fillStyle='rgba(232,112,72,0.04)'; ctx.fill();
  }
  function destroy(){ cancelAnimationFrame(raf); }
  return { init, destroy };
})();

// BG CANVAS
const Canvas = (() => {
  let canvas, ctx, W, H, raf, isDark=true;
  let tick=0, waves=[];
  function init(){ canvas=document.getElementById('bg-canvas'); if(!canvas)return; ctx=canvas.getContext('2d'); resize(); buildWaves(); loop(); window.addEventListener('resize',resize);}
  function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight;}
  function buildWaves(){ waves.length=0; for(let i=0;i<4;i++){ waves.push({ amp:28+Math.random()*44, freq:.004+.006*Math.random(), phase:Math.random()*Math.PI*2, speed:.003+.004*Math.random(), y:H/5*(i+1), alpha:.05+.07*Math.random() });}} 
  function setTheme(dark){isDark=dark;}
  function loop(){ raf=requestAnimationFrame(loop); draw();}
  function draw(){ ctx.clearRect(0,0,W,H); tick+=0.012; const ac=isDark?'232,112,72':'200,80,42'; const gc=isDark?'80,70,60':'180,165,145';
    ctx.strokeStyle=`rgba(${gc},.15)`; ctx.lineWidth=1; for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();} 
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    waves.forEach(w=>{ w.phase+=w.speed; ctx.beginPath(); ctx.strokeStyle=`rgba(${ac},${w.alpha})`; ctx.lineWidth=1.5; for(let x=0;x<=W;x+=2){ const y=w.y+Math.sin(x*w.freq+w.phase)*w.amp; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);} ctx.stroke(); });
  }
  function destroy(){ cancelAnimationFrame(raf);}
  return { init, setTheme, destroy };
})();

// THEME
const Theme = (() => {
  const KEY='nic-theme'; let current='dark';
  function init(){ const saved=localStorage.getItem(KEY); const sys=window.matchMedia('(prefers-color-scheme: dark)').matches; apply(saved||(sys?'dark':'light')); }
  function toggle(){ apply(current==='dark'?'light':'dark'); localStorage.setItem(KEY,current);}
  function apply(theme){ current=theme; document.documentElement.setAttribute('data-theme',theme); updateBtns(theme); if(typeof Canvas!=='undefined') Canvas.setTheme(theme==='dark'); }
  function updateBtns(theme){ document.querySelectorAll('.t-icon').forEach(el=>el.textContent=theme==='dark'?'☀':'◑'); document.querySelectorAll('.t-label').forEach(el=>el.textContent=theme==='dark'?'Light':'Dark');}
  return { init, toggle, get:()=>current};
})();

// TOAST
const Toast = (() => { let container; function init(){ container=document.getElementById('toastContainer');} function show(msg,type='info',duration=2800){ if(!container)return; const icons={success:'✓', error:'⚠', info:'ℹ', copy:'⎘'}; const el=document.createElement('div'); el.className='toast'; el.innerHTML=`<span class="toast-icon">${icons[type]||'ℹ'}</span><span>${msg}</span>`; container.appendChild(el); setTimeout(()=>{ el.classList.add('toast-out'); el.addEventListener('animationend',()=>el.remove());},duration);} return {init,show};})();

// HISTORY
const History = (() => { const MAX=8; const KEY='nic-history'; let records=[]; function init(){ try{ const s=sessionStorage.getItem(KEY); if(s) records=JSON.parse(s);}catch{} render(); } function add(entry){ records.unshift(entry); if(records.length>MAX) records.pop(); try{ sessionStorage.setItem(KEY,JSON.stringify(records));}catch{} render();} function clear(){records=[]; try{sessionStorage.removeItem(KEY);}catch{} render();} function render(){ const panel=document.getElementById('historyPanel'); const list=document.getElementById('historyList'); const count=document.getElementById('historyCount'); if(!panel||!list)return; panel.hidden=records.length===0; if(count)count.textContent=records.length; list.innerHTML=''; records.forEach((r,i)=>{ const item=document.createElement('div'); item.className='history-item'; item.style.animationDelay=`${i*40}ms`; item.innerHTML=`<div class="history-left"><span class="history-fn">f(x) = ${esc(r.fn)}</span><span class="history-info">[${r.lower}, ${r.upper}] · ${esc(r.method)} · n=${r.n}</span></div><span class="history-result">${esc(r.result)}</span>`; list.appendChild(item);}); } function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); } return {init,add,clear};})();

// VALIDATOR
const Validator = (() => { const RULES={ 'inp-function':{ test:v=>v.trim().length>0, msg:'Enter a function, e.g. x**2 or 1/(x+1)' }, 'inp-lower':{ test:v=>v!==''&&isFinite(Number(v)), msg:'Enter a valid number for a' }, 'inp-upper':{ test:v=>v!==''&&isFinite(Number(v)), msg:'Enter a valid number for b' }, 'inp-n':{ test:v=>v!==''&&Number(v)>=1&&Number.isInteger(Number(v)), msg:'n must be a whole number ≥ 1' } }; function validate(id){ const el=document.getElementById(id); if(!el)return true; const ok=RULES[id].test(el.value); setState(id,ok?'valid':'invalid',ok?'':RULES[id].msg); return ok;} function validateAll(){ let ok=true; Object.keys(RULES).forEach(id=>{ if(!validate(id))ok=false; }); return ok; } function setState(id,state,msg=''){ const el=document.getElementById(id); const wrap=el?.closest('.field-wrap'); const msgEl=wrap?.querySelector('.field-error-msg'); const icon=wrap?.querySelector('.field-status-icon'); if(!wrap)return; wrap.classList.remove('is-valid','is-invalid'); if(state) wrap.classList.add(`is-${state}`); if(msgEl) msgEl.textContent=msg; if(icon) icon.textContent=state==='valid'?'✓':state==='invalid'?'✕':'';} function clearAll(){ Object.keys(RULES).forEach(id=>setState(id,'')); } function init(){ Object.keys(RULES).forEach(id=>{ const el=document.getElementById(id); if(!el)return; el.addEventListener('blur',()=>{ if(el.value!=='')validate(id); }); el.addEventListener('input',()=>{ const wrap=el.closest('.field-wrap'); if(wrap?.classList.contains('is-invalid')) setState(id,''); });}); } return {init,validate,validateAll,setState,clearAll};})();

// APP — FRONTEND MOCK ONLY
const App = (() => {
  let calcBtn,resultValue,resultMeta,resultPanel,errorBanner,statusDot;
  function init(){
    calcBtn=document.getElementById('calcBtn');
    resultValue=document.getElementById('resultValue');
    resultMeta=document.getElementById('resultMeta');
    resultPanel=document.getElementById('resultPanel');
    errorBanner=document.getElementById('errorBanner');
    statusDot=document.getElementById('statusDot');
    Validator.init(); setupRipple(); setupEnterKey(); setupCopyBtn(); revealCalcPage();
  }
  async function calculate(){
    clearFeedback();
    const fn=document.getElementById('inp-function')?.value.trim();
    const lower=document.getElementById('inp-lower')?.value;
    const upper=document.getElementById('inp-upper')?.value;
    const n=document.getElementById('inp-n')?.value;
    const method=document.querySelector('input[name="method"]:checked')?.value;
    if(!Validator.validateAll()) return;
    if(Number(lower)>=Number(upper)){ Validator.setState('inp-upper','invalid','b must be greater than a'); return;}
    if(!method){ Toast.show('Select a method','error'); return;}
    // MOCK RESULT
    const mockResult = Math.random().toFixed(5);
    resultValue.textContent = mockResult;
    resultValue.dataset.raw = mockResult;
    resultMeta.innerHTML=`<span>∫ <strong>${fn}</strong> dx</span><span>[${lower}, ${upper}] · ${method} rule · n = ${n}</span>`;
    resultPanel.classList.add('visible'); resultPanel.style.display=''; resultPanel.scrollIntoView({behavior:'smooth',block:'nearest'});
    Toast.show('Calculation complete (mock)','success');
    History.add({fn,lower,upper,n,method,rawMethod:method,result:mockResult});
    setStatus('online');
  }
  function clearFeedback(){ resultPanel?.classList.remove('visible'); resultPanel.style.display='none'; errorBanner?.classList.remove('visible'); errorBanner.style.display='none'; Validator.clearAll();}
  function setStatus(s){ if(!statusDot)return; statusDot.className='status-dot'+(s?' '+s:'');}
  function setupRipple(){ calcBtn?.addEventListener('click',()=>calculate());}
  function setupEnterKey(){ document.querySelectorAll('.input').forEach(el=>el.addEventListener('keydown',e=>{ if(e.key==='Enter') calculate(); }));}
  function setupCopyBtn(){ document.getElementById('copyBtn')?.addEventListener('click',()=>{ const raw=resultValue?.dataset.raw||resultValue?.textContent; navigator.clipboard.writeText(raw).then(()=>Toast.show('Copied to clipboard','copy')); });}
  function revealCalcPage(){ document.querySelectorAll('[data-reveal]').forEach((el,i)=>{ el.style.opacity='0'; el.style.transform='translateY(18px)'; requestAnimationFrame(()=>{ setTimeout(()=>{ el.style.transition='opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1)'; el.style.opacity=''; el.style.transform=''; },80+i*110); });}); }
  return {init,calculate};
})();

// SMOOTH SCROLL
function setupCTA(){ document.getElementById('ctaBtn')?.addEventListener('click',e=>{ e.preventDefault(); document.getElementById('calculator')?.scrollIntoView({behavior:'smooth'}); });}

// BOOTSTRAP
document.addEventListener('DOMContentLoaded',()=>{
  Theme.init(); HeroCanvas.init(); Canvas.init(); Toast.init(); History.init(); App.init(); setupCTA();
});
