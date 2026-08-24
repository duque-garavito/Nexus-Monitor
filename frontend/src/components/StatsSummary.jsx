import React from 'react';

export default function StatsSummary({ devices }) {
  const total = devices.length;
  const online = devices.filter(d => d.status?.toLowerCase() === 'online').length;
  const offline = devices.filter(d => d.status?.toLowerCase() === 'offline').length;
  
  const healthRate = total > 0 ? Math.round((online / total) * 100) : 100;

  return (
    <div className="zbx-stats-bar">
      <div className="zbx-stat-item">
        <span className="zbx-stat-title">System status</span>
        <span className="zbx-stat-number" style={{ color: '#34c749' }}>
          OK
        </span>
      </div>

      <div className="zbx-stat-item">
        <span className="zbx-stat-title">Total Hosts</span>
        <span className="zbx-stat-number">{total}</span>
      </div>

      <div className="zbx-stat-item">
        <span className="zbx-stat-title">Online Hosts</span>
        <span className="zbx-stat-number text-green">{online}</span>
      </div>

      <div className="zbx-stat-item">
        <span className="zbx-stat-title">Offline Hosts</span>
        <span className="zbx-stat-number text-red">{offline}</span>
      </div>

      <div className="zbx-stat-item">
        <span className="zbx-stat-title">Overall Health</span>
        <span className="zbx-stat-number text-cyan">{healthRate}%</span>
      </div>
    </div>
  );
}
