import React from 'react';
import Card from '../components/Common/Card';
import WatchlistTable from '../components/Watchlist/WatchlistTable';

export default function Watchlist() {
  return (
    <div className="space-y-6">
      <Card title="Watchlist">
        <WatchlistTable />
      </Card>
    </div>
  );
}
