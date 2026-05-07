function std(values = []) {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + ((v - mean) ** 2), 0) / (values.length - 1);
  return Math.sqrt(Math.max(0, variance));
}

function returns(series = []) {
  const out = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1];
    if (!prev) continue;
    out.push((series[i] - prev) / prev);
  }
  return out;
}

export function calculateVolatilityMetrics(series = [], benchmarkSeries = []) {
  const dailyReturns = returns(series);
  const benchmarkReturns = returns(benchmarkSeries);
  const dailyVol = std(dailyReturns);
  const annualVol = dailyVol * Math.sqrt(252);

  let beta = 0;
  if (dailyReturns.length > 2 && benchmarkReturns.length > 2) {
    const n = Math.min(dailyReturns.length, benchmarkReturns.length);
    const x = dailyReturns.slice(-n);
    const y = benchmarkReturns.slice(-n);
    const meanX = x.reduce((s, v) => s + v, 0) / n;
    const meanY = y.reduce((s, v) => s + v, 0) / n;
    let cov = 0;
    let varY = 0;
    for (let i = 0; i < n; i++) {
      cov += (x[i] - meanX) * (y[i] - meanY);
      varY += (y[i] - meanY) ** 2;
    }
    beta = varY ? cov / varY : 0;
  }

  const avgDaily = dailyReturns.length ? dailyReturns.reduce((s, v) => s + v, 0) / dailyReturns.length : 0;
  const sharpe = annualVol > 0 ? ((avgDaily * 252) - 0.06) / annualVol : 0;

  const rolling30 = dailyReturns.map((_, i) => {
    const chunk = dailyReturns.slice(Math.max(0, i - 29), i + 1);
    return std(chunk) * Math.sqrt(252);
  });

  return { dailyVolatility: dailyVol, annualVolatility: annualVol, beta, sharpe, rolling30 };
}
