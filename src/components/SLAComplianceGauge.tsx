interface SLAComplianceGaugeProps {
  percentage: number;
  target: number;
  breaches: number;
  approaching: number;
}

export default function SLAComplianceGauge({
  percentage,
  target,
  breaches,
  approaching,
}: SLAComplianceGaugeProps) {
  const getStatusColor = () => {
    if (percentage >= target) return { main: '#10b981', bg: 'bg-green-500', text: 'text-green-600' };
    if (percentage >= target - 5) return { main: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-600' };
    return { main: '#ef4444', bg: 'bg-red-500', text: 'text-red-600' };
  };

  const colors = getStatusColor();
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">SLA Compliance</h3>
      <p className="text-sm text-gray-600 mb-6">24-hour resolution target</p>

      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="#e5e7eb"
              strokeWidth="16"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke={colors.main}
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold ${colors.text}`}>{percentage}%</div>
            <div className="text-xs text-gray-500 mt-1">Compliant</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Target</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{target}%</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-red-700">SLA Breaches</span>
          </div>
          <span className="text-sm font-semibold text-red-700">{breaches}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-amber-700">Approaching SLA</span>
          </div>
          <span className="text-sm font-semibold text-amber-700">{approaching}</span>
        </div>
      </div>
    </div>
  );
}
