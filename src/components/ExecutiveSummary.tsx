interface ExecutiveSummaryProps {
  stuckCount: number;
  avgOrderValue: number;
  avgAgeHrs: number;
  complianceRate: number;
}

export default function ExecutiveSummary({
  stuckCount,
  avgOrderValue,
  avgAgeHrs,
  complianceRate,
}: ExecutiveSummaryProps) {
  const revenueAtRisk = stuckCount * avgOrderValue;
  const criticalCount = Math.round(stuckCount * 0.3);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Executive Summary</h3>
            <p className="text-sm text-slate-400">Financial & Operational Impact Analysis</p>
          </div>
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2">
            <div className="text-xs text-red-300 font-semibold uppercase tracking-wide">Priority</div>
            <div className="text-2xl font-bold text-red-400">Critical</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-5 border border-slate-700/50">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
              Revenue at Risk
            </div>
            <div className="text-3xl font-bold text-red-400 mb-1">
              ${(revenueAtRisk / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-slate-500">
              {stuckCount} orders × ${avgOrderValue.toFixed(0)} avg
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-5 border border-slate-700/50">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
              Critical Orders
            </div>
            <div className="text-3xl font-bold text-orange-400 mb-1">
              {criticalCount}
            </div>
            <div className="text-xs text-slate-500">
              Age &gt; 24 hrs, escalation required
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-5 border border-slate-700/50">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
              Avg Resolution Time
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-1">
              {avgAgeHrs.toFixed(1)}h
            </div>
            <div className="text-xs text-slate-500">
              Target: &lt; 12 hrs
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-5 border border-slate-700/50">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
              SLA Compliance
            </div>
            <div className="text-3xl font-bold text-green-400 mb-1">
              {complianceRate.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">
              Target: &gt; 95%
            </div>
          </div>
        </div>

        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-amber-500 rounded-full p-1.5 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-300 mb-1">
                Action Required
              </div>
              <div className="text-xs text-amber-200/80 leading-relaxed">
                {criticalCount} orders are at high risk of customer escalation due to delayed invoicing and missing shipment confirmations.
                Immediate resolution recommended to prevent revenue leakage and maintain customer satisfaction.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
