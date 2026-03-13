/* ══════════════════════════════════════════════════
   HERO CANVAS — Full-screen Lissajous + integral draw
══════════════════════════════════════════════════ */
const HeroCanvas = (() => {
  let canvas, ctx, W, H, raf, t = 0;

  const CURVES = [
    { a:3, b:2, d:0,            col:'232,112,72',  al:.6,  w:1.6, sp:.0040 },
    { a:5, b:4, d:Math.PI*.25,  col:'120,80,220',  al:.35, w:1.1, sp:.0028 },
    { a:2, b:3, d:Math.PI*.33,  col:'60,160,230',  al:.3,  w:1.0, sp:.0050 },
    { a:7, b:6, d:Math.PI*.16,  col:'55,210,130',  al:.22, w:0.8, sp:.0020 },
    { a:4, b:5, d:Math.PI*.5,   col:'230,70,130',  al:.28, w:1.0, sp:.0035 },
    { a:3, b:7, d:Math.PI*.4,   col:'232,180,60',  al:.18, w:0.7, sp:.0018 },
  ].map(c => ({ ...c, phase: Math.random() * Math.PI * 2 }));

  function init() {
    canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    loop();
    window.addEventListener('resize', resize);
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    t += .016;

    // Slow fade trail — gives the "drawing" feel
    ctx.fillStyle = 'rgba(7,6,10,.14)';
    ctx.fillRect(0, 0, W, H);

    const cx = W * .5, cy = H * .48;
    const base = Math.min(W, H) * .36;

    CURVES.forEach(c => {
      const phase = c.phase + t * c.sp * 60;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${c.col},${c.al})`;
      ctx.lineWidth   = c.w;
      ctx.shadowColor = `rgba(${c.col},.3)`;
      ctx.shadowBlur  = 6;

      for (let p = 0; p <= Math.PI * 2; p += .012) {
        const x = cx + base * Math.sin(c.a * p + phase + c.d);
        const y = cy + base * .72 * Math.sin(c.b * p + phase);
        p < .012 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    drawIntegral();
    drawAxisLabels();
  }

  // Faint integral area visualization at bottom
  function drawIntegral() {
    const y0  = H * .82;
    const x0  = W * .08, x1 = W * .92;
    const amp = H * .055;

    // Baseline
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(232,112,72,.1)';
    ctx.lineWidth = 1;
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y0);
    ctx.stroke();

    // Curve
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(232,112,72,.2)';
    ctx.lineWidth = 1.5;
    for (let x = x0; x <= x1; x += 1) {
      const nx = (x - x0) / (x1 - x0);
      const y  = y0 - amp * (Math.sin(nx * Math.PI * 2.5 + t * .5) * .65 + .38);
      x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Shaded fill
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 1) {
      const nx = (x - x0) / (x1 - x0);
      const y  = y0 - amp * (Math.sin(nx * Math.PI * 2.5 + t * .5) * .65 + .38);
      x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.lineTo(x1, y0); ctx.lineTo(x0, y0); ctx.closePath();
    ctx.fillStyle = 'rgba(232,112,72,.045)';
    ctx.fill();

    // Moving sample bars (Simpson visualization)
    const nBars = 8;
    for (let i = 0; i <= nBars; i++) {
      const frac = i / nBars;
      const bx   = x0 + frac * (x1 - x0);
      const by   = y0 - amp * (Math.sin(frac * Math.PI * 2.5 + t * .5) * .65 + .38);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(232,112,72,${.06 + .04 * Math.sin(t + i)})`;
      ctx.lineWidth = .8;
      ctx.moveTo(bx, by); ctx.lineTo(bx, y0);
      ctx.stroke();
    }
  }

  // Faint axis labels
  function drawAxisLabels() {
    ctx.fillStyle = 'rgba(232,112,72,.1)';
    ctx.font = `${Math.round(H * .028)}px serif`;
    ctx.fillText('∫', W * .04, H * .83);
    ctx.font = `${Math.round(H * .016)}px serif`;
    ctx.fillText('a', W * .075, H * .845);
    ctx.fillText('b', W * .915, H * .845);
  }

  function destroy() { cancelAnimationFrame(raf); }
  return { init, destroy };
})();

/* ══════════════════════════════════════════════════
   BG CANVAS — Subtle background for calc page
══════════════════════════════════════════════════ */
const Canvas = (() => {
  let canvas, ctx, W, H, raf, dark = true, tick = 0;
  const waves = [];

  function init() {
    canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize(); build(); loop();
    window.addEventListener('resize', resize);
  }
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function build() {
    waves.length = 0;
    for (let i = 0; i < 4; i++)
      waves.push({ amp:26+Math.random()*44, freq:.004+Math.random()*.006,
        ph:Math.random()*Math.PI*2, sp:.003+Math.random()*.004,
        y:H*.15+H*.2*i, al:.05+Math.random()*.07 });
  }
  function setTheme(d) { dark = d; }
  function loop() { raf = requestAnimationFrame(loop); draw(); }
  function draw() {
    ctx.clearRect(0,0,W,H);
    tick += .012;
    const ac = dark ? '232,112,72' : '200,80,42';
    const gc = dark ? '80,70,60'   : '175,160,140';
    ctx.strokeStyle = `rgba(${gc},.13)`; ctx.lineWidth = 1;
    for (let x=0;x<W;x+=40){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
    for (let y=0;y<H;y+=40){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }
    waves.forEach(w => {
      w.ph += w.sp;
      ctx.beginPath(); ctx.strokeStyle = `rgba(${ac},${w.al})`; ctx.lineWidth = 1.4;
      for (let x=0;x<=W;x+=2) { const y=w.y+Math.sin(x*w.freq+w.ph)*w.amp; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }
      ctx.stroke();
    });
  }
  return { init, setTheme };
})();

/* ══════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════ */
const Theme = (() => {
  const KEY = 'nic-theme';
  let cur = 'dark';

  function init() {
    const saved = localStorage.getItem(KEY);
    const sys   = window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(saved || (sys ? 'dark' : 'light'));
  }
  function toggle() { apply(cur === 'dark' ? 'light' : 'dark'); localStorage.setItem(KEY, cur); }
  function apply(theme) {
    cur = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.t-icon').forEach(el => el.textContent = theme==='dark' ? '☀' : '◑');
    document.querySelectorAll('.t-label').forEach(el => el.textContent = theme==='dark' ? 'Light' : 'Dark');
    Canvas.setTheme(theme === 'dark');
  }
  return { init, toggle };
})();

/* ══════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════ */
const Toast = (() => {
  let box;
  function init() { box = document.getElementById('toastContainer'); }
  function show(msg, type='info', ms=2600) {
    if (!box) return;
    const icons = { success:'✓', error:'⚠', info:'ℹ', copy:'⎘' };
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${icons[type]||'ℹ'}</span><span>${msg}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); el.addEventListener('animationend', ()=>el.remove()); }, ms);
  }
  return { init, show };
})();

/* ══════════════════════════════════════════════════
   HISTORY
══════════════════════════════════════════════════ */
const History = (() => {
  const MAX=8, KEY='nic-hist';
  let recs = [];
  function init() {
    try { const s=sessionStorage.getItem(KEY); if(s) recs=JSON.parse(s); } catch(_){}
    render();
  }
  function add(e) {
    recs.unshift(e); if(recs.length>MAX) recs.pop();
    try { sessionStorage.setItem(KEY, JSON.stringify(recs)); } catch(_){}
    render();
  }
  function clear() {
    recs=[]; try { sessionStorage.removeItem(KEY); } catch(_){} render();
  }
  function render() {
    const panel=document.getElementById('historyPanel');
    const list =document.getElementById('historyList');
    const cnt  =document.getElementById('historyCount');
    if (!panel||!list) return;
    panel.hidden = recs.length===0;
    if(cnt) cnt.textContent=recs.length;
    list.innerHTML='';
    recs.forEach((r,i)=>{
      const el=document.createElement('div');
      el.className='history-item'; el.style.animationDelay=`${i*40}ms`;
      el.innerHTML=`<div class="h-left"><span class="h-fn">f(x) = ${x(r.fn)}</span><span class="h-info">[${r.a}, ${r.b}] · ${x(r.method)} · n=${r.n}</span></div><span class="h-result">${x(r.result)}</span>`;
      el.addEventListener('click',()=>{
        document.getElementById('inp-function').value=r.fn;
        document.getElementById('inp-lower').value=r.a;
        document.getElementById('inp-upper').value=r.b;
        document.getElementById('inp-n').value=r.n;
        const radio=document.querySelector(`input[value="${r.rawMethod}"]`);
        if(radio) radio.checked=true;
        Toast.show('Form restored','info');
      });
      list.appendChild(el);
    });
  }
  function x(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  return { init, add, clear };
})();

/* ══════════════════════════════════════════════════
   VALIDATOR
══════════════════════════════════════════════════ */
const Validator = (() => {
  const RULES = {
    'inp-function': { test:v=>v.trim().length>0,                                    msg:'Enter a function, e.g. x**2 or sin(x)' },
    'inp-lower':    { test:v=>v!==''&&isFinite(Number(v)),                          msg:'Enter a valid number for a' },
    'inp-upper':    { test:v=>v!==''&&isFinite(Number(v)),                          msg:'Enter a valid number for b' },
    'inp-n':        { test:v=>v!==''&&Number(v)>=1&&Number.isInteger(Number(v)),    msg:'n must be a whole number ≥ 1' }
  };

  function validate(id) {
    const el=document.getElementById(id); if(!el) return true;
    const ok=RULES[id].test(el.value);
    set(id, ok?'ok':'bad', ok?'':RULES[id].msg); return ok;
  }
  function all() { let ok=true; Object.keys(RULES).forEach(id=>{ if(!validate(id)) ok=false; }); return ok; }
  function set(id, state, msg='') {
    const el=document.getElementById(id);
    const wrap=el?.closest('.field-wrap');
    const msgEl=wrap?.querySelector('.field-msg');
    const icon =wrap?.querySelector('.field-icon');
    if(!wrap) return;
    wrap.classList.remove('ok','bad');
    if(state) wrap.classList.add(state);
    if(msgEl) msgEl.textContent=msg;
    if(icon)  icon.textContent=state==='ok'?'✓':state==='bad'?'✕':'';
  }
  function clearAll() { Object.keys(RULES).forEach(id=>set(id,'')); }
  function init() {
    Object.keys(RULES).forEach(id=>{
      const el=document.getElementById(id); if(!el) return;
      el.addEventListener('blur',()=>{ if(el.value!=='') validate(id); });
      el.addEventListener('input',()=>{ if(el.closest('.field-wrap')?.classList.contains('bad')) set(id,''); });
    });
  }
  return { init, all, set, clearAll };
})();

/* ══════════════════════════════════════════════════
   API
══════════════════════════════════════════════════ */
const API = (() => {
  async function calculate(payload) {
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(), 12000);
    try {
      const res=await fetch('/calculate',{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload), signal:ctrl.signal
      });
      clearTimeout(timer);
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||data.message||`Server error ${res.status}`);
      if(data.result==null) throw new Error('Unexpected server response.');
      return data.result;
    } catch(e) {
      clearTimeout(timer);
      if(e.name==='AbortError') throw new Error('Request timed out. Is the server running?');
      throw e;
    }
  }
  return { calculate };
})();

/* ══════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════ */
const App = (() => {
  let btn, card, resBox, resVal, resMeta, errBox, statusDot;

  function init() {
    btn       = document.getElementById('calcBtn');
    card      = document.getElementById('mainCard');
    resBox    = document.getElementById('resultBox');
    resVal    = document.getElementById('resultValue');
    resMeta   = document.getElementById('resultMeta');
    errBox    = document.getElementById('errorBox');
    statusDot = document.getElementById('statusDot');

    Validator.init();
    setupRipple();
    setupCopy();
    setupEnter();
    setupKbd();
    revealPage();
  }

  async function calculate() {
    clearFb();
    const fn     = document.getElementById('inp-function')?.value.trim();
    const a      = document.getElementById('inp-lower')?.value;
    const b      = document.getElementById('inp-upper')?.value;
    const n      = document.getElementById('inp-n')?.value;
    const method = document.querySelector('input[name="method"]:checked')?.value;

    if (!Validator.all()) return;
    if (Number(a) >= Number(b)) { Validator.set('inp-upper','bad','b must be greater than a'); return; }
    if (!method) { Toast.show('Select an integration method','error'); return; }

    const payload = { function:fn, lower:parseFloat(a), upper:parseFloat(b), n:parseInt(n,10), method };

    loading(true);
    try {
      const result = await API.calculate(payload);
      showResult(result, payload);
      History.add({ fn, a:payload.lower, b:payload.upper, n:payload.n, method:cap(method), rawMethod:method, result:fmt(result) });
      Toast.show('Calculation complete','success');
      dot('online');
    } catch(e) {
      showErr(e.message);
      Toast.show(e.message,'error',4000);
      dot('');
    } finally { loading(false); }
  }

  function showResult(value, p) {
    resVal.textContent = fmt(value);
    resVal.dataset.raw = value;
    resMeta.innerHTML = `<span>∫ <strong>${esc(p.function)}</strong> dx</span><span>[${p.lower}, ${p.upper}] &nbsp;·&nbsp; ${cap(p.method)} rule &nbsp;·&nbsp; n = ${p.n}</span>`;
    resBox.classList.add('show');
    resBox.style.display = '';
    resBox.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  function showErr(msg) {
    errBox.querySelector('.error-msg').textContent = msg;
    errBox.classList.add('show');
    errBox.style.display = '';
  }

  function clearFb() {
    resBox.classList.remove('show'); resBox.style.display='none';
    errBox.classList.remove('show'); errBox.style.display='none';
    Validator.clearAll();
  }

  function loading(on) {
    btn.disabled = on;
    btn.classList.toggle('loading', on);
    card.classList.toggle('is-loading', on);
    dot(on ? 'loading' : '');
  }

  function dot(s) {
    if (!statusDot) return;
    statusDot.className = 'status-dot' + (s ? ' '+s : '');
  }

  function setupRipple() {
    btn?.addEventListener('click', function(e) {
      const r=this.getBoundingClientRect(), sz=Math.max(r.width,r.height);
      const el=document.createElement('span');
      el.className='ripple';
      el.style.cssText=`width:${sz}px;height:${sz}px;left:${e.clientX-r.left-sz/2}px;top:${e.clientY-r.top-sz/2}px`;
      this.appendChild(el);
      el.addEventListener('animationend',()=>el.remove());
    });
  }

  function setupCopy() {
    document.getElementById('copyBtn')?.addEventListener('click',()=>{
      navigator.clipboard.writeText(resVal?.dataset.raw||resVal?.textContent||'')
        .then(()=>Toast.show('Copied to clipboard','copy'));
    });
  }

  function setupEnter() {
    document.querySelectorAll('.input').forEach(el=>{
      el.addEventListener('keydown', e=>{ if(e.key==='Enter') calculate(); });
    });
  }

  function setupKbd() {
    document.addEventListener('keydown', e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){ e.preventDefault(); calculate(); }
      if((e.ctrlKey||e.metaKey)&&e.key==='d')    { e.preventDefault(); Theme.toggle(); }
    });
  }

  function revealPage() {
    document.querySelectorAll('[data-anim]').forEach(el=>{
      const delay = (+el.dataset.anim || 0) * 110 + 80;
      el.style.cssText += 'opacity:0;transform:translateY(18px);';
      requestAnimationFrame(()=>{
        setTimeout(()=>{
          el.style.transition='opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)';
          el.style.opacity=''; el.style.transform='';
        }, delay);
      });
    });
  }

  function fmt(n) {
    if(typeof n!=='number') return String(n);
    if(Number.isInteger(n)) return n.toString();
    return parseFloat(n.toPrecision(15)).toString();
  }
  function cap(s) { return s?s[0].toUpperCase()+s.slice(1):''; }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { init, calculate };
})();

/* ══════════════════════════════════════════════════
   LANDING SCROLL — clicking or scrolling takes to page 2
══════════════════════════════════════════════════ */
function setupLandingScroll() {
  const landing = document.getElementById('landing');
  if (!landing) return;

  // Click anywhere on landing → scroll to calculator
  landing.addEventListener('click', () => {
    document.getElementById('calculator')?.scrollIntoView({ behavior:'smooth' });
  });
}

/* Typewriter for the H1 */
function typewriterH1() {
  const el   = document.getElementById('typeLine');
  if (!el) return;
  const text = 'Calculate Calculus 2';
  let i = 0;
  // Small delay before starting so the fade-in animation plays first
  setTimeout(() => {
    const timer = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 68);
  }, 600);
}

/* ══════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  HeroCanvas.init();
  Canvas.init();
  Toast.init();
  History.init();
  App.init();
  setupLandingScroll();
  typewriterH1();
});
