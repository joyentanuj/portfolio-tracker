import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency } from '../../utils/formatters';

const KEY = 'portfolio_tracker_goals';

function monthsUntil(date) {
  const target = new Date(date);
  const now = new Date();
  return Math.max(1, Math.round((target - now) / (1000 * 60 * 60 * 24 * 30.4)));
}

export default function GoalsTracker() {
  const { getPortfolioStats } = usePortfolio();
  const stats = getPortfolioStats();
  const [goals, setGoals] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(goals));
  }, [goals]);

  const openNew = () => setForm({ id: null, name: '', targetAmount: '', targetDate: '', currentAllocation: '' });
  const save = () => {
    if (!form?.name || !form.targetAmount || !form.targetDate) return;
    if (form.id) {
      setGoals(prev => prev.map(g => g.id === form.id ? { ...form, targetAmount: Number(form.targetAmount), currentAllocation: Number(form.currentAllocation || 0) } : g));
    } else {
      setGoals(prev => [...prev, { ...form, id: `${Date.now()}`, targetAmount: Number(form.targetAmount), currentAllocation: Number(form.currentAllocation || 0) }]);
    }
    setForm(null);
  };

  const portfolioValue = stats.totalValue || 0;
  const enriched = useMemo(() => goals.map(g => {
    const allocated = g.currentAllocation > 0 ? g.currentAllocation : portfolioValue * 0.1;
    const progress = Math.min(100, (allocated / g.targetAmount) * 100);
    const m = monthsUntil(g.targetDate);
    const monthlyRequired = Math.max(0, (g.targetAmount - allocated) / m);
    return { ...g, allocated, progress, monthlyRequired, months: m };
  }), [goals, portfolioValue]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={openNew} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white"><Plus className="w-3.5 h-3.5" />Add Goal</button>
      </div>

      {enriched.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No goals yet. Add one to start planning.</p>}

      {enriched.map(goal => (
        <div key={goal.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{goal.name}</p>
              <p className="text-gray-500 dark:text-gray-400">Target: {formatCurrency(goal.targetAmount)} by {new Date(goal.targetDate).toLocaleDateString('en-IN')}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setForm(goal)} className="p-1 text-gray-400 hover:text-indigo-600"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => setGoals(prev => prev.filter(g => g.id !== goal.id))} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${goal.progress}%` }} /></div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>{goal.progress.toFixed(1)}% complete</span>
            <span>Need {formatCurrency(goal.monthlyRequired)}/month • {goal.months} months left</span>
          </div>
        </div>
      ))}

      {form && (
        <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <input placeholder="Goal name" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
          <input type="number" placeholder="Target amount" value={form.targetAmount} onChange={e => setForm(prev => ({ ...prev, targetAmount: e.target.value }))} className="px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
          <input type="date" min={new Date().toISOString().split('T')[0]} value={form.targetDate} onChange={e => setForm(prev => ({ ...prev, targetDate: e.target.value }))} className="px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
          <input type="number" placeholder="Current allocation (optional)" value={form.currentAllocation} onChange={e => setForm(prev => ({ ...prev, currentAllocation: e.target.value }))} className="px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700" />
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <button onClick={() => setForm(null)} className="px-2.5 py-1.5 rounded border border-gray-200 dark:border-gray-600">Cancel</button>
            <button onClick={save} className="px-2.5 py-1.5 rounded bg-indigo-600 text-white">Save goal</button>
          </div>
        </div>
      )}
    </div>
  );
}
