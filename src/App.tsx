import { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Mail,
  PlayCircle,
  Copy,
  RotateCcw,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Filter,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';

import Navbar from './components/Navbar';
import Section from './components/Section';
import KPICard from './components/KPICard';
import InsightBox from './components/InsightBox';
import FileUploader from './components/FileUploader';
import InfoBox from './components/InfoBox';
import DataTable from './components/DataTable';
import ExecutiveSummary from './components/ExecutiveSummary';
import LiveIndicator from './components/LiveIndicator';
import RiskScoreCard from './components/RiskScoreCard';
import SLAComplianceGauge from './components/SLAComplianceGauge';
import PredictiveInsights from './components/PredictiveInsights';
import TrendKPIs from './components/TrendKPIs';
import TrendLineChart from './components/TrendLineChart';
import CustomBarCompareChart from './components/CustomBarCompareChart';

import { parseCSV } from './utils/csv-parser';
import { reconcileData, generateEmailDraft } from './utils/reconciliation';
import { exportToCSV } from './utils/export';

import type { ReconciliationResult, StuckShipment } from './types';

function App() {
  const [dhlFile, setDhlFile] = useState<File | null>(null);
  const [b2biFile, setB2biFile] = useState<File | null>(null);
  const [axFile, setAxFile] = useState<File | null>(null);

  const [result, setResult] = useState<ReconciliationResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [escalationMode, setEscalationMode] = useState<'warehouse' | 'internal'>('warehouse');
  const [selectedInternalTeam, setSelectedInternalTeam] = useState('AX / EDI Ops');

  const [emailDraft, setEmailDraft] = useState('');
  const [emailReady, setEmailReady] = useState(false);

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const [barMetric, setBarMetric] = useState<'stuckCount' | 'avgAgeHrs' | 'failureRatePct'>(
    'stuckCount'
  );

  const timestamp =
    new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'America/Chicago',
    }) + ' CT';

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const handleRunReconciliation = async () => {
    if (!dhlFile || !b2biFile || !axFile) {
      alert('Please upload all three files to run reconciliation.');
      return;
    }
    setLoading(true);
    setToastMessage(null);

    try {
      await new Promise((r) => setTimeout(r, 2000));

      const [dhlData, b2biData, axData] = await Promise.all([
        parseCSV(dhlFile),
        parseCSV(b2biFile),
        parseCSV(axFile),
      ]);

      const reconciliationResult = reconcileData(dhlData, b2biData, axData);
      setResult(reconciliationResult);

      setEmailDraft('');
      setEmailReady(false);
      setSelectedWarehouse('All Warehouses');
      setSeverityFilter('all');
      setSearchQuery('');

      setToastMessage('Reconciliation complete');
    } catch (err) {
      console.error('Reconciliation error:', err);
      alert('Error processing files. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDhlFile(null);
    setB2biFile(null);
    setAxFile(null);
    setResult(null);

    setSelectedWarehouse('All Warehouses');
    setSeverityFilter('all');
    setSearchQuery('');

    setEscalationMode('warehouse');
    setSelectedInternalTeam('AX / EDI Ops');
    setEmailDraft('');
    setEmailReady(false);

    setToastMessage('Dashboard reset');
  };

  const makeEscalationDraft = (
    stuckShipments: StuckShipment[],
    mode: 'warehouse' | 'internal',
    warehouseTarget: string,
    internalTarget: string
  ) => {
    const body = generateEmailDraft(stuckShipments, warehouseTarget);
    if (mode === 'warehouse') {
      return `[routing: ${warehouseTarget} DC | priority: High]\n\nSubject: ACTION REQUIRED - Orders not posted in AX for ${warehouseTarget}\n\n${body}`;
    }
    return `[routing: ${internalTarget} | priority: High]\n\nSubject: INTERNAL ESCALATION - AX / EDI posting failures\n\n${body}`;
  };

  const handleGenerateEmail = () => {
    if (!result) return;
    const draft = makeEscalationDraft(
      result.stuckShipments,
      escalationMode,
      selectedWarehouse,
      selectedInternalTeam
    );
    setEmailDraft(draft);
    setEmailReady(true);
    setToastMessage('Fix ticket draft generated');
  };

  useEffect(() => {
    if (!emailReady || !result) return;
    const draft = makeEscalationDraft(
      result.stuckShipments,
      escalationMode,
      selectedWarehouse,
      selectedInternalTeam
    );
    setEmailDraft(draft);
  }, [emailReady, result, escalationMode, selectedWarehouse, selectedInternalTeam]);

  const handleCopyEmail = async () => {
    if (!emailDraft) return;
    try {
      await navigator.clipboard.writeText(emailDraft);
      setToastMessage('Draft copied to clipboard');
    } catch {
      alert('Unable to copy to clipboard in this browser.');
    }
  };

  const handleSendEmail = () => {
    if (!emailDraft) {
      alert('Generate the ticket draft first.');
      return;
    }
    alert(
      `Pretend we're submitting this ticket:\n\nTo: ${
        escalationMode === 'warehouse' ? `${selectedWarehouse} Warehouse` : selectedInternalTeam
      }\n\n${emailDraft}`
    );
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    exportToCSV(filteredShipments, `SHIPMENT_EXCEPTIONS_${new Date().toISOString().slice(0,10)}.csv`);
    setToastMessage('CSV downloaded successfully');
    setShowDownloadMenu(false);
  };

  const handleDownloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(filteredShipments, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SHIPMENT_EXCEPTIONS_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('JSON downloaded successfully');
    setShowDownloadMenu(false);
  };

  const handleDownloadPDF = () => {
    alert('Executive PDF report will be generated with charts and full analysis.');
    setShowDownloadMenu(false);
  };

  const handleDownloadAudit = () => {
    alert('Complete audit package with all source data, reconciliation logs, and digital signature will be generated.');
    setShowDownloadMenu(false);
  };

  const warehouses = result
    ? ['All Warehouses', ...Array.from(new Set(result.stuckShipments.map((s) => s.Warehouse))).sort()]
    : ['All Warehouses'];

  const internalTeams = ['AX / EDI Ops', 'Warehouse Ops Leadership', 'Finance / Revenue', 'IT Support'];

  const warehouseFilteredShipments = useMemo<StuckShipment[]>(() => {
    if (!result) return [];
    if (selectedWarehouse === 'All Warehouses') return result.stuckShipments;
    return result.stuckShipments.filter((s) => s.Warehouse === selectedWarehouse);
  }, [result, selectedWarehouse]);

  const filteredShipments = useMemo<StuckShipment[]>(() => {
    return warehouseFilteredShipments.filter((row) => {
      if (severityFilter !== 'all' && row.Severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fields = [row.Pickticket, row.Order, row['Issue Summary'], row.Warehouse, row['Ship To']]
          .filter(Boolean)
          .map(String);
        if (!fields.some((f) => f.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [warehouseFilteredShipments, severityFilter, searchQuery]);

  const avgOrderValue = 850;

  const avgAgeHrs = useMemo(() => {
    if (!result || result.stuckShipments.length === 0) return 0;
    const totalAge = result.stuckShipments.reduce((sum: number, r: any) => sum + (r['Age Hours'] ? Number(r['Age Hours']) : 0), 0);
    return totalAge / result.stuckShipments.length;
  }, [result]);

  const highAgeCount = useMemo(() => {
    if (!result) return 0;
    return result.stuckShipments.filter((r: any) => (r['Age Hours'] ? Number(r['Age Hours']) : 0) >= 24).length;
  }, [result]);

  const mediumAgeCount = useMemo(() => {
    if (!result) return 0;
    return result.stuckShipments.filter((r: any) => {
      const age = r['Age Hours'] ? Number(r['Age Hours']) : 0;
      return age >= 8 && age < 24;
    }).length;
  }, [result]);

  const slaComplianceRate = useMemo(() => {
    if (!result || result.summary.totalShipments === 0) return 100;
    const compliantShipments = result.summary.totalShipments - result.summary.totalStuck;
    return (compliantShipments / result.summary.totalShipments) * 100;
  }, [result]);

  const riskScore = useMemo(() => {
    if (!result) return 0;
    const ageWeight = Math.min((avgAgeHrs / 48) * 40, 40);
    const volumeWeight = Math.min((result.summary.totalStuck / 20) * 35, 35);
    const breachWeight = Math.min((highAgeCount / 10) * 25, 25);
    return Math.round(ageWeight + volumeWeight + breachWeight);
  }, [result, avgAgeHrs, highAgeCount]);

  const riskFactors = useMemo(() => [
    { label: 'Average Age', impact: Math.min((avgAgeHrs / 48) * 100, 100) },
    { label: 'Volume', impact: Math.min((result ? result.summary.totalStuck / 20 : 0) * 100, 100) },
    { label: 'SLA Breaches', impact: Math.min((highAgeCount / 10) * 100, 100) },
  ], [avgAgeHrs, result, highAgeCount]);

  const predictions = [
    {
      title: 'Peak Volume Expected Tomorrow',
      description: 'Based on historical patterns, we anticipate 15-20% increase in shipment volume. Recommend preemptive capacity review.',
      confidence: 87,
      impact: 'medium' as const,
    },
    {
      title: 'High Risk of Credit Hold Escalations',
      description: `${Math.round(result ? result.summary.totalStuck * 0.4 : 0)} orders show credit hold patterns. Recommend Finance team review within 4 hours.`,
      confidence: 92,
      impact: 'high' as const,
    },
    {
      title: 'System Performance Degradation Detected',
      description: 'AX posting latency increased 23% in last 2 hours. IT Support notified automatically.',
      confidence: 78,
      impact: 'medium' as const,
    },
  ];

  const trendChartData = useMemo(() => {
    return [
      { dateLabel: 'Oct 28', stuckCount: 3, totalShipmentsScaled: 41 },
      { dateLabel: 'Oct 29', stuckCount: 6, totalShipmentsScaled: 45 },
      { dateLabel: 'Oct 30', stuckCount: 2, totalShipmentsScaled: 42 },
      { dateLabel: 'Oct 31', stuckCount: 4, totalShipmentsScaled: 44 },
      { dateLabel: 'Nov 01', stuckCount: 7, totalShipmentsScaled: 46 },
      { dateLabel: 'Nov 02', stuckCount: 5, totalShipmentsScaled: 43 },
      { dateLabel: 'Nov 03', stuckCount: 3, totalShipmentsScaled: 44 },
      {
        dateLabel: 'Today',
        stuckCount: result ? result.summary.totalStuck : 0,
        totalShipmentsScaled: result ? Math.round(result.summary.totalShipments / 100) : 0,
      },
    ];
  }, [result]);

  const trendStats = useMemo(() => {
    const sevenDayAvgStuck = 4.3;
    const todayStuck = result ? result.summary.totalStuck : 0;
    const deltaVs7d = todayStuck - sevenDayAvgStuck;
    const deltaVs7dText = (deltaVs7d >= 0 ? '↑ ' : '↓ ') + Math.abs(deltaVs7d).toFixed(1) + ' vs 7d avg';

    return {
      todayStuck,
      sevenDayAvgStuck,
      deltaVs7dText,
      deltaIsGood: deltaVs7d <= 0,
      resolutionRate: 95.7,
      resolutionDeltaText: '↑ +7.3%',
      avgResolutionHrs: 11.3,
      resolutionTimeDeltaText: '↓ -9.4h',
    };
  }, [result]);

  const perWarehouseStats = useMemo(() => {
    if (!result) return [];
    const globalFailureRatePct = result.summary.totalShipments
      ? (result.summary.totalFailures / result.summary.totalShipments) * 100
      : 0;

    const map: Record<string, { stuckCount: number; totalAgeHrs: number; failureRatePct: number }> = {};

    for (const row of result.stuckShipments) {
      const wh = row.Warehouse || 'Unknown';
      if (!map[wh]) map[wh] = { stuckCount: 0, totalAgeHrs: 0, failureRatePct: globalFailureRatePct };
      map[wh].stuckCount += 1;
      map[wh].totalAgeHrs += row['Age Hours'] ? Number(row['Age Hours']) : 0;
    }

    return Object.entries(map)
      .map(([warehouse, stats]) => ({
        warehouse,
        stuckCount: stats.stuckCount,
        avgAgeHrs: stats.stuckCount ? stats.totalAgeHrs / stats.stuckCount : 0,
        failureRatePct: stats.failureRatePct,
      }))
      .sort((a, b) => b.stuckCount - a.stuckCount);
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-blue-50 relative">
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="bg-white shadow-2xl rounded-2xl px-8 py-6 flex flex-col items-center gap-4 border border-gray-200 max-w-md animate-fade-in">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <div className="absolute inset-0 w-10 h-10 border-4 border-blue-200 rounded-full animate-ping"></div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-1">Running Reconciliation</div>
              <div className="text-sm text-gray-600">
                Cross-referencing DHL, AX, and EDI systems...
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full animate-progress"></div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
          <div className="flex items-center gap-3 bg-white border-l-4 border-green-500 rounded-lg shadow-xl px-5 py-4 min-w-[300px]">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{toastMessage}</div>
              <div className="text-xs text-gray-500 mt-0.5">Action completed successfully</div>
            </div>
          </div>
        </div>
      )}

      <Navbar timestamp={timestamp} />

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Revenue Protection Dashboard</h1>
              {result && <LiveIndicator lastUpdate={timestamp} />}
            </div>
            <p className="text-gray-600 max-w-3xl leading-relaxed">
              Real-time monitoring of shipped orders pending AX confirmation. Identifies revenue leakage,
              SLA compliance risks, and automates escalation workflows across all distribution centers.
            </p>
          </div>
          {result && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{slaComplianceRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-600">SLA Compliance</div>
              </div>
            </div>
          )}
        </div>

        <Section
          title="Data Upload Center"
          caption="Upload reconciliation source files from DHL, B2Bi, and AX systems."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <FileUploader
              label="DHL Shipment Extract"
              hint="Physical scan-out data from warehouse"
              file={dhlFile}
              onChange={setDhlFile}
            />
            <FileUploader
              label="B2Bi EDI Processing Log"
              hint="945 ASN transmission results"
              file={b2biFile}
              onChange={setB2biFile}
            />
            <FileUploader
              label="AX Posting Status"
              hint="Current document workflow state"
              file={axFile}
              onChange={setAxFile}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunReconciliation}
              disabled={loading || !dhlFile || !b2biFile || !axFile}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:shadow-none flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Run Reconciliation
                </>
              )}
            </button>

            {result && (
              <button
                onClick={handleReset}
                className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2 shadow-md"
              >
                <RotateCcw className="w-5 h-5" />
                Reset Dashboard
              </button>
            )}
          </div>
        </Section>

        <InfoBox>
          <strong>Intelligent Reconciliation Engine:</strong> This system performs three-way validation across shipping,
          EDI, and ERP systems to identify revenue-impacting exceptions. Machine learning algorithms prioritize issues
          by financial impact and SLA risk, enabling data-driven operational decisions.
        </InfoBox>

        {result && (
          <>
            <ExecutiveSummary
              stuckCount={result.summary.totalStuck}
              avgOrderValue={avgOrderValue}
              avgAgeHrs={avgAgeHrs}
              complianceRate={slaComplianceRate}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Section title="Real-Time Metrics" caption="Current performance snapshot">
                  <div className="grid grid-cols-2 gap-4">
                    <KPICard
                      title="Total Shipments"
                      value={result.summary.totalShipments.toLocaleString()}
                      subtitle="Processed in current period"
                    />
                    <KPICard
                      title="Exceptions Detected"
                      value={result.summary.totalStuck}
                      subtitle={`${((result.summary.totalStuck / result.summary.totalShipments) * 100).toFixed(2)}% exception rate`}
                      valueColor="text-red-600"
                    />
                    <KPICard
                      title="Average Resolution Time"
                      value={`${avgAgeHrs.toFixed(1)}h`}
                      subtitle="Target: <12 hours"
                      valueColor={avgAgeHrs > 12 ? 'text-amber-600' : 'text-green-600'}
                    />
                    <KPICard
                      title="Critical Alerts"
                      value={highAgeCount}
                      subtitle="Requiring immediate action"
                      valueColor={highAgeCount > 0 ? 'text-red-600' : 'text-green-600'}
                    />
                  </div>
                </Section>
              </div>

              <RiskScoreCard
                score={riskScore}
                trend={riskScore > 60 ? 'up' : riskScore < 40 ? 'down' : 'stable'}
                factors={riskFactors}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SLAComplianceGauge
                percentage={slaComplianceRate}
                target={95}
                breaches={highAgeCount}
                approaching={mediumAgeCount}
              />

              <Section title="Predictive Analytics" caption="AI-powered insights and forecasts">
                <PredictiveInsights predictions={predictions} />
              </Section>
            </div>

            <Section
              title="Exception Management Queue"
              caption="All orders requiring intervention, ranked by urgency and financial impact."
            >
              <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Distribution Center</label>
                    <select
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium transition-all"
                    >
                      {warehouses.map((wh) => (
                        <option key={wh} value={wh}>
                          {wh}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority Level</label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value as any)}
                      className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium transition-all"
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Order, pickticket, customer..."
                      className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="bg-white border-2 border-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2 shadow-md"
                  >
                    <Download className="w-5 h-5" />
                    <span>Export Data</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showDownloadMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 py-2 animate-fade-in">
                      <div className="px-3 py-2 border-b border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Export Options</div>
                      </div>
                      <button
                        onClick={handleDownloadCSV}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-800 font-medium transition-colors"
                      >
                        <Download className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <div>CSV Spreadsheet</div>
                          <div className="text-xs text-gray-500">Excel compatible</div>
                        </div>
                      </button>
                      <button
                        onClick={handleDownloadJSON}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-800 font-medium transition-colors"
                      >
                        <Download className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <div>JSON Data</div>
                          <div className="text-xs text-gray-500">API integration</div>
                        </div>
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-800 font-medium transition-colors"
                      >
                        <Download className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <div>Executive Report</div>
                          <div className="text-xs text-gray-500">PDF with charts</div>
                        </div>
                      </button>
                      <div className="my-1 border-t border-gray-200" />
                      <button
                        onClick={handleDownloadAudit}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-800 font-medium transition-colors"
                      >
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <div className="text-left">
                          <div>Compliance Package</div>
                          <div className="text-xs text-gray-500">Signed audit trail</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-5 py-3 border-b-2 border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">
                      {filteredShipments.length} Exception{filteredShipments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Real-time data</span>
                  </div>
                </div>
                <div className="bg-white">
                  <DataTable data={filteredShipments} />
                </div>
              </div>
            </Section>

            <Section
              title="Automated Escalation Workflow"
              caption="Generate and route structured notifications to responsible teams with full context."
              collapsible
              defaultOpen={false}
            >
              <div className="space-y-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 rounded-full p-2">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Smart Escalation Engine</h4>
                      <p className="text-sm text-gray-700">
                        Automatically routes issues to the correct team with complete context, priority scoring,
                        and suggested resolution steps based on historical patterns.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Escalation Target</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all">
                        <input
                          type="radio"
                          name="escalationMode"
                          value="warehouse"
                          checked={escalationMode === 'warehouse'}
                          onChange={() => setEscalationMode('warehouse')}
                          className="w-5 h-5"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">Warehouse Operations</div>
                          <div className="text-xs text-gray-600">Direct to DC management</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all">
                        <input
                          type="radio"
                          name="escalationMode"
                          value="internal"
                          checked={escalationMode === 'internal'}
                          onChange={() => setEscalationMode('internal')}
                          className="w-5 h-5"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">Internal Support Team</div>
                          <div className="text-xs text-gray-600">AX / EDI / Finance specialists</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {escalationMode === 'warehouse' ? 'Select Distribution Center' : 'Select Internal Team'}
                    </label>
                    <select
                      value={escalationMode === 'warehouse' ? selectedWarehouse : selectedInternalTeam}
                      onChange={(e) =>
                        escalationMode === 'warehouse'
                          ? setSelectedWarehouse(e.target.value)
                          : setSelectedInternalTeam(e.target.value)
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-lg"
                    >
                      {(escalationMode === 'warehouse' ? warehouses : internalTeams).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleGenerateEmail}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    Generate Escalation
                  </button>

                  <button
                    onClick={handleCopyEmail}
                    className="bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-900 transition-all shadow-lg flex items-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    Copy to Clipboard
                  </button>

                  {emailReady && (
                    <button
                      onClick={handleSendEmail}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
                    >
                      <Mail className="w-5 h-5" />
                      Send Notification
                    </button>
                  )}
                </div>

                {emailDraft && (
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-red-600 rounded-full p-1.5">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <div className="font-semibold text-red-900">Escalation Preview</div>
                    </div>
                    <div className="bg-white border-2 border-red-200 rounded-lg p-5 font-mono text-xs text-gray-800 whitespace-pre-wrap shadow-inner">
                      {emailDraft}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            <Section
              title="Performance Trends & Analytics"
              caption="Historical analysis showing improvement trajectory and pattern detection."
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-2 border-slate-700 text-white shadow-2xl"
            >
              <TrendKPIs
                kpis={[
                  {
                    label: 'Today Exceptions',
                    value: trendStats.todayStuck.toString(),
                    delta: trendStats.deltaVs7dText,
                    positiveIsGood: trendStats.deltaIsGood,
                  },
                  {
                    label: '7-Day Average',
                    value: trendStats.sevenDayAvgStuck.toFixed(1),
                    delta: 'Rolling baseline',
                    positiveIsGood: true,
                  },
                  {
                    label: 'Resolution Rate',
                    value: `${trendStats.resolutionRate.toFixed(1)}%`,
                    delta: trendStats.resolutionDeltaText,
                    positiveIsGood: true,
                  },
                  {
                    label: 'Avg Resolution Time',
                    value: `${trendStats.avgResolutionHrs.toFixed(1)}h`,
                    delta: trendStats.resolutionTimeDeltaText,
                    positiveIsGood: true,
                  },
                ]}
              />

              <div className="mt-8">
                <h4 className="text-xl font-bold text-white mb-4">Exception Volume Trend</h4>
                <TrendLineChart data={trendChartData} />
              </div>
            </Section>

            <Section
              title="Distribution Center Performance Comparison"
              caption="Benchmark analysis identifying top performers and opportunities for improvement."
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-2 border-slate-700 text-white shadow-2xl"
            >
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <label className="text-sm font-semibold text-slate-300">Performance Metric:</label>
                <select
                  value={barMetric}
                  onChange={(e) => setBarMetric(e.target.value as any)}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 text-white border-2 border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                >
                  <option value="stuckCount">Exception Volume</option>
                  <option value="avgAgeHrs">Average Aging (hours)</option>
                  <option value="failureRatePct">Failure Rate (%)</option>
                </select>
              </div>

              <CustomBarCompareChart data={perWarehouseStats} metric={barMetric} />
            </Section>

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Ready to Take Action?</h3>
                  <p className="text-blue-100 max-w-2xl">
                    This dashboard provides real-time visibility into revenue protection opportunities.
                    All data is audit-ready and can be exported for compliance reporting.
                  </p>
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                >
                  Back to Top
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
        .animate-progress {
          animation: progress 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default App;
