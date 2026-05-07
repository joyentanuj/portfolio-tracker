import React, { useMemo } from 'react';
import { Activity, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';

function GaugeArc({ score }) {
  const radius = 52;
  const cx = 70;
  const cy = 70;
  const totalAngle = 180;
  const fillAngle = (score / 100) * totalAngle;

  function polar(centerX, centerY, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(rad),
      y: centerY + r * Math.sin(rad),
    };
  }

  function describeArc(centerX, centerY, r, startDeg, endDeg) {
    const s = polar(centerX, centerY, r, startDeg);
    const e = polar(centerX, centerY, r, endDeg);
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  // Start from left (180 deg) sweep clockwise
  const bgPath = describeArc(cx, cy, radius, 180, 0);
  const fillEndAngle = 180 - fillAngle;
  const fillPath = score > 0 ? describeArc(cx, cy, radius, 180, fillEndAngle) : null;

  const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <svg viewBox="0 0 140 80" role="img" className="w-36 h-20 overflow-visible" aria-label={`Portfolio health score: ${score} out of 100`}>
      <path d={bgPath} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
        className="text-gray-100 dark:text-gray-700" />
      {fillPath && (
        <path d={fillPath} fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="22" fontWeight="700" fill={scoreColor}>
        {score}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="currentColor" className="text-gray-400">
        / 100
      </text>
    </svg>
  );
}

function ScoreRow({ label, value, max = 25, icon, color }) {
  const IconComponent = icon;
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <IconComponent className="w-3 h-3" style={{ color }} />
          {label}
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{value}/{max}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function PortfolioHealthScore() {
  const { getPortfolioStats } = usePortfolio();
  const stats = getPortfolioStats();

  const { score, breakdown, label, labelColor } = useMemo(() => {
    const { categoryBreakdown, totalValue, pnlPercent, xirr } = stats;

    // Diversification: number of non-empty categories (max 25 pts for 5+ categories)
    const activeCats = Object.values(categoryBreakdown).filter(c => c.totalValue > 0).length;
    const divScore = Math.min(activeCats * 5, 25);

    // Returns: XIRR score (max 25 pts for 15%+ XIRR)
    const xirrPct = xirr !== null ? xirr * 100 : 0;
    const returnScore = Math.min(Math.max(0, (xirrPct / 15) * 25), 25);

    // Profitability: portfolio P&L% (max 25 pts for 20%+ gains)
    const pnlPct = pnlPercent * 100;
    const profitScore = Math.min(Math.max(0, (pnlPct / 20) * 25), 25);

    // Size: portfolio value (max 25 pts for 10L+)
    const sizeScore = Math.min((totalValue / 1000000) * 25, 25);

    const totalScore = Math.round(divScore + returnScore + profitScore + sizeScore);

    const lbl = totalScore >= 75 ? 'Excellent' : totalScore >= 50 ? 'Good' : totalScore >= 25 ? 'Fair' : 'Needs Work';
    const lblColor = totalScore >= 75 ? '#10b981' : totalScore >= 50 ? '#6366f1' : totalScore >= 25 ? '#f59e0b' : '#ef4444';

    return {
      score: totalScore,
      label: lbl,
      labelColor: lblColor,
      breakdown: { divScore, returnScore, profitScore, sizeScore },
    };
  }, [stats]);

  return (
    <div>
      <div className="flex flex-col items-center mb-4">
        <GaugeArc score={score} />
        <span className="text-sm font-bold mt-1" style={{ color: labelColor }}>{label}</span>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Portfolio Health Score</p>
      </div>
      <div className="space-y-2.5">
        <ScoreRow label="Diversification" value={breakdown.divScore} max={25} icon={ShieldCheck} color="#6366f1" />
        <ScoreRow label="XIRR Returns" value={Math.round(breakdown.returnScore)} max={25} icon={TrendingUp} color="#10b981" />
        <ScoreRow label="Profitability" value={Math.round(breakdown.profitScore)} max={25} icon={Activity} color="#f59e0b" />
        <ScoreRow label="Portfolio Size" value={Math.round(breakdown.sizeScore)} max={25} icon={AlertTriangle} color="#3b82f6" />
      </div>
    </div>
  );
}
