async function calculate() {
  const btn       = document.getElementById('calcBtn');
  const resultBox = document.getElementById('resultBox');
  const resultVal = document.getElementById('resultValue');
  const resultMeta= document.getElementById('resultMeta');
  const errorBox  = document.getElementById('errorBox');

  // ── Gather inputs ──────────────────────────────────────────
  const funcStr = document.getElementById('function').value.trim();
  const lower   = document.getElementById('lower').value;
  const upper   = document.getElementById('upper').value;
  const n       = document.getElementById('intervals').value;
  const method  = document.querySelector('input[name="method"]:checked')?.value;

  // ── Validate ───────────────────────────────────────────────
  hideAll();

  if (!funcStr) return showError('Please enter a function f(x).');
  if (lower === '')  return showError('Please enter the lower limit (a).');
  if (upper === '')  return showError('Please enter the upper limit (b).');
  if (!n || Number(n) < 1) return showError('Number of intervals (n) must be at least 1.');
  if (Number(lower) >= Number(upper)) return showError('Upper limit (b) must be greater than lower limit (a).');
  if (!method) return showError('Please select an integration method.');

  // ── Build payload ──────────────────────────────────────────
  const payload = {
    function: funcStr,
    lower:    parseFloat(lower),
    upper:    parseFloat(upper),
    n:        parseInt(n, 10),
    method:   method
  };

  // ── Loading state ──────────────────────────────────────────
  btn.disabled = true;
  btn.classList.add('loading');

  try {
    const response = await fetch('/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Server error (${response.status})`);
    }

    if (data.result === undefined || data.result === null) {
      throw new Error('Unexpected response from server.');
    }

    // ── Display result ─────────────────────────────────────
    const formatted = formatNumber(data.result);
    resultVal.textContent  = formatted;
    resultMeta.textContent = `∫ f(x) dx  from ${lower} to ${upper}  ·  ${capitalize(method)} rule  ·  n = ${n}`;
    resultBox.classList.add('visible');

  } catch (err) {
    showError(err.message || 'Something went wrong. Check that the backend is running.');
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

// ── Helpers ────────────────────────────────────────────────────

function hideAll() {
  document.getElementById('resultBox').classList.remove('visible');
  document.getElementById('errorBox').classList.remove('visible');
  document.getElementById('errorBox').style.display = '';
}

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.classList.add('visible');
  box.style.display = 'block';
}

function formatNumber(num) {
  if (typeof num !== 'number') return String(num);
  // Show up to 16 significant digits, strip trailing zeros
  const str = num.toPrecision(16);
  // If it's an integer, just show it
  if (Number.isInteger(num)) return num.toString();
  // Otherwise use the raw value (full precision)
  return num.toString();
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Allow Enter key to trigger calculation ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') calculate();
    });
  });
});
