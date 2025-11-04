interface PredictiveInsightsProps {
  predictions: Array<{
    title: string;
    description: string;
    confidence: number;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export default function PredictiveInsights({ predictions }: PredictiveInsightsProps) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {predictions.map((prediction, idx) => (
        <div
          key={idx}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h4 className="font-semibold text-gray-900">{prediction.title}</h4>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{prediction.description}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getImpactColor(prediction.impact)}`}>
              {prediction.impact.toUpperCase()}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Confidence Level</span>
                <span className="font-semibold text-gray-900">{prediction.confidence}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-2 shadow-inner">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out"
                  style={{ width: `${prediction.confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
