interface RiskScoreCardProps {
  score: number;
  trend: 'up' | 'down' | 'stable';
  factors: Array<{ label: string; impact: number }>;
}

export default function RiskScoreCard({ score, trend, factors }: RiskScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-red-500', text: 'text-red-500', label: 'Critical' };
    if (score >= 60) return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'High' };
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Medium' };
    return { bg: 'bg-green-500', text: 'text-green-500', label: 'Low' };
  };

  const colors = getScoreColor(score);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Risk Score</h3>
          <p className="text-sm text-gray-600">Composite operational risk assessment</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} text-white`}>
          {colors.label} Risk
        </div>
      </div>

      <div className="flex items-end gap-6 mb-6">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
              className={`${colors.text} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${colors.text}`}>{score}</div>
              <div className="text-xs text-gray-500">/ 100</div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {factors.map((factor, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium text-gray-700">{factor.label}</span>
                <span className="text-xs font-semibold text-gray-900">{factor.impact}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${colors.bg} transition-all duration-700 ease-out`}
                  style={{ width: `${factor.impact}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500">Trend:</span>
        <div className="flex items-center gap-1">
          {trend === 'up' && (
            <>
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-red-500">Increasing</span>
            </>
          )}
          {trend === 'down' && (
            <>
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-green-500">Improving</span>
            </>
          )}
          {trend === 'stable' && (
            <>
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-gray-500">Stable</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
