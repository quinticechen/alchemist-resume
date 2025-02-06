import React from 'react';

interface UsageStatsProps {
  usageCount: number;
}

const UsageStats = ({ usageCount }: UsageStatsProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-apple mb-8">
      <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
      <p className="text-neutral-600">
        Remaining Free Uses: <span className="font-semibold text-primary">{3 - usageCount}</span>
      </p>
    </div>
  );
};

export default UsageStats;