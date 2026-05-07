import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatXIRR } from '../../utils/formatters';

const SECTOR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
const CONCENTRATION_THRESHOLD = 35;
const SYMBOL_SECTOR = {
  BANK: 'Finance', HDFC: 'Finance', ICICI: 'Finance', SBIN: 'Finance',
  INFY: 'IT', TCS: 'IT', TECH: 'IT', WIPRO: 'IT',
  SUN: 'Healthcare', CIPLA: 'Healthcare', DRREDDY: 'Healthcare',
  RELIANCE: 'Energy', ONGC: 'Energy',
};

function mapSector(name = '', symbol = '') {
  const key = `${name} ${symbol}`.toUpperCase();
  const match = Object.entries(SYMBOL_SECTOR).find(([k]) => key.includes(k));
  return match ? match[1] : 'Others';
}

export default function SectorBreakdown() {
  const { data, getAssetStats } = usePortfolio();

  const sectors = useMemo(() => {
    const grouped = {};
    [...(data.stocks || []), ...(data.usStocks || [])].forEach(asset => {
      const category = asset.category || (data.stocks?.some(s => s.id === asset.id) ? 'stocks' : 'usStocks');
      const s = getAssetStats(asset, category);
      const sector = mapSector(asset.name, asset.symbol);
      grouped[sector] = grouped[sector] || { name: sector, value: 0, pnl: 0, xirrValues: [] };
      grouped[sector].value += s.currentValue || 0;
      grouped[sector].pnl += s.pnl || 0;
      if (s.xirr !== null) grouped[sector].xirrValues.push(s.xirr);
    });

    const list = Object.values(grouped).map(s => ({
      ...s,
      xirr: s.xirrValues.length ? s.xirrValues.reduce((a, b) => a + b, 0) / s.xirrValues.length : null,
    }));

    const total = list.reduce((sum, s) => sum + s.value, 0) || 1;
    return list
      .map(s => ({ ...s, allocation: (s.value / total) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [data, getAssetStats]);

  if (!sectors.length) return <p className="text-sm text-gray-500 dark:text-gray-400">Add stock holdings to view sector allocation.</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={sectors} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
              {sectors.map((s, i) => <Cell key={s.name} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {sectors.map((s, i) => (
          <div key={s.name} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                <span className="font-medium text-gray-900 dark:text-gray-100">{s.name}</span>
                {s.allocation > CONCENTRATION_THRESHOLD && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Over-concentrated sector" />}
              </div>
              <span className="text-gray-500 dark:text-gray-400">{s.allocation.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between mt-1 text-gray-600 dark:text-gray-300">
              <span>{formatCurrency(s.pnl)}</span>
              <span>{formatXIRR(s.xirr)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
