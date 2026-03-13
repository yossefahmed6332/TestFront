/* ═══════════════════════════════════════════════════
   CANVAS — Animated math graph background
   ═══════════════════════════════════════════════════ */
const Canvas = (() => {
  let canvas, ctx, W, H, raf, isDark = false;
  const waves = [];
  const WAVE_COUNT = 4;

  function init() {
    canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    buildWaves();
    loop();
    window.addEventListener('resize', resize);
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function buildWaves() {
    waves.length = 0;
    for (let i = 0; i < WAVE_COUNT; i++) {
      waves.push({
        amp:   30 + Math.random() * 50,
        freq:  0.004 + Math.random() * 0.006,
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.004,
        y:     (H / (WAVE_COUNT + 1)) * (i + 1),
        alpha: 0.06 + Math.random() * 0.08
      });
    }
  }

  function setTheme(dark) { isDark = dark; }

  function loop() {
    raf = requestAnimationFrame(loop);
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const accent = isDark ? '232,112,72' : '200,80,42';
    const grid   = isDark ? '80,70,60'   : '180,165,145';

    // Grid lines
    ctx.strokeStyle = `rgba(${grid},.18)`;
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }

    // Sine waves
    waves.forEach(w => {
      w.phase += w.speed;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${accent},${w.alpha})`;
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= W; x += 2) {
        const y = w.y + Math.sin(x * w.freq + w.phase) * w.amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Floating integration symbols
    drawSymbols(accent);
  }

  // Draw faint math symbols at fixed positions
  const symbols = ['∫','∑','∂','π','Δ','∞','∇','dx'].map((s, i) => ({
    s,
    x: (W||800) * (0.08 + i * 0.12),
    y: (H||600) * (0.15 + (i % 3) * 0.3),
    size: 14 + (i % 3) * 6,
    phase: i * 0.8
  }));
  let symTick = 0;

  function drawSymbols(accent) {
    symTick += 0.008;
    symbols.forEach((sym, i) => {
      sym.x = W * (0.06 + i * 0.12);
      sym.y = H * (0.12 + (i % 4) * 0.22);
      const alpha = 0.04 + Math.sin(symTick + sym.phase) * 0.025;
      ctx.fillStyle = `rgba(${accent},${Math.max(0,alpha)})`;
      ctx.font = `${sym.size}px serif`;
      ctx.fillText(sym.s, sym.x, sym.y);
    });
  }

  function destroy() { cancelAnimationFrame(raf); }

  return { init, setTheme, destroy };
})();
/* ═══════════════════════════════════════════════════
   THEME — Dark/light mode manager
   ═══════════════════════════════════════════════════ */
const Theme = (() => {
  const KEY = 'nic-theme';
  let current = 'light';

  function init() {
    const saved = localStorage.getItem(KEY);
    const sys   = window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(saved || (sys ? 'dark' : 'light'));

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(KEY)) apply(e.matches ? 'dark' : 'light');
    });
  }

  function toggle() {
    apply(current === 'dark' ? 'light' : 'dark');
    localStorage.setItem(KEY, current);
  }

  function apply(theme) {
    current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    updateBtn();
    if (typeof Canvas !== 'undefined') Canvas.setTheme(theme === 'dark');
  }

  function updateBtn() {
    const btn  = document.getElementById('themeBtn');
    const icon = btn?.querySelector('.t-icon');
    const lbl  = btn?.querySelector('.t-label');
    if (!btn) return;
    if (icon) icon.textContent = current === 'dark' ? '☀' : '◑';
    if (lbl)  lbl.textContent  = current === 'dark' ? 'Light' : 'Dark';
  }

  return { init, toggle, get: () => current };
})();
/* ═══════════════════════════════════════════════════
   TOAST — Notification system
   ═══════════════════════════════════════════════════ */
const Toast = (() => {
  let container;

  function init() {
    container = document.getElementById('toastContainer');
  }

  function show(msg, type = 'info', duration = 2800) {
    if (!container) return;
    const icons = { success:'✓', error:'⚠', info:'ℹ', copy:'⎘' };
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${msg}</span>`;
    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('toast-out');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  }

  return { init, show };
})();
/* ═══════════════════════════════════════════════════
   HISTORY — Calculation history manager
   ═══════════════════════════════════════════════════ */
const History = (() => {
  const MAX = 8;
  const KEY = 'nic-history';
  let records = [];

  function init() {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) records = JSON.parse(saved);
    } catch(_) {}
    render();
  }

  function add(entry) {
    records.unshift(entry);
    if (records.length > MAX) records.pop();
    try { sessionStorage.setItem(KEY, JSON.stringify(records)); } catch(_) {}
    render();
  }

  function clear() {
    records = [];
    try { sessionStorage.removeItem(KEY); } catch(_) {}
    render();
  }

  function render() {
    const panel = document.getElementById('historyPanel');
    const list  = document.getElementById('historyList');
    const count = document.getElementById('historyCount');
    if (!panel || !list) return;

    panel.hidden = records.length === 0;
    if (count) count.textContent = records.length;
    list.innerHTML = '';

    records.forEach((r, i) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.style.animationDelay = `${i * 40}ms`;
      item.innerHTML = `
        <div class="history-left">
          <span class="history-fn">f(x) = ${esc(r.fn)}</span>
          <span class="history-info">
            [${r.lower}, ${r.upper}] &middot; ${esc(r.method)} &middot; n = ${r.n}
          </span>
        </div>
        <span class="history-result">${esc(r.result)}</span>`;

      // Click to re-fill form
      item.addEventListener('click', () => {
        document.getElementById('inp-function').value = r.fn;
        document.getElementById('inp-lower').value    = r.lower;
        document.getElementById('inp-upper').value    = r.upper;
        document.getElementById('inp-n').value        = r.n;
        const radio = document.querySelector(`input[value="${r.rawMethod}"]`);
        if (radio) radio.checked = true;
        document.getElementById('inp-function').scrollIntoView({ behavior:'smooth', block:'center' });
        Toast.show('Form restored from history', 'info');
      });

      list.appendChild(item);
    });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  return { init, add, clear };
})();
/* ═══════════════════════════════════════════════════
   VALIDATOR — Form validation engine
   ═══════════════════════════════════════════════════ */
const Validator = (() => {
  const RULES = {
    'inp-function': {
      test: v => v.trim().length > 0,
      msg:  'Enter a function, e.g. x**2 or sin(x)'
    },
    'inp-lower': {
      test: v => v !== '' && isFinite(Number(v)),
      msg:  'Enter a valid number for the lower limit'
    },
    'inp-upper': {
      test: v => v !== '' && isFinite(Number(v)),
      msg:  'Enter a valid number for the upper limit'
    },
    'inp-n': {
      test: v => v !== '' && Number(v) >= 1 && Number.isInteger(Number(v)),
      msg:  'n must be a whole number ≥ 1'
    }
  };

  function validate(id) {
    const el   = document.getElementById(id);
    if (!el) return true;
    const rule = RULES[id];
    if (!rule) return true;
    const ok   = rule.test(el.value);
    setState(id, ok ? 'valid' : 'invalid', ok ? '' : rule.msg);
    return ok;
  }

  function validateAll() {
    let ok = true;
    Object.keys(RULES).forEach(id => { if (!validate(id)) ok = false; });
    return ok;
  }

  function setState(id, state, msg = '') {
    const el   = document.getElementById(id);
    const wrap = el?.closest('.field-wrap');
    const msgEl= wrap?.querySelector('.field-error-msg');
    const icon = wrap?.querySelector('.field-status-icon');
    if (!wrap) return;

    wrap.classList.remove('is-valid','is-invalid');
    if (state) wrap.classList.add(`is-${state}`);
    if (msgEl) msgEl.textContent = msg;
    if (icon)  {
      icon.textContent = state === 'valid' ? '✓' : state === 'invalid' ? '✕' : '';
    }
  }

  function clearAll() {
    Object.keys(RULES).forEach(id => setState(id, '', ''));
  }

  function init() {
    // Blur → validate; input → clear invalid
    Object.keys(RULES).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', () => {
        if (el.value !== '') validate(id);
      });
      el.addEventListener('input', () => {
        const wrap = el.closest('.field-wrap');
        if (wrap?.classList.contains('is-invalid')) setState(id, '');
      });
    });
  }

  return { init, validate, validateAll, setState, clearAll };
})();
/* ═══════════════════════════════════════════════════
   API — Backend communication layer
   ═══════════════════════════════════════════════════ */
const API = (() => {
  const ENDPOINT = '/calculate';
  const TIMEOUT  = 12000;

  async function calculate(payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const res = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  controller.signal
      });

      clearTimeout(timer);
      const data = await res.json();

      if (!res.ok) {
        throw new APIError(
          data.error || data.message || `Server responded with ${res.status}`,
          res.status
        );
      }
      if (data.result == null) {
        throw new APIError('Server returned an unexpected response format.');
      }
      return data.result;

    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new APIError('Request timed out. Is the server running?');
      if (err instanceof APIError) throw err;
      throw new APIError(`Network error: ${err.message}`);
    }
  }

  class APIError extends Error {
    constructor(msg, status = 0) {
      super(msg);
      this.name   = 'APIError';
      this.status = status;
    }
  }

  return { calculate, APIError };
})();
/* ═══════════════════════════════════════════════════
   APP — Main controller
   ═══════════════════════════════════════════════════ */
const App = (() => {

  // ── DOM Refs ────────────────────────────────────
  let calcBtn, card, resultPanel, resultValue, resultMeta, errorBanner, statusDot;

  // ── Init ────────────────────────────────────────
  function init() {
    calcBtn      = document.getElementById('calcBtn');
    card         = document.getElementById('mainCard');
    resultPanel  = document.getElementById('resultPanel');
    resultValue  = document.getElementById('resultValue');
    resultMeta   = document.getElementById('resultMeta');
    errorBanner  = document.getElementById('errorBanner');
    statusDot    = document.getElementById('statusDot');

    Validator.init();
    setupRipple();
    setupEnterKey();
    setupCopyBtn();
    setupKbdShortcuts();
    animateHeroIn();
  }

  // ── Calculate ───────────────────────────────────
  async function calculate() {
    clearFeedback();

    const fn     = document.getElementById('inp-function').value.trim();
    const lower  = document.getElementById('inp-lower').value;
    const upper  = document.getElementById('inp-upper').value;
    const n      = document.getElementById('inp-n').value;
    const method = document.querySelector('input[name="method"]:checked')?.value;

    if (!Validator.validateAll()) {
      shakeBtn(); return;
    }
    if (Number(lower) >= Number(upper)) {
      Validator.setState('inp-upper', 'invalid', 'b must be greater than a');
      shakeBtn(); return;
    }
    if (!method) {
      Toast.show('Please select an integration method', 'error'); return;
    }

    const payload = {
      function: fn,
      lower:    parseFloat(lower),
      upper:    parseFloat(upper),
      n:        parseInt(n, 10),
      method
    };

    setLoading(true);

    try {
      const result = await API.calculate(payload);
      showResult(result, payload);
      History.add({
        fn, lower: payload.lower, upper: payload.upper,
        n: payload.n, method: capitalize(method),
        rawMethod: method,
        result: formatNum(result)
      });
      Toast.show('Calculation complete', 'success');
      setStatus('online');
    } catch (err) {
      showError(err.message);
      setStatus('');
      Toast.show(err.message, 'error', 4000);
    } finally {
      setLoading(false);
    }
  }

  // ── Show Result ─────────────────────────────────
  function showResult(value, p) {
    const formatted = formatNum(value);
    resultValue.textContent = formatted;
    resultValue.dataset.raw = value;
    resultMeta.innerHTML = `
      <span>∫ <strong>${escHtml(p.function)}</strong> dx</span>
      <span>[${p.lower}, ${p.upper}] &nbsp;·&nbsp; ${capitalize(p.method)} rule &nbsp;·&nbsp; n = ${p.n}</span>`;
    resultPanel.classList.add('visible');
    resultPanel.style.display = '';
    resultValue.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  // ── Show Error ──────────────────────────────────
  function showError(msg) {
    errorBanner.querySelector('.error-text').textContent = msg;
    errorBanner.classList.add('visible');
    errorBanner.style.display = '';
  }

  // ── Clear Feedback ──────────────────────────────
  function clearFeedback() {
    resultPanel.classList.remove('visible');
    resultPanel.style.display = 'none';
    errorBanner.classList.remove('visible');
    errorBanner.style.display = 'none';
    Validator.clearAll();
  }

  // ── Loading State ───────────────────────────────
  function setLoading(on) {
    calcBtn.disabled = on;
    calcBtn.classList.toggle('loading', on);
    card.classList.toggle('is-loading', on);
    setStatus(on ? 'loading' : '');
  }

  // ── Status Dot ──────────────────────────────────
  function setStatus(state) {
    if (!statusDot) return;
    statusDot.className = 'status-dot';
    if (state) statusDot.classList.add(state);
  }

  // ── Ripple ──────────────────────────────────────
  function setupRipple() {
    calcBtn?.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const r    = document.createElement('span');
      r.className = 'ripple-wave';
      r.style.cssText = `width:${size}px;height:${size}px;`+
        `left:${e.clientX - rect.left - size/2}px;`+
        `top:${e.clientY - rect.top - size/2}px`;
      this.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    });
  }

  // ── Copy Result ─────────────────────────────────
  function setupCopyBtn() {
    document.getElementById('copyBtn')?.addEventListener('click', () => {
      const raw = resultValue?.dataset.raw || resultValue?.textContent;
      navigator.clipboard.writeText(raw).then(() => {
        Toast.show('Result copied to clipboard', 'copy');
      });
    });
  }

  // ── Enter key ───────────────────────────────────
  function setupEnterKey() {
    document.querySelectorAll('.input').forEach(el => {
      el.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });
    });
  }

  // ── Keyboard shortcuts ──────────────────────────
  function setupKbdShortcuts() {
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); calculate(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd')     { e.preventDefault(); Theme.toggle(); }
    });
  }

  // ── Hero animation ──────────────────────────────
  function animateHeroIn() {
    const els = document.querySelectorAll('[data-reveal]');
    els.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      requestAnimationFrame(() => {
        setTimeout(() => {
          el.style.transition = `opacity 0.6s cubic-bezier(.16,1,.3,1), transform 0.6s cubic-bezier(.16,1,.3,1)`;
          el.style.opacity = '';
          el.style.transform = '';
        }, 80 + i * 100);
      });
    });
  }

  // ── Shake button ────────────────────────────────
  function shakeBtn() {
    calcBtn?.classList.add('btn-shake');
    calcBtn?.addEventListener('animationend', () => calcBtn.classList.remove('btn-shake'), { once:true });
  }

  // ── Helpers ─────────────────────────────────────
  function formatNum(n) {
    if (typeof n !== 'number') return String(n);
    if (Number.isInteger(n))   return n.toString();
    return parseFloat(n.toPrecision(15)).toString();
  }
  function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, calculate };
})();

// ── Bootstrap ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Canvas.init();
  Toast.init();
  History.init();
  App.init();
});
