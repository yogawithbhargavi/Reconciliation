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
} from 'lucide-react';

import Navbar from './components/Navbar';
import Section from './components/Section';
import KPICard from './components/KPICard';
import InsightBox from './components/InsightBox';
import FileUploader from './components/FileUploader';
import InfoBox from './components/InfoBox';
import DataTable from './components/DataTable';

// analytics / charts
import TrendKPIs from './components/TrendKPIs';
import TrendLineChart from './components/TrendLineChart';
import CustomBarCompareChart from './components/CustomBarCompareChart'; // NEW

import { parseCSV } from './utils/csv-parser';
import { reconcileData, generateEmailDraft } from './utils/reconciliation';
import { exportToCSV } from './utils/export';

import type { ReconciliationResult, StuckShipment } from './types';

function App() {
  // -------------------------------------------------
  // STATE
  // -------------------------------------------------

  // file inputs
  const [dhlFile, setDhlFile] = useState<File | null>(null);
  const [b2biFile, setB2biFile] = useState<File | null>(null);
  const [axFile, setAxFile] = useState<File | null>(null);

  // result after reconciliation
  const [result, setResult] = useState<ReconciliationResult | null>(null);

  // UI/UX states
  const [loading, setLoading] = useState(false); // true while running
  const [toastMessage, setToastMessage] = useState<string | null>(null); // success toasts

  // filters for table / escalation
  const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses');

  // filtering inside the table section
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // escalation controls
  const [escalationMode, setEscalationMode] = useState<'warehouse' | 'internal'>('warehouse');
  const [selectedInternalTeam, setSelectedInternalTeam] = useState('AX / EDI Ops');

  // email draft + workflow state
  const [emailDraft, setEmailDraft] = useState('');
  const [emailReady, setEmailReady] = useState(false); // controls when "Send Email" shows

  // dropdown menu for download options
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // comparison chart controls
  const [barMetric, setBarMetric] = useState<'stuckCount' | 'avgAgeHrs' | 'failureRatePct'>('stuckCount');

  // Timestamp for navbar + snapshot
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

  // auto-hide toast after a few seconds
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // -------------------------------------------------
  // HANDLERS
  // -------------------------------------------------

  // Run reconciliation with "running..." overlay and small delay
  const handleRunReconciliation = async () => {
    if (!dhlFile || !b2biFile || !axFile) {
      alert('Please upload all three files to run reconciliation.');
      return;
    }

    setLoading(true);
    setToastMessage(null);

    try {
      // artificial delay so ops can SEE the progress state
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const [dhlData, b2biData, axData] = await Promise.all([
        parseCSV(dhlFile),
        parseCSV(b2biFile),
        parseCSV(axFile),
      ]);

      const reconciliationResult = reconcileData(dhlData, b2biData, axData);

      setResult(reconciliationResult);

      // clear old email state when re-running
      setEmailDraft('');
      setEmailReady(false);

      // show toast that it worked
      setToastMessage('Reconciliation complete');
    } catch (err) {
      console.error('Reconciliation error:', err);
      alert('Error processing files. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Reset the whole dashboard back to pre-run
  const handleReset = () => {
    setDhlFile(null);
    setB2biFile(null);
    setAxFile(null);

    setResult(null);
    setEmailDraft('');
    setEmailReady(false);

    setSelectedWarehouse('All Warehouses');
    setEscalationMode('warehouse');
    setSelectedInternalTeam('AX / EDI Ops');
    setSearchQuery('');
    setSeverityFilter('all');

    setToastMessage('Dashboard reset');
  };

  // Generate escalation email (this "locks in" the preview)
  const handleGenerateEmail = () => {
    if (!result) return;

    const baseDraft = generateEmailDraft(result.stuckShipments, selectedWarehouse);
    const fullDraft =
      escalationMode === 'warehouse'
        ? `Subject: ACTION REQUIRED - Orders not posted in AX for ${selectedWarehouse}\n\n${baseDraft}`
        : `Subject: INTERNAL ESCALATION - Support needed from ${selectedInternalTeam}\n\n${baseDraft}`;

    setEmailDraft(fullDraft);
    setEmailReady(true);
    setToastMessage('Draft generated');
  };

  // keep draft updated LIVE as they change mode/warehouse/team
  useEffect(() => {
    if (!emailReady || !result) return;
    const baseDraft = generateEmailDraft(result.stuckShipments, selectedWarehouse);
    const fullDraft =
      escalationMode === 'warehouse'
        ? `Subject: ACTION REQUIRED - Orders not posted in AX for ${selectedWarehouse}\n\n${baseDraft}`
        : `Subject: INTERNAL ESCALATION - Support needed from ${selectedInternalTeam}\n\n${baseDraft}`;
    setEmailDraft(fullDraft);
  }, [emailReady, result, escalationMode, selectedWarehouse, selectedInternalTeam]);

  // Copy email text
  const handleCopyEmail = async () => {
    if (!emailDraft) return;
    try {
      await navigator.clipboard.writeText(emailDraft);
      setToastMessage('Email draft copied');
    } catch {
      alert('Unable to copy to clipboard in this browser.');
    }
  };

  // Send email (only shows after Generate)
  const handleSendEmail = () => {
    if (!emailDraft) {
      alert('Generate the email draft first.');
      return;
    }
    alert(
      `Pretend we're sending this email:\n\nTo: ${
        escalationMode === 'warehouse'
          ? `${selectedWarehouse} Warehouse`
          : selectedInternalTeam
      }\n\n${emailDraft}`
    );
  };

  // -------------------------------------------------
  // DOWNLOAD HANDLERS (CSV / JSON / PDF)
  // -------------------------------------------------

  const handleDownloadCSV = () => {
    if (!result) return;
    const today = new Date()
      .toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
      })
      .replace(/\//g, '');
    exportToCSV(filteredShipments, `MISSING_945_${today}.csv`);
    setToastMessage('CSV downloaded');
    setShowDownloadMenu(false);
  };

  const handleDownloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(filteredShipments, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.download = `MISSING_945_${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('JSON downloaded');
    setShowDownloadMenu(false);
  };

  const handleDownloadPDF = () => {
    alert('PDF export coming soon (full styled report).');
    setShowDownloadMenu(false);
  };

  // -------------------------------------------------
  // DERIVED DATA (WAREHOUSES, FILTERS, STATS)
  // -------------------------------------------------

  // warehouses list
  const warehouses = result
    ? [
        'All Warehouses',
        ...Array.from(new Set(result.stuckShipments.map((s) => s.Warehouse))).sort(),
      ]
    : ['All Warehouses'];

  // internal teams list
  const internalTeams = [
    'AX / EDI Ops',
    'Warehouse Ops Leadership',
    'Finance / Revenue',
    'IT Support',
  ];

  // shipments filtered by warehouse
  const warehouseFilteredShipments = useMemo<StuckShipment[]>(() => {
    if (!result) return [];
    if (selectedWarehouse === 'All Warehouses') {
      return result.stuckShipments;
    }
    return result.stuckShipments.filter((s) => s.Warehouse === selectedWarehouse);
  }, [result, selectedWarehouse]);

  // then apply severity + free-text search filters
  const filteredShipments = useMemo<StuckShipment[]>(() => {
    return warehouseFilteredShipments.filter((row) => {
      // severity filter
      if (severityFilter !== 'all') {
        if (row.Severity !== severityFilter) {
          return false;
        }
      }

      // text search on Pickticket / Order / Issue Summary
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fieldsToSearch = [
          row.Pickticket,
          row.Order,
          row['Issue Summary'],
          row.Warehouse,
          row['Ship To'],
        ]
          .filter(Boolean)
          .map(String);

        const hit = fieldsToSearch.some((field) =>
          field.toLowerCase().includes(q)
        );
        if (!hit) return false;
      }

      return true;
    });
  }, [warehouseFilteredShipments, severityFilter, searchQuery]);

  // overall stats
  const overallStats = useMemo(() => {
    if (!result) {
      return {
        stuckCount: 0,
        avgAgeHrs: 0,
        failureRatePct: 0,
      };
    }

    const totalAgeHrs = result.stuckShipments.reduce((sum: number, row: any) => {
      return sum + (row.AgeHours ? Number(row.AgeHours) : 0);
    }, 0);

    const stuckCount = result.stuckShipments.length;
    const avgAgeHrs = stuckCount > 0 ? totalAgeHrs / stuckCount : 0;

    const failureRatePct =
      result.summary.totalShipments > 0
        ? (result.summary.totalFailures / result.summary.totalShipments) * 100
        : 0;

    return {
      stuckCount,
      avgAgeHrs,
      failureRatePct,
    };
  }, [result]);

  // per-warehouse rollup for the comparison bar chart
  // we compute stuckCount / avgAgeHrs / failureRatePct for each warehouse
  const perWarehouseStats = useMemo(() => {
    if (!result) return [];

    const map: Record<
      string,
      { stuckCount: number; totalAgeHrs: number; failureRatePct: number }
    > = {};

    // For now failureRatePct is global — you can extend reconciliation() to include per-WH failure data.
    const globalFailureRatePct =
      result.summary.totalShipments > 0
        ? (result.summary.totalFailures / result.summary.totalShipments) * 100
        : 0;

    for (const row of result.stuckShipments) {
      const wh = row.Warehouse || 'Unknown';
      if (!map[wh]) {
        map[wh] = {
          stuckCount: 0,
          totalAgeHrs: 0,
          failureRatePct: globalFailureRatePct,
        };
      }
      map[wh].stuckCount += 1;
      map[wh].totalAgeHrs += row.AgeHours ? Number(row.AgeHours) : 0;
    }

    const out = Object.entries(map).map(([warehouse, stats]) => {
      const avgAgeHrs =
        stats.stuckCount > 0 ? stats.totalAgeHrs / stats.stuckCount : 0;
      return {
        warehouse,
        stuckCount: stats.stuckCount,
        avgAgeHrs,
        failureRatePct: stats.failureRatePct,
      };
    });

    return out.sort((a, b) => b.stuckCount - a.stuckCount);
  }, [result]);

  // -------------------------------------------------
  // TREND DATA (INCL. TODAY + COMPARISON)
  // -------------------------------------------------

  // Mock trend including "Today" at the end.
  // In production you'll pull rolling daily snapshots.
  const trendChartData = useMemo(() => {
    return [
      { dateLabel: 'Oct 24', stuckCount: 0, totalShipmentsScaled: 45 },
      { dateLabel: 'Oct 25', stuckCount: 5, totalShipmentsScaled: 44 },
      { dateLabel: 'Oct 26', stuckCount: 5, totalShipmentsScaled: 43 },
      { dateLabel: 'Oct 27', stuckCount: 4, totalShipmentsScaled: 44 },
      { dateLabel: 'Oct 28', stuckCount: 3, totalShipmentsScaled: 41 },
      { dateLabel: 'Oct 29', stuckCount: 6, totalShipmentsScaled: 45 },
      { dateLabel: 'Oct 30', stuckCount: 2, totalShipmentsScaled: 42 },
      {
        dateLabel: 'Today',
        stuckCount: result ? result.summary.totalStuck : 0,
        totalShipmentsScaled: result
          ? result.summary.totalShipments
          : 0,
      },
    ];
  }, [result]);

  // Build comparison stats for TrendKPIs.
  // We'll compare "today" vs trailing 7-day avg.
  const trendStats = useMemo(() => {
    // fake historical averages for now (you'll compute these from real data later)
    const sevenDayAvgStuck = 3.9;
    const todayStuck = result ? result.summary.totalStuck : 0;
    const deltaVs7d = todayStuck - sevenDayAvgStuck;
    const deltaVs7dText =
      (deltaVs7d >= 0 ? '↑ ' : '↓ ') +
      Math.abs(deltaVs7d).toFixed(1) +
      ' vs 7d avg';

    return {
      todayStuck,
      sevenDayAvgStuck,
      deltaVs7dText,
      deltaIsGood: deltaVs7d <= 0, // if today <= avg, good

      resolutionRate: 95.7,
      resolutionDeltaText: '↑ +7.3%',

      avgDailyVolume: 4339,
      volumeDeltaText: '↓ -0.6%',

      avgResolutionHrs: 11.3,
      resolutionTimeDeltaText: '↓ -9.4h',
    };
  }, [result]);

  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Full-screen loading overlay while running */}
      {loading && (
        <div className="absolute inset-0 z-40 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white shadow-lg rounded-xl px-6 py-5 flex flex-col items-center gap-3 border border-gray-200">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <div className="text-sm font-medium text-gray-800">
              Running reconciliation report…
            </div>
            <div className="text-xs text-gray-500 max-w-[220px]">
              Checking DHL, AX, and EDI alignment. This may take a moment.
            </div>
          </div>
        </div>
      )}

      {/* Toast (success / copied / reset etc.) */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-start gap-3 bg-white border border-green-300 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-800 max-w-xs">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="font-medium text-gray-900">{toastMessage}</div>
        </div>
      )}

      <Navbar timestamp={timestamp} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Missing 945 Reconciliation
          </h2>
          <p className="text-sm text-gray-600">
            Warehouse shipped vs AX posted vs EDI confirmation
          </p>
        </div>

        {/* INPUT SECTION */}
        <Section
          title="Data Inputs"
          caption="Upload the 3 source-of-truth extracts, then run reconciliation."
        >
          <div className="flex flex-wrap gap-4 mb-6">
            <FileUploader
              label="1. DHL Shipment History"
              hint="What physically left the building."
              file={dhlFile}
              onChange={setDhlFile}
            />
            <FileUploader
              label="2. B2Bi / EDI Results"
              hint="Did AX accept the 945 or choke?"
              file={b2biFile}
              onChange={setB2biFile}
            />
            <FileUploader
              label="3. AX Status Snapshot"
              hint="AX truth: Picking List / Packing Slip / Invoiced."
              file={axFile}
              onChange={setAxFile}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunReconciliation}
              disabled={loading || !dhlFile || !b2biFile || !axFile}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running report…
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Run Reconciliation
                </>
              )}
            </button>

            {result && (
              <button
                onClick={handleReset}
                className="bg-gray-200 text-gray-800 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Dashboard
              </button>
            )}
          </div>
        </Section>

        {/* EXPLAINER */}
        <InfoBox>
          <strong>Three-way reconciliation:</strong>
          <br />
          1. DHL Shipment History → what actually shipped.
          <br />
          2. B2Bi / EDI Results → did AX accept or reject the 945 confirmation.
          <br />
          3. AX 940 Snapshot → what AX still thinks (Picking List? Invoiced?).
          <br />
          <br />
          We only show orders that physically shipped, failed to load in AX
          (“AX Load Failure”), and AX still shows them as not posted. Those are
          revenue-risk / SLA-risk.
        </InfoBox>

        {/* EVERYTHING BELOW THIS ONLY SHOWS AFTER RUN */}
        {result && (
          <>
            {/* Snapshot header row */}
            <div className="flex flex-wrap items-center justify-between text-xs text-gray-500">
              <div>
                Snapshot generated:{' '}
                <span className="font-medium">{timestamp}</span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="w-4 h-4" />
                Reset & Run Again
              </button>
            </div>

            {/* TODAY'S HEALTH */}
            <Section
              title="Today's Health"
              caption="Live snapshot from today's reconciliation run"
            >
              <div className="flex flex-wrap gap-4">
                <KPICard
                  title="Total Shipments"
                  value={result.summary.totalShipments}
                  subtitle="From DHL Shipment History"
                />
                <KPICard
                  title="Failed to Load into AX"
                  value={result.summary.totalFailures}
                  subtitle="B2Bi reported AX Load Failure"
                />
                <KPICard
                  title="Still Stuck / Action Required"
                  value={result.summary.totalStuck}
                  subtitle="Shipped but AX not updated / not confirmed back"
                  valueColor="text-red-600"
                />
              </div>
            </Section>

            {/* OPERATIONAL INSIGHTS */}
            <Section
              title="Operational Insights"
              caption="Where do we need attention first?"
            >
              <div className="flex flex-wrap gap-4">
                <InsightBox
                  label="Top Warehouse With Issues"
                  value={result.insights.topWarehouse}
                />
                <InsightBox
                  label="Most Common Failure Reason"
                  value={result.insights.topReason}
                />
                <InsightBox
                  label="Oldest Stuck Shipment"
                  value={`${result.insights.oldestStuck} old`}
                />
              </div>
            </Section>

            {/* SHIPMENTS REQUIRING ACTION */}
            <Section
              title="Shipments Requiring Action"
              caption="These orders shipped but are still not posted in AX / not confirmed back to the customer."
            >
              {/* filter + download row */}
              <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-4">
                  {/* Warehouse Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warehouse
                    </label>
                    <select
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {warehouses.map((wh) => (
                        <option key={wh} value={wh}>
                          {wh}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity
                    </label>
                    <select
                      value={severityFilter}
                      onChange={(e) =>
                        setSeverityFilter(e.target.value as any)
                      }
                      className="w-full max-w-[140px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pickticket, Order, Msg..."
                      className="w-full max-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Download menu (elegant dropdown) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                    <span>Export</span>
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>

                  {showDownloadMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2 text-sm">
                      <button
                        onClick={handleDownloadCSV}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={handleDownloadJSON}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                        <span>JSON</span>
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                        <span>PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 flex items-center gap-2 border-b border-gray-200">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span>
                    {filteredShipments.length} record
                    {filteredShipments.length === 1 ? '' : 's'} shown
                  </span>
                </div>
                <div className="bg-white">
                  <DataTable data={filteredShipments} />
                </div>
              </div>
            </Section>

            {/* ESCALATION / EMAIL */}
            <Section
              title="Escalation / Notify Ops"
              caption="Generate escalation email, copy it, then send."
            >
              <div className="space-y-6">
                {/* who to notify */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">
                    Who do you want to notify?
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-800">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="escalationMode"
                        value="warehouse"
                        checked={escalationMode === 'warehouse'}
                        onChange={() => setEscalationMode('warehouse')}
                      />
                      <span>Notify Warehouse</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="escalationMode"
                        value="internal"
                        checked={escalationMode === 'internal'}
                        onChange={() => setEscalationMode('internal')}
                      />
                      <span>Notify Internal Team</span>
                    </label>
                  </div>
                </div>

                {/* dynamic target picker */}
                <div className="space-y-3">
                  {escalationMode === 'warehouse' ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Which warehouse?
                      </label>
                      <select
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        {warehouses.map((wh) => (
                          <option key={wh} value={wh}>
                            {wh}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Which internal team?
                      </label>
                      <select
                        value={selectedInternalTeam}
                        onChange={(e) => setSelectedInternalTeam(e.target.value)}
                        className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        {internalTeams.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                {/* action buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleGenerateEmail}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Generate Email Draft
                  </button>

                  <button
                    onClick={handleCopyEmail}
                    className="bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>

                  {emailReady && (
                    <button
                      onClick={handleSendEmail}
                      className="bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Send Email
                    </button>
                  )}
                </div>

                {/* live preview */}
                {emailDraft && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-red-900 mb-2">
                      Email Preview
                    </div>
                    <div className="bg-white border border-red-200 rounded-lg p-4 font-mono text-xs text-gray-800 whitespace-pre-wrap">
                      {emailDraft}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* HISTORICAL TREND */}
            <Section
              title="Historical Trend Analysis"
              caption="Last 7+ days vs today. Are we getting better or worse?"
              className="bg-[#0f172a] border border-gray-700 text-white"
            >
              {/* KPI row now compares 'Today' vs rolling average */}
              <TrendKPIs
                kpis={[
                  {
                    label: 'Stuck Today',
                    value: trendStats.todayStuck.toString(),
                    delta: trendStats.deltaVs7dText,
                    positiveIsGood: trendStats.deltaIsGood,
                  },
                  {
                    label: '7-day Avg Stuck',
                    value: trendStats.sevenDayAvgStuck.toFixed(1),
                    delta: 'Baseline',
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
                <div className="text-white font-semibold mb-2 text-lg">
                  Trend of Stuck Shipments (includes Today)
                </div>
                <TrendLineChart data={trendChartData} />
              </div>
            </Section>

            {/* FLEXIBLE BAR COMPARISON (replaces Warehouse Comparison) */}
            <Section
              title="Performance Breakdown"
              caption="Visualize any metric by warehouse. Pick which metric to plot."
              className="bg-[#0f172a] border border-gray-700 text-white"
            >
              <div className="mb-4 flex flex-wrap items-end gap-4">
                <div className="text-sm text-gray-300 font-medium">
                  Y-Axis Metric
                </div>
                <select
                  value={barMetric}
                  onChange={(e) =>
                    setBarMetric(e.target.value as any)
                  }
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="stuckCount">Stuck Count</option>
                  <option value="avgAgeHrs">Avg Age (hrs)</option>
                  <option value="failureRatePct">Load Failure %</option>
                </select>
              </div>

              <CustomBarCompareChart
                data={perWarehouseStats}
                metric={barMetric}
              />
            </Section>

            {/* FOOTER NOTE */}
            <div className="text-xs text-gray-400 text-center py-4">
              This dashboard replaces manual VLOOKUP-based reconciliation across
              DHL, AX, and the B2Bi layer. It surfaces only revenue-impacting /
              SLA-risk orders, prioritizes them by age/severity, and streamlines
              escalation to the responsible ops team.
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
