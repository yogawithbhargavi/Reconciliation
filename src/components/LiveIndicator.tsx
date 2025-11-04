interface LiveIndicatorProps {
  lastUpdate: string;
}

export default function LiveIndicator({ lastUpdate }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
        <div className="relative">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
        </div>
        <span className="text-xs font-semibold text-green-700">Live Data</span>
      </div>
      <div className="text-xs text-gray-500">
        Last sync: {lastUpdate}
      </div>
    </div>
  );
}
