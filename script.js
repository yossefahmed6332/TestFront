/* ═══════════════════════════════════════════════════════════
   Numerical Integration Calculator — script.js
   Features: validation, ripple, history, copy, dark mode
   ═══════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────
const history = [];
const MAX_HISTORY = 6;

// ── DOM refs (populated after DOMContentLoaded) ────────────
let btn, resultBox, resultVal, resultMeta, errorBox;

// ── Validation rules per field ─────────────────────────────
const VALIDATORS = {
  'function':  { test: v => v.trim().length > 0,            msg: 'Enter a function, e.g. x^2 or 1/(x+1)' },
  'lower':     { test: v => v !== '' && !isNaN(Number(v)),  msg: 'Enter a valid number for a' },
  'upper':     { test: v => v !== '' && !isNaN(Number(v)),  msg: 'Enter a valid number for b' },
  'intervals': { test: v => v !== '' && Number(v) >= 1 && Number.isInteger(Number(v)),
                                                             msg: 'n must be an integer ≥ 1' }
};

// ── Main calculate ─────────────────────────────────────────
async function calculate() {
  clearFeedback();

  // Gather
  const funcStr = document.getElementById('function').value.trim();
  const lower   = document.getElementById('lower').value;
  const upper   = document.getElementById('upper').value;
  const n       = document.getElementById('intervals').value;
  const method  = document.querySelector('input[name="method"]:checked')?.value;

  // Validate all fields
  const fields  = ['function','lower','upper','intervals'];
  let allValid  = true;
  fields.forEach(id => {
    const el  = document.getElementById(id);
    const ok  = VALIDATORS[id].test(el.value);
    setFieldState(id, ok ? 'valid' : 'invalid', ok ? '' : VALIDATORS[id].msg);
    if (!ok) allValid = false;
  });

  // Cross-field check
  if (allValid && Number(lower) >= Number(upper)) {
    setFieldState('upper', 'invalid', 'b must be greater than a');
    allValid = false;
  }
  if (!allValid) return;

  const payload = {
    function: funcStr,
    lower:    parseFloat(lower),
    upper:    parseFloat(upper),
    n:        parseInt(n, 10),
    method
  };

  // Loading
  setLoading(true);
  const card = document.querySelector('.card');
  card.classList.add('calculating');

  try {
    const response = await fetch('/calculate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || `Server error (${response.status})`);
    if (data.result == null) throw new Error('Unexpected response — missing result field.');

    showResult(data.result, payload);

  } catch (err) {
    showError(err.message || 'Could not reach the backend. Is the server running?');
  } finally {
    setLoading(false);
    card.classList.remove('calculating');
  }
}

// ── Show result ────────────────────────────────────────────
function showResult(value, payload) {
  const formatted = formatNumber(value);
  const methodName = capitalize(payload.method);

  resultVal.textContent          = formatted;
  resultVal.dataset.tooltip      = 'Click to copy';
  resultMeta.textContent =
    `∫ ${payload.function} dx  ·  [${payload.lower}, ${payload.upper}]  ·  ${methodName}  ·  n = ${payload.n}`;

  resultBox.classList.add('visible');

  // Add to history
  addToHistory({ fn: payload.function, lower: payload.lower, upper: payload.upper,
                 n: payload.n, method: methodName, result: formatted });
}

// ── Show error ─────────────────────────────────────────────
function showError(msg) {
  errorBox.innerHTML = `<span class="error-icon">⚠</span><span>${msg}</span>`;
  errorBox.classList.add('visible');
  errorBox.style.display = '';
}

// ── Clear feedback ─────────────────────────────────────────
function clearFeedback() {
  resultBox.classList.remove('visible');
  errorBox.classList.remove('visible');
  errorBox.style.display = 'none';
  ['function','lower','upper','intervals'].forEach(id => setFieldState(id, ''));
}

// ── Field validation state ─────────────────────────────────
function setFieldState(id, state, msg = '') {
  const field = document.getElementById(id);
  const wrap  = field?.closest('.field-wrap');
  const msgEl = wrap?.querySelector('.field-validation-msg');
  const icon  = wrap?.querySelector('.field-icon');

  if (!wrap) return;
  wrap.classList.remove('valid','invalid');
  if (state) wrap.classList.add(state);
  if (msgEl) msgEl.textContent = msg;
  if (icon) {
    icon.textContent = state === 'valid' ? '✓' : state === 'invalid' ? '✕' : '';
    icon.style.color = state === 'valid' ? 'var(--ok)' : 'var(--err)';
  }
}

// ── Loading state ──────────────────────────────────────────
function setLoading(on) {
  btn.disabled = on;
  btn.classList.toggle('loading', on);
}

// ── Format number ──────────────────────────────────────────
function formatNumber(num) {
  if (typeof num !== 'number') return String(num);
  if (Number.isInteger(num))   return num.toString();
  // Up to 15 significant digits, clean trailing zeros
  const s = parseFloat(num.toPrecision(15)).toString();
  return s;
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

// ── Copy result on click ───────────────────────────────────
function setupCopyResult() {
  resultVal.addEventListener('click', () => {
    const text = resultVal.textContent;
    navigator.clipboard.writeText(text).then(() => {
      resultVal.dataset.tooltip = 'Copied!';
      setTimeout(() => { resultVal.dataset.tooltip = 'Click to copy'; }, 1500);
    });
  });
}

// ── Ripple effect on button ────────────────────────────────
function setupRipple() {
  btn.addEventListener('click', function(e) {
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

// ── History ────────────────────────────────────────────────
function addToHistory(entry) {
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.pop();
  renderHistory();
}

function renderHistory() {
  const section = document.getElementById('historySection');
  const list    = document.getElementById('historyList');

  if (!history.length) { section.hidden = true; return; }
  section.hidden = false;
  list.innerHTML = '';

  history.forEach(h => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-left">
        <span class="history-fn">f(x) = ${escHtml(h.fn)}</span>
        <span class="history-info">[${h.lower}, ${h.upper}] · ${h.method} · n=${h.n}</span>
      </div>
      <span class="history-result">${escHtml(h.result)}</span>
    `;
    list.appendChild(item);
  });
}

function clearHistory() {
  history.length = 0;
  renderHistory();
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

// ── Dark mode ──────────────────────────────────────────────
function setupThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  const icon   = toggle.querySelector('.t-icon');
  const label  = toggle.querySelector('.t-label');

  const saved  = localStorage.getItem('nic-theme') || 'light';
  applyTheme(saved, icon, label);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'light';
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, icon, label);
    localStorage.setItem('nic-theme', next);
  });
}

function applyTheme(theme, icon, label) {
  document.documentElement.dataset.theme = theme;
  icon.textContent  = theme === 'dark' ? '☀' : '◑';
  label.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

// ── Live validation on blur ────────────────────────────────
function setupLiveValidation() {
  Object.keys(VALIDATORS).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => {
      if (el.value === '') return; // don't flag empty on first blur
      const ok = VALIDATORS[id].test(el.value);
      setFieldState(id, ok ? 'valid' : 'invalid', ok ? '' : VALIDATORS[id].msg);
    });
    el.addEventListener('input', () => {
      // Clear invalid state while user is typing
      const wrap = el.closest('.field-wrap');
      if (wrap?.classList.contains('invalid')) setFieldState(id, '');
    });
  });
}

// ── Enter key ─────────────────────────────────────────────
function setupEnterKey() {
  document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });
  });
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  btn       = document.getElementById('calcBtn');
  resultBox = document.getElementById('resultBox');
  resultVal = document.getElementById('resultValue');
  resultMeta= document.getElementById('resultMeta');
  errorBox  = document.getElementById('errorBox');

  setupRipple();
  setupCopyResult();
  setupLiveValidation();
  setupEnterKey();
  setupThemeToggle();

  // Init history panel hidden
  const section = document.getElementById('historySection');
  if (section) section.hidden = true;
});
