import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatNumber, formatXIRR, formatPercent } from '../../utils/formatters';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import TransactionModal from '../Transactions/TransactionModal';

function MetalSummaryCard({ type, stats, prices, onAddTx, icon }) {
  const priceInfo = prices[type];

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="text-white font-bold text-lg capitalize">{type}</h3>
          <p className="text-gray-400 text-sm">
            Live: {priceInfo?.price ? `${formatCurrency(priceInfo.price)}/g` : 'Loading...'}
            {priceInfo?.source === 'static' && <span className="text-yellow-500 ml-1">(est.)</span>}
          </p>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={onAddTx} icon="+">Add Transaction</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-gray-500 text-xs">Total Weight</p>
          <p className="text-white font-semibold">{formatNumber(stats.totalUnits, 3)}g</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Avg Buy Price</p>
          <p className="text-white font-semibold">{formatCurrency(stats.avgBuyPrice)}/g</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Current Value</p>
          <p className="text-white font-semibold">{formatCurrency(stats.currentValue)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">P&L</p>
          <p className={`font-semibold ${stats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
            <span className="text-xs ml-1">({formatPercent(stats.pnlPercent)})</span>
          </p>
        </div>
      </div>

      {stats.xirr !== null && (
        <div className={`text-sm font-medium ${stats.xirr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          XIRR: {formatXIRR(stats.xirr)}
        </div>
      )}
    </div>
  );
}

export default function GoldSilver() {
  const { data, getAssetStats, prices, addAsset } = usePortfolio();
  const [txModal, setTxModal] = useState(null); // 'gold' | 'silver'

  // For gold/silver we use a single "virtual" asset per metal type
  const getOrCreateMetal = (type) => {
    const existing = (data[type] || [])[0];
    return existing || null;
  };

  const goldAsset = getOrCreateMetal('gold');
  const silverAsset = getOrCreateMetal('silver');

  const goldStats = goldAsset ? getAssetStats(goldAsset, 'gold') : { totalUnits: 0, avgBuyPrice: 0, currentValue: 0, investedValue: 0, pnl: 0, pnlPercent: 0, xirr: null };
  const silverStats = silverAsset ? getAssetStats(silverAsset, 'silver') : { totalUnits: 0, avgBuyPrice: 0, currentValue: 0, investedValue: 0, pnl: 0, pnlPercent: 0, xirr: null };

  const handleOpenTx = async (type) => {
    // Ensure the metal asset exists
    let asset = getOrCreateMetal(type);
    if (!asset) {
      asset = await addAsset(type, { name: type === 'gold' ? 'Gold Holdings' : 'Silver Holdings', category: type, transactions: [] });
    }
    setTxModal(type);
  };

  const goldForTx = (data.gold || [])[0] || null;
  const silverForTx = (data.silver || [])[0] || null;

  return (
    <div className="space-y-4">
      <MetalSummaryCard
        type="gold"
        data={data.gold}
        stats={goldStats}
        prices={prices}
        onAddTx={() => handleOpenTx('gold')}
        icon="🥇"
        color="amber"
      />
      <MetalSummaryCard
        type="silver"
        data={data.silver}
        stats={silverStats}
        prices={prices}
        onAddTx={() => handleOpenTx('silver')}
        icon="🥈"
        color="slate"
      />

      {txModal === 'gold' && goldForTx && (
        <TransactionModal isOpen onClose={() => setTxModal(null)} asset={goldForTx} category="gold" />
      )}
      {txModal === 'silver' && silverForTx && (
        <TransactionModal isOpen onClose={() => setTxModal(null)} asset={silverForTx} category="silver" />
      )}
    </div>
  );
}
