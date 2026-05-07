export function pearsonCorrelation(a = [], b = []) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const x = a.slice(-n);
  const y = b.slice(-n);
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = x[i] - mx;
    const vy = y[i] - my;
    numerator += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : numerator / denom;
}

export function buildCorrelationMatrix(seriesByAsset = {}) {
  const keys = Object.keys(seriesByAsset);
  return keys.map(row => keys.map(col => ({
    row,
    col,
    value: row === col ? 1 : pearsonCorrelation(seriesByAsset[row], seriesByAsset[col]),
  })));
}

export function correlationLabel(value) {
  const abs = Math.abs(value);
  if (abs >= 0.7) return 'Strong';
  if (abs >= 0.3) return 'Moderate';
  return 'Weak';
}
