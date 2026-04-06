import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatNumber, formatXIRR, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import TransactionModal from '../Transactions/TransactionModal';
import SortableHeader from '../Common/SortableHeader';
import useSortState from '../../hooks/useSortState';

// ─── ETF Holdings Table (shared for gold ETFs and silver ETFs) ───────────────

function EtfTable({ holdings, prices, onAddTx }) {
  const { sortCol, sortDir, handleSort } = useSortState();

  const rows = holdings.map((h) => {
    const units = h.totalUnits;
    const invested = h.investedValue;
    const current = h.currentValue;
    const pnl = current - invested;
    const pnlPct = invested > 0 ? pnl / invested : 0;
    const livePrice = h.asset.symbol ? prices[h.asset.symbol]?.price ?? null : null;
    return { ...h, units, invested, current, pnl, pnlPct, livePrice };
  });

  const sorted = [...rows].sort((a, b) => {
    if (!sortCol) return 0;
    const map = {
      name:    () => (a.asset.name || '').localeCompare(b.asset.name || ''),
      symbol:  () => (a.asset.symbol || '').localeCompare(b.asset.symbol || ''),
      units:   () => a.units - b.units,
      avgCost: () => a.avgBuyPrice - b.avgBuyPrice,
      current: () => a.current - b.current,
      invested: () => a.invested - b.invested,
      pnl:     () => a.pnl - b.pnl,
      pnlPct:  () => a.pnlPct - b.pnlPct,
    };
    const cmp = map[sortCol] ? map[sortCol]() : 0;
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const totalInvested = rows.reduce((s, r) => s + r.invested, 0);
  const totalCurrent  = rows.reduce((s, r) => s + r.current, 0);
  const totalPnl      = totalCurrent - totalInvested;
  const totalPnlPct   = totalInvested > 0 ? totalPnl / totalInvested : 0;

  const sh = (label, key) => (
    <SortableHeader label={label} colKey={key} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
  );

  return (
    <div>
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total Invested', value: formatCurrency(totalInvested) },
          { label: 'Current Value', value: formatCurrency(totalCurrent), color: 'text-amber-600' },
          {
            label: 'P&L',
            value: `${totalPnl >= 0 ? '+' : ''}${formatCurrency(totalPnl)}`,
            sub: formatPercent(totalPnlPct),
            color: totalPnl >= 0 ? 'text-green-600' : 'text-red-600',
          },
        ].map((s) => (
          <div key={s.label} className="bg-amber-50 rounded-lg border border-amber-100 p-3">
            <p className="text-gray-500 text-xs font-medium mb-1">{s.label}</p>
            <p className={`font-bold text-sm ${s.color || 'text-gray-900'}`}>{s.value}</p>
            {s.sub && <p className={`text-xs ${s.color || 'text-gray-500'}`}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[760px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-gray-500 text-xs font-medium py-3 pl-4 pr-4 w-6">#</th>
              {sh('Symbol', 'symbol')}
              {sh('Name', 'name')}
              {sh('Units', 'units')}
              {sh('Avg Cost (₹)', 'avgCost')}
              <th className="text-left text-gray-500 text-xs font-medium py-3 pr-4 whitespace-nowrap">
                Live Price (₹)
              </th>
              {sh('Invested', 'invested')}
              {sh('Current Value', 'current')}
              {sh('P&L', 'pnl')}
              {sh('P&L %', 'pnlPct')}
              <th className="text-left text-gray-500 text-xs font-medium py-3 pr-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((row, idx) => (
              <tr key={row.asset.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pl-4 pr-4 text-gray-400 text-xs">{idx + 1}</td>
                <td className="py-3 pr-4 text-gray-700 text-sm font-mono font-medium">
                  {row.asset.symbol || '—'}
                </td>
                <td className="py-3 pr-4 text-gray-900 text-sm font-medium whitespace-nowrap">
                  {row.asset.name}
                </td>
                <td className="py-3 pr-4 text-gray-700 text-sm">
                  {formatNumber(row.units, 0)}
                </td>
                <td className="py-3 pr-4 text-gray-700 text-sm">
                  {formatCurrency(row.avgBuyPrice)}
                </td>
                <td className="py-3 pr-4 text-amber-700 text-sm font-medium">
                  {row.livePrice ? formatCurrency(row.livePrice) : '—'}
                </td>
                <td className="py-3 pr-4 text-gray-700 text-sm">
                  {formatCurrency(row.invested)}
                </td>
                <td className="py-3 pr-4 text-gray-900 text-sm font-semibold">
                  {formatCurrency(row.current)}
                </td>
                <td className={`py-3 pr-4 text-sm font-semibold ${row.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {row.pnl >= 0 ? '+' : ''}{formatCurrency(row.pnl)}
                </td>
                <td className={`py-3 pr-4 text-sm ${row.pnlPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(row.pnlPct)}
                </td>
                <td className="py-3 pr-4">
                  <Button size="sm" variant="secondary" onClick={() => onAddTx(row.asset)}>
                    + Tx
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={6} className="py-3 pl-4 pr-4 text-gray-600 text-xs font-semibold uppercase tracking-wide">
                Total
              </td>
              <td className="py-3 pr-4 text-gray-900 text-sm font-bold">
                {formatCurrency(totalInvested)}
              </td>
              <td className="py-3 pr-4 text-gray-900 text-sm font-bold">
                {formatCurrency(totalCurrent)}
              </td>
              <td className={`py-3 pr-4 text-sm font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
              </td>
              <td className={`py-3 pr-4 text-sm font-bold ${totalPnlPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(totalPnlPct)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Physical Gold Holdings Table ────────────────────────────────────────────

function GoldTable({ holdings, livePrice, onAddTx }) {
  const { sortCol, sortDir, handleSort } = useSortState();

  const rows = holdings.map((h) => {
    const grams = h.totalUnits;
    const invested = h.investedValue;
    const current = h.currentValue;
    const pnl = current - invested;
    const pnlPct = invested > 0 ? pnl / invested : 0;
    return { ...h, grams, invested, current, pnl, pnlPct };
  });

  const sorted = [...rows].sort((a, b) => {
    if (!sortCol) return 0;
    const map = {
      name: () => (a.asset.name || '').localeCompare(b.asset.name || ''),
      type: () => (a.asset.type || '').localeCompare(b.asset.type || ''),
      grams: () => a.grams - b.grams,
      avgCost: () => a.avgBuyPrice - b.avgBuyPrice,
      invested: () => a.invested - b.invested,
      current: () => a.current - b.current,
      pnl: () => a.pnl - b.pnl,
      pnlPct: () => a.pnlPct - b.pnlPct,
    };
    const cmp = map[sortCol] ? map[sortCol]() : 0;
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const totalGrams = rows.reduce((s, r) => s + r.grams, 0);
  const totalInvested = rows.reduce((s, r) => s + r.invested, 0);
  const totalCurrent = rows.reduce((s, r) => s + r.current, 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? totalPnl / totalInvested : 0;

  const sh = (label, key) => (
    <SortableHeader label={label} colKey={key} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
  );

  return (
    <div>
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Grams', value: `${formatNumber(totalGrams, 4)} gm` },
          { label: 'Total Invested', value: formatCurrency(totalInvested) },
          { label: 'Current Value', value: formatCurrency(totalCurrent), color: 'text-amber-600' },
          {
            label: 'P&L',
            value: `${totalPnl >= 0 ? '+' : ''}${formatCurrency(totalPnl)}`,
            sub: formatPercent(totalPnlPct),
            color: totalPnl >= 0 ? 'text-green-600' : 'text-red-600',
          },
        ].map((s) => (
          <div key={s.label} className="bg-amber-50 rounded-lg border border-amber-100 p-3">
            <p className="text-gray-500 text-xs font-medium mb-1">{s.label}</p>
            <p className={`font-bold text-sm ${s.color || 'text-gray-900'}`}>{s.value}</p>
            {s.sub && <p className={`text-xs ${s.color || 'text-gray-500'}`}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Live price */}
      <p className="text-xs text-gray-500 mb-3">
        Live gold price:{' '}
        <span className="font-semibold text-amber-700">
          {livePrice ? `${formatCurrency(livePrice)}/gm` : 'Loading…'}
        </span>
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[780px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-gray-500 text-xs font-medium py-3 pl-4 pr-4 w-6">#</th>
              {sh('Name', 'name')}
              {sh('Type', 'type')}
              {sh('Grams', 'grams')}
              {sh('Avg Buy (₹/gm)', 'avgBuyPrice')}
              <th className="text-left text-gray-500 text-xs font-medium py-3 pr-4 whitespace-nowrap">
                Live (₹/gm)
              </th>
              {sh('Invested', 'invested')}
              {sh('Current Value', 'current')}
              {sh('P&L', 'pnl')}
              {sh('P&L %', 'pnlPct')}
              <th className="text-left text-gray-500 text-xs font-medium py-3 pr-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((row, idx) => (
              <tr key={row.asset.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pl-4 pr-4 text-gray-400 text-xs">{idx + 1}</td>
                <td className="py-3 pr-4 text-gray-900 text-sm font-medium whitespace-nowrap">
                  {row.asset.name}
                </td>
                <td className="py-3 pr-4">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    row.asset.type === 'sgb'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {row.asset.type === 'sgb' ? 'SGB' : 'Digital'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-700 text-sm">
                  {formatNumber(row.grams, 4)} gm
                </td>
                <td className="py-3 pr-4 text-gray-700 text-sm">
                  {formatCurrency(row.avgBuyPrice)}
                </td>
                <td className="py-3 pr-4 text-amber-700 text-sm font-medium">
                  {livePrice ? formatCurrency(livePrice) : '—'}
                </td>
                <td className="py-3 pr-4 text-gray-700 text-sm">
                  {formatCurrency(row.invested)}
                </td>
                <td className="py-3 pr-4 text-gray-900 text-sm font-semibold">
                  {formatCurrency(row.current)}
                </td>
                <td className={`py-3 pr-4 text-sm font-semibold ${row.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {row.pnl >= 0 ? '+' : ''}{formatCurrency(row.pnl)}
                </td>
                <td className={`py-3 pr-4 text-sm ${row.pnlPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(row.pnlPct)}
                </td>
                <td className="py-3 pr-4">
                  <Button size="sm" variant="secondary" onClick={() => onAddTx(row.asset)}>
                    + Tx
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals footer */}
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={3} className="py-3 pl-4 pr-4 text-gray-600 text-xs font-semibold uppercase tracking-wide">
                Total
              </td>
              <td className="py-3 pr-4 text-gray-900 text-sm font-bold">
                {formatNumber(totalGrams, 4)} gm
              </td>
              <td className="py-3 pr-4"></td>
              <td className="py-3 pr-4"></td>
              <td className="py-3 pr-4 text-gray-900 text-sm font-bold">
                {formatCurrency(totalInvested)}
              </td>
              <td className="py-3 pr-4 text-gray-900 text-sm font-bold">
                {formatCurrency(totalCurrent)}
              </td>
              <td className={`py-3 pr-4 text-sm font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
              </td>
              <td className={`py-3 pr-4 text-sm font-bold ${totalPnlPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(totalPnlPct)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Silver summary card (unchanged look) ───────────────────────────────────

function SilverCard({ stats, livePrice, onAddTx }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🥈</span>
        <div>
          <h3 className="text-gray-900 font-bold text-lg">Silver</h3>
          <p className="text-gray-500 text-sm">
            Live: {livePrice ? `${formatCurrency(livePrice)}/gm` : 'Loading…'}
          </p>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={onAddTx} icon="+">Add Transaction</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-gray-400 text-xs">Total Weight</p>
          <p className="text-gray-900 font-semibold">{formatNumber(stats.totalUnits, 3)} gm</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Avg Buy Price</p>
          <p className="text-gray-900 font-semibold">{formatCurrency(stats.avgBuyPrice)}/gm</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Current Value</p>
          <p className="text-gray-900 font-semibold">{formatCurrency(stats.currentValue)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">P&L</p>
          <p className={`font-semibold ${stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
            <span className="text-xs ml-1">({formatPercent(stats.pnlPercent)})</span>
          </p>
        </div>
      </div>

      {stats.xirr !== null && (
        <div className={`mt-3 text-sm font-medium ${stats.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          XIRR: {formatXIRR(stats.xirr)}
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function GoldSilver() {
  const { data, getAssetStats, getCategoryStats, getCategoryDailyChange, prices, addAsset } = usePortfolio();
  const [txAsset, setTxAsset] = useState(null);   // { asset, category }

  const goldAssets = data.gold || [];
  const silverAssets = data.silver || [];

  // Split gold assets into physical (digital/SGB) and ETFs
  const physicalGoldAssets = goldAssets.filter((a) => a.type !== 'etf');
  const goldEtfAssets      = goldAssets.filter((a) => a.type === 'etf');

  // Split silver assets into physical and ETFs
  const physicalSilverAssets = silverAssets.filter((a) => a.type !== 'etf');
  const silverEtfAssets      = silverAssets.filter((a) => a.type === 'etf');

  // Build enriched row data for the physical gold table
  const physicalGoldHoldings = physicalGoldAssets.map((asset) => {
    const stats = getAssetStats(asset, 'gold');
    return { asset, ...stats };
  });

  // Build enriched row data for gold ETFs
  const goldEtfHoldings = goldEtfAssets.map((asset) => {
    const stats = getAssetStats(asset, 'gold');
    return { asset, ...stats };
  });

  // Build enriched row data for silver ETFs
  const silverEtfHoldings = silverEtfAssets.map((asset) => {
    const stats = getAssetStats(asset, 'silver');
    return { asset, ...stats };
  });

  // Silver: aggregate single physical virtual asset (first non-ETF entry, or zero state)
  const silverAsset = physicalSilverAssets[0] || null;
  const silverStats = silverAsset
    ? getAssetStats(silverAsset, 'silver')
    : { totalUnits: 0, avgBuyPrice: 0, currentValue: 0, investedValue: 0, pnl: 0, pnlPercent: 0, xirr: null };

  const goldLivePrice   = prices.gold?.price ?? null;
  const silverLivePrice = prices.silver?.price ?? null;

  // Today's P&L for gold and silver ETFs
  const goldTodayPnl = getCategoryDailyChange('gold');
  const silverTodayPnl = getCategoryDailyChange('silver');
  const goldCatStats = getCategoryStats('gold');
  const silverCatStats = getCategoryStats('silver');
  const goldTodayPct = goldCatStats.totalValue > 0 ? (goldTodayPnl / (goldCatStats.totalValue - goldTodayPnl)) * 100 : 0;
  const silverTodayPct = silverCatStats.totalValue > 0 ? (silverTodayPnl / (silverCatStats.totalValue - silverTodayPnl)) * 100 : 0;

  const handleOpenGoldTx   = (asset) => setTxAsset({ asset, category: 'gold' });
  const handleOpenSilverTx = (asset) => setTxAsset({ asset, category: 'silver' });

  const handleAddSilverHolding = () => {
    let asset = silverAsset;
    if (!asset) {
      asset = addAsset('silver', { name: 'Silver Holdings', category: 'silver', transactions: [] });
    }
    setTxAsset({ asset, category: 'silver' });
  };

  return (
    <div className="space-y-6">
      {/* ── Gold section ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🥇</span>
          <h2 className="text-gray-900 font-bold text-xl">Gold</h2>
          {goldTodayPnl !== 0 && (
            <span className={`ml-auto text-sm font-semibold ${goldTodayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Today: {goldTodayPnl >= 0 ? '+' : ''}{formatCurrency(goldTodayPnl)}
              <span className="text-xs ml-1">({goldTodayPnl >= 0 ? '+' : ''}{goldTodayPct.toFixed(2)}%)</span>
            </span>
          )}
        </div>

        {physicalGoldHoldings.length === 0 && goldEtfHoldings.length === 0 ? (
          <p className="text-gray-500 text-sm">No gold holdings yet.</p>
        ) : (
          <div className="space-y-6">
            {/* Physical gold (digital / SGB) */}
            {physicalGoldHoldings.length > 0 && (
              <div>
                <h3 className="text-gray-700 font-semibold text-sm mb-3 uppercase tracking-wide">
                  Physical & Digital Gold
                </h3>
                <GoldTable
                  holdings={physicalGoldHoldings}
                  livePrice={goldLivePrice}
                  onAddTx={handleOpenGoldTx}
                />
              </div>
            )}

            {/* Gold ETFs */}
            {goldEtfHoldings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                    Gold ETFs
                  </h3>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Live price via Google Finance
                  </span>
                </div>
                <EtfTable
                  holdings={goldEtfHoldings}
                  prices={prices}
                  onAddTx={handleOpenGoldTx}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Silver section ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🥈</span>
          <h2 className="text-gray-900 font-bold text-xl">Silver</h2>
          {silverTodayPnl !== 0 && (
            <span className={`ml-auto text-sm font-semibold ${silverTodayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Today: {silverTodayPnl >= 0 ? '+' : ''}{formatCurrency(silverTodayPnl)}
              <span className="text-xs ml-1">({silverTodayPnl >= 0 ? '+' : ''}{silverTodayPct.toFixed(2)}%)</span>
            </span>
          )}
        </div>

        <div className="space-y-6">
          {/* Physical silver */}
          {physicalSilverAssets.length > 0 && (
            <SilverCard
              stats={silverStats}
              livePrice={silverLivePrice}
              onAddTx={handleAddSilverHolding}
            />
          )}

          {physicalSilverAssets.length === 0 && silverEtfHoldings.length === 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🥈</span>
                <div>
                  <h3 className="text-gray-900 font-bold text-lg">Silver</h3>
                  <p className="text-gray-500 text-sm">
                    Live: {silverLivePrice ? `${formatCurrency(silverLivePrice)}/gm` : 'Loading…'}
                  </p>
                </div>
                <div className="ml-auto">
                  <Button size="sm" onClick={handleAddSilverHolding} icon="+">Add Transaction</Button>
                </div>
              </div>
              <p className="text-gray-500 text-sm">No silver holdings yet.</p>
            </div>
          )}

          {/* Silver ETFs */}
          {silverEtfHoldings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                  Silver ETFs
                </h3>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                  Live price via Google Finance
                </span>
              </div>
              <EtfTable
                holdings={silverEtfHoldings}
                prices={prices}
                onAddTx={handleOpenSilverTx}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Transaction modal ── */}
      {txAsset && (
        <TransactionModal
          isOpen
          onClose={() => setTxAsset(null)}
          asset={txAsset.asset}
          category={txAsset.category}
        />
      )}
    </div>
  );
}

