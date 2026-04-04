export function xirr(cashFlows, guess = 0.1) {
  if (!cashFlows || cashFlows.length < 2) return null;

  const hasNegative = cashFlows.some(cf => cf.amount < 0);
  const hasPositive = cashFlows.some(cf => cf.amount > 0);
  if (!hasNegative || !hasPositive) return null;

  const dates = cashFlows.map(cf => new Date(cf.date).getTime());
  const amounts = cashFlows.map(cf => cf.amount);
  const d0 = dates[0];

  function f(r) {
    return amounts.reduce((sum, amount, i) => {
      const t = (dates[i] - d0) / (365 * 24 * 60 * 60 * 1000);
      return sum + amount / Math.pow(1 + r, t);
    }, 0);
  }

  function df(r) {
    return amounts.reduce((sum, amount, i) => {
      const t = (dates[i] - d0) / (365 * 24 * 60 * 60 * 1000);
      return sum - (t * amount) / Math.pow(1 + r, t + 1);
    }, 0);
  }

  // Try multiple starting points to avoid local minima
  const guesses = [guess, 0.0, 0.5, -0.5, 1.0];
  for (const startGuess of guesses) {
    let r = startGuess;
    let converged = false;
    for (let i = 0; i < 200; i++) {
      const fr = f(r);
      const dfr = df(r);
      if (Math.abs(dfr) < 1e-12) break;
      const rNew = r - fr / dfr;
      if (Math.abs(rNew - r) < 1e-7) {
        converged = true;
        r = rNew;
        break;
      }
      r = rNew;
      if (r <= -1) r = -0.9999;
    }
    if (converged && isFinite(r) && r > -1) return r;
  }
  return null;
}

export function buildCashFlows(transactions, currentValue) {
  if (!transactions || transactions.length === 0) return null;

  const flows = transactions
    .filter(t => t.date && t.amount > 0)
    .map(t => ({
      date: new Date(t.date),
      amount: t.type === 'buy' ? -Math.abs(t.amount) : Math.abs(t.amount),
    }))
    .sort((a, b) => a.date - b.date);

  if (flows.length === 0) return null;

  if (currentValue > 0) {
    flows.push({ date: new Date(), amount: currentValue });
  }

  return flows;
}
