// import { useState, useMemo, useEffect } from 'react';
// import {
//   Download,
//   Mail,
//   PlayCircle,
//   Copy,
//   RotateCcw,
//   Loader2,
//   CheckCircle2,
//   ChevronDown,
//   Filter,
//   ShieldAlert,
//   AlertTriangle,
// } from 'lucide-react';

// import Navbar from './components/Navbar';
// import Section from './components/Section';
// import KPICard from './components/KPICard';
// import InsightBox from './components/InsightBox';
// import FileUploader from './components/FileUploader';
// import InfoBox from './components/InfoBox';
// import DataTable from './components/DataTable';

// import TrendKPIs from './components/TrendKPIs';
// import TrendLineChart from './components/TrendLineChart';
// import CustomBarCompareChart from './components/CustomBarCompareChart';

// import { parseCSV } from './utils/csv-parser';
// import { reconcileData, generateEmailDraft } from './utils/reconciliation';
// import { exportToCSV } from './utils/export';

// import type { ReconciliationResult, StuckShipment } from './types';

// function App() {
//   // ------------------------------------------------------------------
//   // STATE
//   // ------------------------------------------------------------------
//   const [dhlFile, setDhlFile] = useState<File | null>(null);
//   const [b2biFile, setB2biFile] = useState<File | null>(null);
//   const [axFile, setAxFile] = useState<File | null>(null);

//   const [result, setResult] = useState<ReconciliationResult | null>(null);

//   const [loading, setLoading] = useState(false);
//   const [toastMessage, setToastMessage] = useState<string | null>(null);

//   // Table filters
//   const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses');
//   const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
//   const [searchQuery, setSearchQuery] = useState('');

//   // Escalation workflow
//   const [escalationMode, setEscalationMode] = useState<'warehouse' | 'internal'>('warehouse');
//   const [selectedInternalTeam, setSelectedInternalTeam] = useState('AX / EDI Ops');

//   // Email draft state
//   const [emailDraft, setEmailDraft] = useState('');
//   const [emailReady, setEmailReady] = useState(false); // controls "Open Ticket / Notify Team" button

//   // Export dropdown visibility
//   const [showDownloadMenu, setShowDownloadMenu] = useState(false);

//   // Leaderboard chart metric
//   const [barMetric, setBarMetric] = useState<'stuckCount' | 'avgAgeHrs' | 'failureRatePct'>(
//     'stuckCount'
//   );

//   // Timestamp (used in navbar and executive header)
//   const timestamp =
//     new Date().toLocaleString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric',
//       hour: 'numeric',
//       minute: 'numeric',
//       hour12: true,
//       timeZone: 'America/Chicago',
//     }) + ' CT';

//   // Auto-hide toast
//   useEffect(() => {
//     if (!toastMessage) return;
//     const t = setTimeout(() => setToastMessage(null), 4000);
//     return () => clearTimeout(t);
//   }, [toastMessage]);

//   // ------------------------------------------------------------------
//   // HANDLERS
//   // ------------------------------------------------------------------

//   // Run reconciliation (simulate backend job with overlay + spinner)
//   const handleRunReconciliation = async () => {
//     if (!dhlFile || !b2biFile || !axFile) {
//       alert('Please upload all three files to run reconciliation.');
//       return;
//     }

//     setLoading(true);
//     setToastMessage(null);

//     try {
//       // slight delay so the overlay/spinner is visible and feels legit
//       await new Promise((resolve) => setTimeout(resolve, 1800));

//       const [dhlData, b2biData, axData] = await Promise.all([
//         parseCSV(dhlFile),
//         parseCSV(b2biFile),
//         parseCSV(axFile),
//       ]);

//       const reconciliationResult = reconcileData(dhlData, b2biData, axData);
//       setResult(reconciliationResult);

//       // reset downstream state
//       setEmailDraft('');
//       setEmailReady(false);
//       setSelectedWarehouse('All Warehouses');
//       setSeverityFilter('all');
//       setSearchQuery('');

//       setToastMessage('Reconciliation complete');
//     } catch (err) {
//       console.error('Reconciliation error:', err);
//       alert('Error processing files. Please check the console for details.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset dashboard fully
//   const handleReset = () => {
//     setDhlFile(null);
//     setB2biFile(null);
//     setAxFile(null);

//     setResult(null);

//     setSelectedWarehouse('All Warehouses');
//     setSeverityFilter('all');
//     setSearchQuery('');

//     setEscalationMode('warehouse');
//     setSelectedInternalTeam('AX / EDI Ops');
//     setEmailDraft('');
//     setEmailReady(false);

//     setToastMessage('Dashboard reset');
//   };

//   // Generate full escalation / ticket draft
//   const makeEscalationDraft = (
//     stuckShipments: StuckShipment[],
//     mode: 'warehouse' | 'internal',
//     warehouseTarget: string,
//     internalTarget: string,
//     specificRows?: StuckShipment[]
//   ) => {
//     // Generate base body from either a subset of rows (specific escalation)
//     // or the entire filtered group
//     const rowsForDraft = specificRows && specificRows.length > 0 ? specificRows : stuckShipments;

//     const baseDraft = generateEmailDraft(rowsForDraft, warehouseTarget);

//     if (mode === 'warehouse') {
//       return `[routing: ${warehouseTarget} DC | priority: High]\n\nSubject: ACTION REQUIRED - Orders not posted in AX for ${warehouseTarget}\n\n${baseDraft}`;
//     } else {
//       return `[routing: ${internalTarget} | priority: High]\n\nSubject: INTERNAL ESCALATION - AX / EDI posting failures\n\n${baseDraft}`;
//     }
//   };

//   // When user hits "Generate Ticket Draft" (global escalation flow)
//   const handleGenerateEmail = () => {
//     if (!result) return;

//     const draft = makeEscalationDraft(
//       result.stuckShipments,
//       escalationMode,
//       selectedWarehouse,
//       selectedInternalTeam
//     );

//     setEmailDraft(draft);
//     setEmailReady(true);
//     setToastMessage('Fix ticket draft generated');
//   };

//   // Keep the preview auto-updated live after first generation
//   useEffect(() => {
//     if (!emailReady || !result) return;

//     const draft = makeEscalationDraft(
//       result.stuckShipments,
//       escalationMode,
//       selectedWarehouse,
//       selectedInternalTeam
//     );

//     setEmailDraft(draft);
//   }, [emailReady, result, escalationMode, selectedWarehouse, selectedInternalTeam]);

//   // Inline escalate from a specific row in the table
//   const handleEscalateRow = (row: StuckShipment) => {
//     if (!result) return;

//     const rowDraft = makeEscalationDraft(
//       [row], // escalate THIS row
//       escalationMode,
//       row.Warehouse || selectedWarehouse,
//       selectedInternalTeam,
//       [row]
//     );

//     setEmailDraft(rowDraft);
//     setEmailReady(true);
//     setToastMessage(
//       `Draft targeted to ${escalationMode === 'warehouse' ? (row.Warehouse || 'Warehouse') : selectedInternalTeam
//       }`
//     );
//     // also auto-select warehouse if user escalated a row from a specific DC
//     if (row.Warehouse) {
//       setSelectedWarehouse(row.Warehouse);
//       setEscalationMode('warehouse');
//     }
//   };

//   // Copy escalation/ticket text
//   const handleCopyEmail = async () => {
//     if (!emailDraft) return;
//     try {
//       await navigator.clipboard.writeText(emailDraft);
//       setToastMessage('Draft copied');
//     } catch {
//       alert('Unable to copy to clipboard in this browser.');
//     }
//   };

//   // Fake "Open Ticket / Notify Team"
//   const handleSendEmail = () => {
//     if (!emailDraft) {
//       alert('Generate the ticket draft first.');
//       return;
//     }
//     alert(
//       `Pretend we're submitting this ticket:\n\nTo: ${
//         escalationMode === 'warehouse'
//           ? `${selectedWarehouse} Warehouse`
//           : selectedInternalTeam
//       }\n\n${emailDraft}`
//     );
//   };

//   // ------------------------------------------------------------------
//   // EXPORT HANDLERS
//   // ------------------------------------------------------------------

//   const handleDownloadCSV = () => {
//     if (!result) return;
//     const today = new Date()
//       .toLocaleDateString('en-US', {
//         month: '2-digit',
//         day: '2-digit',
//         year: '2-digit',
//       })
//       .replace(/\//g, '');
//     exportToCSV(filteredShipments, `SHIPMENT_EXCEPTIONS_${today}.csv`);
//     setToastMessage('CSV downloaded');
//     setShowDownloadMenu(false);
//   };

//   const handleDownloadJSON = () => {
//     if (!result) return;
//     const blob = new Blob([JSON.stringify(filteredShipments, null, 2)], {
//       type: 'application/json',
//     });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
//     a.download = `SHIPMENT_EXCEPTIONS_${today}.json`;
//     a.click();
//     URL.revokeObjectURL(url);
//     setToastMessage('JSON downloaded');
//     setShowDownloadMenu(false);
//   };

//   const handleDownloadPDF = () => {
//     alert('PDF export coming soon (styled summary + active exceptions).');
//     setShowDownloadMenu(false);
//   };

//   const handleDownloadAudit = () => {
//     alert(
//       'Audit bundle (CSV + JSON + signed metadata.zip) will be generated here in production for Finance / Compliance.'
//     );
//     setShowDownloadMenu(false);
//   };

//   // ------------------------------------------------------------------
//   // DERIVED DATA
//   // ------------------------------------------------------------------

//   // list of warehouses from data
//   const warehouses = result
//     ? [
//         'All Warehouses',
//         ...Array.from(new Set(result.stuckShipments.map((s) => s.Warehouse))).sort(),
//       ]
//     : ['All Warehouses'];

//   // internal teams list
//   const internalTeams = [
//     'AX / EDI Ops',
//     'Warehouse Ops Leadership',
//     'Finance / Revenue',
//     'IT Support',
//   ];

//   // first filter by warehouse
//   const warehouseFilteredShipments = useMemo<StuckShipment[]>(() => {
//     if (!result) return [];
//     if (selectedWarehouse === 'All Warehouses') {
//       return result.stuckShipments;
//     }
//     return result.stuckShipments.filter((s) => s.Warehouse === selectedWarehouse);
//   }, [result, selectedWarehouse]);

//   // then filter by severity and search
//   const filteredShipments = useMemo<StuckShipment[]>(() => {
//     return warehouseFilteredShipments.filter((row) => {
//       // severity filter
//       if (severityFilter !== 'all') {
//         if (row.Severity !== severityFilter) return false;
//       }
//       // free-text search
//       if (searchQuery.trim()) {
//         const q = searchQuery.toLowerCase();
//         const fields = [
//           row.Pickticket,
//           row.Order,
//           row['Issue Summary'],
//           row.Warehouse,
//           row['Ship To'],
//         ]
//           .filter(Boolean)
//           .map(String);

//         const hit = fields.some((f) => f.toLowerCase().includes(q));
//         if (!hit) return false;
//       }
//       return true;
//     });
//   }, [warehouseFilteredShipments, severityFilter, searchQuery]);

//   // sum potential $ exposure (OrderValue) for all stuck shipments
//   const revenueAtRisk = useMemo(() => {
//     if (!result) return 0;
//     return result.stuckShipments.reduce((sum: number, row: any) => {
//       const val = row.OrderValue ? Number(row.OrderValue) : 0;
//       return sum + val;
//     }, 0);
//   }, [result]);

//   // count orders older than 24h
//   const highAgeCount = useMemo(() => {
//     if (!result) return 0;
//     return result.stuckShipments.filter((row: any) => {
//       const age = row.AgeHours ? Number(row.AgeHours) : 0;
//       return age >= 24;
//     }).length;
//   }, [result]);

//   // today's posting failure rate
//   const failureRateTodayPct = useMemo(() => {
//     if (!result || result.summary.totalShipments === 0) return 0;
//     return (
//       (result.summary.totalFailures / result.summary.totalShipments) * 100
//     );
//   }, [result]);

//   // mock/assumed baseline
//   const failureRateBaselinePct = 1.8;
//   const failureRateDeltaPct = failureRateTodayPct - failureRateBaselinePct;

//   // SLA clear time (mocked, could become dynamic)
//   const avgResolutionHours = 11.3;
//   const avgResolutionDeltaText = 'Improved 9.4h vs last week';

//   // per-warehouse stats for leaderboard
//   const perWarehouseStats = useMemo(() => {
//     if (!result) return [];

//     const globalFailureRatePct = result.summary.totalShipments
//       ? (result.summary.totalFailures / result.summary.totalShipments) * 100
//       : 0;

//     const map: Record<
//       string,
//       { stuckCount: number; totalAgeHrs: number; failureRatePct: number }
//     > = {};

//     for (const row of result.stuckShipments) {
//       const wh = row.Warehouse || 'Unknown';
//       if (!map[wh]) {
//         map[wh] = {
//           stuckCount: 0,
//           totalAgeHrs: 0,
//           failureRatePct: globalFailureRatePct,
//         };
//       }
//       map[wh].stuckCount += 1;
//       map[wh].totalAgeHrs += row.AgeHours ? Number(row.AgeHours) : 0;
//     }

//     return Object.entries(map)
//       .map(([warehouse, stats]) => {
//         const avgAgeHrs =
//           stats.stuckCount > 0 ? stats.totalAgeHrs / stats.stuckCount : 0;
//         return {
//           warehouse,
//           stuckCount: stats.stuckCount,
//           avgAgeHrs,
//           failureRatePct: stats.failureRatePct,
//         };
//       })
//       .sort((a, b) => b.stuckCount - a.stuckCount);
//   }, [result]);

//   // Trend chart data including "Today"
//   const trendChartData = useMemo(() => {
//     return [
//       { dateLabel: 'Oct 24', stuckCount: 0, totalShipmentsScaled: 45 },
//       { dateLabel: 'Oct 25', stuckCount: 5, totalShipmentsScaled: 44 },
//       { dateLabel: 'Oct 26', stuckCount: 5, totalShipmentsScaled: 43 },
//       { dateLabel: 'Oct 27', stuckCount: 4, totalShipmentsScaled: 44 },
//       { dateLabel: 'Oct 28', stuckCount: 3, totalShipmentsScaled: 41 },
//       { dateLabel: 'Oct 29', stuckCount: 6, totalShipmentsScaled: 45 },
//       { dateLabel: 'Oct 30', stuckCount: 2, totalShipmentsScaled: 42 },
//       {
//         dateLabel: 'Today',
//         stuckCount: result ? result.summary.totalStuck : 0,
//         totalShipmentsScaled: result ? result.summary.totalShipments : 0,
//       },
//     ];
//   }, [result]);

//   // Trend KPI stats: Today vs 7-day avg
//   const trendStats = useMemo(() => {
//     const sevenDayAvgStuck = 3.9; // mock rolling avg
//     const todayStuck = result ? result.summary.totalStuck : 0;
//     const deltaVs7d = todayStuck - sevenDayAvgStuck;
//     const deltaVs7dText =
//       (deltaVs7d >= 0 ? '↑ ' : '↓ ') +
//       Math.abs(deltaVs7d).toFixed(1) +
//       ' vs 7d avg';

//     return {
//       todayStuck,
//       sevenDayAvgStuck,
//       deltaVs7dText,
//       deltaIsGood: deltaVs7d <= 0, // green if today <= avg
//       resolutionRate: 95.7,
//       resolutionDeltaText: '↑ +7.3%',
//       avgResolutionHrs: 11.3,
//       resolutionTimeDeltaText: '↓ -9.4h',
//     };
//   }, [result]);

//   // ------------------------------------------------------------------
//   // RENDER
//   // ------------------------------------------------------------------
//   return (
//     <div className="min-h-screen bg-gray-100 relative">
//       {/* full-screen overlay while loading */}
//       {loading && (
//         <div className="absolute inset-0 z-40 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
//           <div className="bg-white shadow-lg rounded-xl px-6 py-5 flex flex-col items-center gap-3 border border-gray-200">
//             <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
//             <div className="text-sm font-medium text-gray-800">
//               Running reconciliation…
//             </div>
//             <div className="text-xs text-gray-500 max-w-[240px]">
//               Validating DHL scan-outs, AX posting status, and EDI 945 loads.
//             </div>
//           </div>
//         </div>
//       )}

//       {/* toast */}
//       {toastMessage && (
//         <div className="fixed top-4 right-4 z-50 flex items-start gap-3 bg-white border border-green-300 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-800 max-w-xs">
//           <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
//           <div className="font-medium text-gray-900">{toastMessage}</div>
//         </div>
//       )}

//       <Navbar timestamp={timestamp} />

//       <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
//         {/* EXECUTIVE HEADER */}
//         <div>
//           <h2 className="text-2xl font-semibold text-gray-900 mb-1">
//             Outbound Shipment Integrity Dashboard
//           </h2>
//           <p className="text-sm text-gray-600">
//             Real-time view of shipped-but-not-booked revenue, SLA risk, and site accountability.
//           </p>
//           <p className="text-[11px] text-gray-400 mt-1">
//             Source: DHL scan-out · B2Bi/EDI ingest · AX posting status · Snapshot {timestamp}
//           </p>
//         </div>

//         {/* INPUTS / RUN */}
//         <Section
//           title="Data Inputs"
//           caption="DHL scan-out, B2Bi / EDI 945 results, and AX posting snapshot."
//         >
//           <div className="flex flex-wrap gap-4 mb-6">
//             <FileUploader
//               label="1. DHL Shipment History"
//               hint="What physically left the building."
//               file={dhlFile}
//               onChange={setDhlFile}
//             />
//             <FileUploader
//               label="2. B2Bi / EDI Results"
//               hint="Did AX accept the 945 or reject it?"
//               file={b2biFile}
//               onChange={setB2biFile}
//             />
//             <FileUploader
//               label="3. AX Status Snapshot"
//               hint="AX truth: Picking List / Packing Slip / Invoiced."
//               file={axFile}
//               onChange={setAxFile}
//             />
//           </div>

//           <div className="flex flex-wrap gap-3">
//             <button
//               onClick={handleRunReconciliation}
//               disabled={loading || !dhlFile || !b2biFile || !axFile}
//               className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   Running report…
//                 </>
//               ) : (
//                 <>
//                   <PlayCircle className="w-4 h-4" />
//                   Run Reconciliation
//                 </>
//               )}
//             </button>

//             {result && (
//               <button
//                 onClick={handleReset}
//                 className="bg-gray-200 text-gray-800 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
//               >
//                 <RotateCcw className="w-4 h-4" />
//                 Reset Dashboard
//               </button>
//             )}
//           </div>
//         </Section>

//         {/* EXPLAINER */}
//         <InfoBox>
//           <strong>What this catches:</strong>
//           <br />
//           • Shipments that physically left the warehouse (DHL) <br />
//           • AX did not post / invoice them yet <br />
//           • EDI 945 confirmation back to customer is missing or failed <br />
//           <br />
//           These are revenue-impacting and SLA-risk orders. We surface them,
//           rank them by urgency, and generate the fix ticket to the right team
//           or warehouse automatically.
//         </InfoBox>

//         {/* ONLY SHOW AFTER RUN */}
//         {result && (
//           <>
//             {/* snapshot row */}
//             <div className="flex flex-wrap items-center justify-between text-xs text-gray-500">
//               <div className="flex items-center gap-2">
//                 <ShieldAlert className="w-4 h-4 text-red-500" />
//                 <span>
//                   {result.summary.totalStuck} open exceptions across {warehouses.length - 1}{' '}
//                   active DCs
//                 </span>
//               </div>
//               <button
//                 onClick={handleReset}
//                 className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
//               >
//                 <RotateCcw className="w-4 h-4" />
//                 Reset & Run Again
//               </button>
//             </div>

//             {/* EXEC SUMMARY */}
//             <Section
//               title="Executive Summary"
//               caption="Business impact and exposure as of this snapshot."
//             >
//               <div className="flex flex-wrap gap-4">
//                 <KPICard
//                   title="Revenue at Risk"
//                   value={`$${revenueAtRisk.toLocaleString()}`}
//                   subtitle="Shipped but not invoiced / not posted in AX"
//                   valueColor="text-red-600"
//                 />
//                 <KPICard
//                   title="Aging Risk"
//                   value={`${highAgeCount} orders >24h`}
//                   subtitle="Potential SLA breach / chargeback exposure"
//                   valueColor={highAgeCount > 0 ? 'text-red-600' : 'text-gray-800'}
//                 />
//                 <KPICard
//                   title="Posting Failure Rate"
//                   value={`${failureRateTodayPct.toFixed(1)}%`}
//                   subtitle={`vs ${failureRateBaselinePct.toFixed(
//                     1
//                   )}% 7d avg (${failureRateDeltaPct >= 0 ? '↑' : '↓'} ${Math.abs(
//                     failureRateDeltaPct
//                   ).toFixed(1)}pts)`}
//                   valueColor={
//                     failureRateDeltaPct > 0 ? 'text-red-600' : 'text-green-600'
//                   }
//                 />
//                 <KPICard
//                   title="Avg Time to Clear"
//                   value={`${avgResolutionHours.toFixed(1)}h`}
//                   subtitle={avgResolutionDeltaText}
//                   valueColor="text-green-600"
//                 />
//               </div>
//             </Section>

//             {/* INSIGHTS */}
//             <Section
//               title="Operational Insights"
//               caption="Where to focus first."
//             >
//               <div className="flex flex-wrap gap-4">
//                 <InsightBox
//                   label="Top Site With Issues"
//                   value={result.insights.topWarehouse}
//                 />
//                 <InsightBox
//                   label="Most Common Failure Reason"
//                   value={result.insights.topReason}
//                 />
//                 <InsightBox
//                   label="Oldest Stuck Shipment"
//                   value={`${result.insights.oldestStuck} old`}
//                 />
//               </div>
//             </Section>

//             {/* REVENUE PROTECTION QUEUE */}
//             <Section
//               title="Revenue Protection Queue"
//               caption="Orders that shipped but are not booked in AX / not confirmed to the customer. This is live money at risk."
//             >
//               {/* filter + export row */}
//               <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
//                 <div className="flex flex-wrap gap-4">
//                   {/* Warehouse filter */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Warehouse / DC
//                     </label>
//                     <select
//                       value={selectedWarehouse}
//                       onChange={(e) => setSelectedWarehouse(e.target.value)}
//                       className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       {warehouses.map((wh) => (
//                         <option key={wh} value={wh}>
//                           {wh}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* SLA Risk filter */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       SLA Risk
//                     </label>
//                     <select
//                       value={severityFilter}
//                       onChange={(e) =>
//                         setSeverityFilter(e.target.value as any)
//                       }
//                       className="w-full max-w-[150px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       <option value="all">All</option>
//                       <option value="high">High (breach &lt;2h)</option>
//                       <option value="medium">Medium (8-24h)</option>
//                       <option value="low">Low (&lt;8h)</option>
//                     </select>
//                   </div>

//                   {/* Search */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Search
//                     </label>
//                     <input
//                       type="text"
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       placeholder="Pickticket, Order, Reason…"
//                       className="w-full max-w-[220px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                     />
//                   </div>
//                 </div>

//                 {/* Export dropdown */}
//                 <div className="relative">
//                   <button
//                     type="button"
//                     onClick={() => setShowDownloadMenu(!showDownloadMenu)}
//                     className="bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
//                   >
//                     <Download className="w-4 h-4 text-gray-600" />
//                     <span>Export</span>
//                     <ChevronDown className="w-4 h-4 text-gray-600" />
//                   </button>

//                   {showDownloadMenu && (
//                     <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2 text-sm">
//                       <button
//                         onClick={handleDownloadCSV}
//                         className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
//                       >
//                         <Download className="w-4 h-4 text-gray-500" />
//                         <span>CSV</span>
//                       </button>
//                       <button
//                         onClick={handleDownloadJSON}
//                         className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
//                       >
//                         <Download className="w-4 h-4 text-gray-500" />
//                         <span>JSON</span>
//                       </button>
//                       <button
//                         onClick={handleDownloadPDF}
//                         className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
//                       >
//                         <Download className="w-4 h-4 text-gray-500" />
//                         <span>PDF (Exec Brief)</span>
//                       </button>
//                       <button
//                         onClick={handleDownloadAudit}
//                         className="w-full text-left px-4 py-2 hover:bg-gray-50 border-t border-gray-200 flex items-center gap-2"
//                       >
//                         <AlertTriangle className="w-4 h-4 text-red-500" />
//                         <span>Audit Package (.zip)</span>
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* queue table */}
//               <div className="border border-gray-200 rounded-lg overflow-hidden">
//                 <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 flex items-center gap-2 border-b border-gray-200">
//                   <Filter className="w-4 h-4 text-gray-500" />
//                   <span>
//                     {filteredShipments.length} record
//                     {filteredShipments.length === 1 ? '' : 's'} shown
//                   </span>
//                 </div>
//                 <div className="bg-white">
//                   <DataTable data={filteredShipments} onEscalateRow={handleEscalateRow} />
//                 </div>
//               </div>
//             </Section>

//             {/* CREATE FIX TICKET */}
//             <Section
//               title="Create Fix Ticket"
//               caption="Generate & route a structured escalation with all impacted shipments (or a single order) to the right team."
//               collapsible
//               defaultOpen={false}   // collapsed by default as you asked
//             >
//               <div className="space-y-6">
//                 {/* Who to notify */}
//                 <div className="space-y-3">
//                   <div className="text-sm font-medium text-gray-700">
//                     Routing target
//                   </div>
//                   <div className="flex flex-wrap gap-4 text-sm text-gray-800">
//                     <label className="flex items-center gap-2">
//                       <input
//                         type="radio"
//                         name="escalationMode"
//                         value="warehouse"
//                         checked={escalationMode === 'warehouse'}
//                         onChange={() => setEscalationMode('warehouse')}
//                       />
//                       <span>Specific Warehouse / DC</span>
//                     </label>

//                     <label className="flex items-center gap-2">
//                       <input
//                         type="radio"
//                         name="escalationMode"
//                         value="internal"
//                         checked={escalationMode === 'internal'}
//                         onChange={() => setEscalationMode('internal')}
//                       />
//                       <span>Internal AX / EDI / Finance team</span>
//                     </label>
//                   </div>
//                 </div>

//                 {/* Which destination */}
//                 <div className="space-y-3">
//                   {escalationMode === 'warehouse' ? (
//                     <>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Warehouse / DC
//                       </label>
//                       <select
//                         value={selectedWarehouse}
//                         onChange={(e) => setSelectedWarehouse(e.target.value)}
//                         className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                       >
//                         {warehouses.map((wh) => (
//                           <option key={wh} value={wh}>
//                             {wh}
//                           </option>
//                         ))}
//                       </select>
//                     </>
//                   ) : (
//                     <>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Internal Team
//                       </label>
//                       <select
//                         value={selectedInternalTeam}
//                         onChange={(e) => setSelectedInternalTeam(e.target.value)}
//                         className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                       >
//                         {internalTeams.map((team) => (
//                           <option key={team} value={team}>
//                             {team}
//                           </option>
//                         ))}
//                       </select>
//                     </>
//                   )}
//                 </div>

//                 {/* Actions */}
//                 <div className="flex flex-wrap gap-3">
//                   <button
//                     onClick={handleGenerateEmail}
//                     className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
//                   >
//                     <Mail className="w-4 h-4" />
//                     Generate Ticket Draft
//                   </button>

//                   <button
//                     onClick={handleCopyEmail}
//                     className="bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
//                   >
//                     <Copy className="w-4 h-4" />
//                     Copy Draft
//                   </button>

//                   {emailReady && (
//                     <button
//                       onClick={handleSendEmail}
//                       className="bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
//                     >
//                       <Mail className="w-4 h-4" />
//                       Open Ticket / Notify Team
//                     </button>
//                   )}
//                 </div>

//                 {/* Preview */}
//                 {emailDraft && (
//                   <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                     <div className="text-sm font-semibold text-red-900 mb-2">
//                       Ticket Preview
//                     </div>
//                     <div className="bg-white border border-red-200 rounded-lg p-4 font-mono text-xs text-gray-800 whitespace-pre-wrap">
//                       {emailDraft}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </Section>

//             {/* THROUGHPUT & STABILITY */}
//             <Section
//               title="Throughput & Stability"
//               caption="Today vs trailing 7 days. Are we getting faster or falling behind?"
//               className="bg-[#0f172a] border border-gray-700 text-white"
//             >
//               <TrendKPIs
//                 kpis={[
//                   {
//                     label: 'Stuck Today',
//                     value: trendStats.todayStuck.toString(),
//                     delta: trendStats.deltaVs7dText,
//                     positiveIsGood: trendStats.deltaIsGood,
//                   },
//                   {
//                     label: '7-day Avg Stuck',
//                     value: trendStats.sevenDayAvgStuck.toFixed(1),
//                     delta: 'Baseline',
//                     positiveIsGood: true,
//                   },
//                   {
//                     label: 'Resolution Rate',
//                     value: `${trendStats.resolutionRate.toFixed(1)}%`,
//                     delta: trendStats.resolutionDeltaText,
//                     positiveIsGood: true,
//                   },
//                   {
//                     label: 'Avg Resolution Time',
//                     value: `${trendStats.avgResolutionHrs.toFixed(1)}h`,
//                     delta: trendStats.resolutionTimeDeltaText,
//                     positiveIsGood: true,
//                   },
//                 ]}
//               />

//               <div className="mt-8">
//                 <div className="text-white font-semibold mb-2 text-lg">
//                   Trend of Stuck Shipments (incl. Today)
//                 </div>
//                 <TrendLineChart data={trendChartData} />
//               </div>
//             </Section>

//             {/* SITE PERFORMANCE LEADERBOARD */}
//             <Section
//               title="Site Performance Leaderboard"
//               caption="Which DCs are driving the most revenue risk and delay right now."
//               className="bg-[#0f172a] border border-gray-700 text-white"
//             >
//               <div className="mb-4 flex flex-wrap items-end gap-4">
//                 <div className="text-sm text-gray-300 font-medium">
//                   Ranking metric
//                 </div>
//                 <select
//                   value={barMetric}
//                   onChange={(e) => setBarMetric(e.target.value as any)}
//                   className="px-4 py-2 rounded-lg bg-gray-900 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                 >
//                   <option value="stuckCount">Open Shipments Stuck</option>
//                   <option value="avgAgeHrs">Avg Aging (hrs)</option>
//                   <option value="failureRatePct">Load Failure %</option>
//                 </select>
//               </div>

//               <CustomBarCompareChart data={perWarehouseStats} metric={barMetric} />
//             </Section>

//             {/* FOOTER NOTE */}
//             <div className="text-xs text-gray-400 text-center py-4">
//               ENV: DEMO — This dashboard replaces manual VLOOKUP across DHL / AX / EDI.
//               It quantifies unbooked revenue, flags SLA exposure, and routes fix tickets to the right team
//               in one click.
//             </div>
//           </>
//         )}
//       </main>
//     </div>  
//   );
// }

// export default App;

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
} from 'lucide-react';

import Navbar from './components/Navbar';
import Section from './components/Section';
import KPICard from './components/KPICard';
import InsightBox from './components/InsightBox';
import FileUploader from './components/FileUploader';
import InfoBox from './components/InfoBox';
import DataTable from './components/DataTable';

// If you added these in previous steps; keep them. Otherwise you can replace with your existing chart components.
import TrendKPIs from './components/TrendKPIs';
import TrendLineChart from './components/TrendLineChart';
import CustomBarCompareChart from './components/CustomBarCompareChart';

import { parseCSV } from './utils/csv-parser';
import { reconcileData, generateEmailDraft } from './utils/reconciliation';
import { exportToCSV } from './utils/export';

import type { ReconciliationResult, StuckShipment } from './types';

function App() {
  // -------------------------------------------------
  // STATE
  // -------------------------------------------------
  const [dhlFile, setDhlFile] = useState<File | null>(null);
  const [b2biFile, setB2biFile] = useState<File | null>(null);
  const [axFile, setAxFile] = useState<File | null>(null);

  const [result, setResult] = useState<ReconciliationResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters (queue)
  const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Escalation routing
  const [escalationMode, setEscalationMode] = useState<'warehouse' | 'internal'>('warehouse');
  const [selectedInternalTeam, setSelectedInternalTeam] = useState('AX / EDI Ops');

  // Ticket/email draft
  const [emailDraft, setEmailDraft] = useState('');
  const [emailReady, setEmailReady] = useState(false);

  // Export dropdown
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Leaderboard metric
  const [barMetric, setBarMetric] = useState<'stuckCount' | 'avgAgeHrs' | 'failureRatePct'>(
    'stuckCount'
  );

  // Timestamp (navbar + header)
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

  // Toast auto-hide
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // -------------------------------------------------
  // HANDLERS
  // -------------------------------------------------
  const handleRunReconciliation = async () => {
    if (!dhlFile || !b2biFile || !axFile) {
      alert('Please upload all three files to run reconciliation.');
      return;
    }
    setLoading(true);
    setToastMessage(null);

    try {
      // small delay so spinner/overlay is visible
      await new Promise((r) => setTimeout(r, 1800));

      const [dhlData, b2biData, axData] = await Promise.all([
        parseCSV(dhlFile),
        parseCSV(b2biFile),
        parseCSV(axFile),
      ]);

      const reconciliationResult = reconcileData(dhlData, b2biData, axData);
      setResult(reconciliationResult);

      // reset downstream state
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

  // keep preview live after first generate
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
      setToastMessage('Draft copied');
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

  // -------------------------------------------------
  // EXPORT HANDLERS
  // -------------------------------------------------
  const handleDownloadCSV = () => {
    if (!result) return;
    exportToCSV(filteredShipments, `SHIPMENT_EXCEPTIONS_${new Date().toISOString().slice(0,10)}.csv`);
    setToastMessage('CSV downloaded');
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
    setToastMessage('JSON downloaded');
    setShowDownloadMenu(false);
  };

  const handleDownloadPDF = () => {
    alert('PDF export coming soon (styled exec summary + exceptions).');
    setShowDownloadMenu(false);
  };

  const handleDownloadAudit = () => {
    alert('Audit bundle stub (CSV + JSON + metadata.zip). We’ll sign it in prod.');
    setShowDownloadMenu(false);
  };

  // -------------------------------------------------
  // DERIVED DATA
  // -------------------------------------------------
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

  // Revenue at Risk
  const revenueAtRisk = useMemo(() => {
    if (!result) return 0;
    return result.stuckShipments.reduce((sum: number, r: any) => sum + (r.OrderValue ? Number(r.OrderValue) : 0), 0);
  }, [result]);

  // Aging risk count
  const highAgeCount = useMemo(() => {
    if (!result) return 0;
    return result.stuckShipments.filter((r: any) => (r.AgeHours ? Number(r.AgeHours) : 0) >= 24).length;
  }, [result]);

  // Failure rate
  const failureRateTodayPct = useMemo(() => {
    if (!result || result.summary.totalShipments === 0) return 0;
    return (result.summary.totalFailures / result.summary.totalShipments) * 100;
  }, [result]);

  const failureRateBaselinePct = 1.8;
  const failureRateDeltaPct = failureRateTodayPct - failureRateBaselinePct;

  // Trend + KPI (mock comparisons)
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
        totalShipmentsScaled: result ? result.summary.totalShipments : 0,
      },
    ];
  }, [result]);

  const trendStats = useMemo(() => {
    const sevenDayAvgStuck = 3.9;
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

  // Leaderboard aggregates (per WH)
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
      map[wh].totalAgeHrs += row.AgeHours ? Number(row.AgeHours) : 0;
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

  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-40 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white shadow-lg rounded-xl px-6 py-5 flex flex-col items-center gap-3 border border-gray-200">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <div className="text-sm font-medium text-gray-800">Running reconciliation…</div>
            <div className="text-xs text-gray-500 max-w-[240px]">
              Validating DHL scan-outs, AX posting status, and EDI 945 loads.
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-start gap-3 bg-white border border-green-300 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-800 max-w-xs">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="font-medium text-gray-900">{toastMessage}</div>
        </div>
      )}

      <Navbar timestamp={timestamp} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Outbound Shipment Integrity Dashboard</h2>
        </div>

        {/* Inputs */}
        <Section title="Data Inputs" caption="DHL scan-out, B2Bi / EDI 945 results, and AX posting snapshot.">
          <div className="flex flex-wrap gap-4 mb-6">
            <FileUploader label="1. DHL Shipment History" hint="What physically left the building." file={dhlFile} onChange={setDhlFile} />
            <FileUploader label="2. B2Bi / EDI Results" hint="Did AX accept the 945 or reject it?" file={b2biFile} onChange={setB2biFile} />
            <FileUploader label="3. AX Status Snapshot" hint="AX truth: Picking List / Packing Slip / Invoiced." file={axFile} onChange={setAxFile} />
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

        {/* Explainer */}
        <InfoBox>
          <strong>What this catches:</strong>
          <br />
          • Shipments that physically left the warehouse (DHL) <br />
          • AX did not post / invoice them yet <br />
          • EDI 945 confirmation back to customer is missing or failed <br />
          <br />
          These are revenue-impacting and SLA-risk orders. We surface them, rank by urgency, and generate a fix ticket to
          the right team or warehouse automatically.
        </InfoBox>

        {/* After run */}
        {result && (
          <>
            {/* Snapshot */}
            <div className="flex flex-wrap items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>
                  {result.summary.totalStuck} open exceptions across {warehouses.length - 1} active DCs
                </span>
              </div>
              <button onClick={handleReset} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                <RotateCcw className="w-4 h-4" />
                Reset & Run Again
              </button>
            </div>

            {/* Executive Summary */}
            <Section title="Executive Summary" caption="Business impact and exposure as of this snapshot.">
              <div className="flex flex-wrap gap-4">
                <KPICard
                  title="Revenue at Risk"
                  value={`$${revenueAtRisk.toLocaleString()}`}
                  subtitle="Shipped but not invoiced / not posted in AX"
                  valueColor="text-red-600"
                />
                <KPICard
                  title="Aging Risk"
                  value={`${highAgeCount} orders >24h`}
                  subtitle="Potential SLA breach / chargeback exposure"
                  valueColor={highAgeCount > 0 ? 'text-red-600' : 'text-gray-800'}
                />
                <KPICard
                  title="Posting Failure Rate"
                  value={`${failureRateTodayPct.toFixed(1)}%`}
                  subtitle={`vs ${failureRateBaselinePct.toFixed(1)}% 7d avg (${failureRateDeltaPct >= 0 ? '↑' : '↓'} ${Math.abs(
                    failureRateDeltaPct
                  ).toFixed(1)}pts)`}
                  valueColor={failureRateDeltaPct > 0 ? 'text-red-600' : 'text-green-600'}
                />
                <KPICard
                  title="Avg Time to Clear"
                  value={`${(11.3).toFixed(1)}h`}
                  subtitle={'Improved 9.4h vs last week'}
                  valueColor="text-green-600"
                />
              </div>
            </Section>

            {/* Insights */}
            <Section title="Operational Insights" caption="Where to focus first.">
              <div className="flex flex-wrap gap-4">
                <InsightBox label="Top Site With Issues" value={result.insights.topWarehouse} />
                <InsightBox label="Most Common Failure Reason" value={result.insights.topReason} />
                <InsightBox label="Oldest Stuck Shipment" value={`${result.insights.oldestStuck} old`} />
              </div>
            </Section>

            {/* Revenue Protection Queue */}
            <Section
              title="Revenue Protection Queue"
              caption="Orders that shipped but are not booked in AX / not confirmed to the customer. This is live money at risk."
            >
              {/* Filters + Export */}
              <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse / DC</label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SLA Risk</label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value as any)}
                      className="w-full max-w-[150px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="high">High (breach &lt;2h)</option>
                      <option value="medium">Medium (8–24h)</option>
                      <option value="low">Low (&lt;8h)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pickticket, Order, Reason…"
                      className="w-full max-w-[220px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Export dropdown */}
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
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 text-sm">
                    <button
                      onClick={handleDownloadCSV}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-gray-800"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">CSV</span>
                    </button>
                    <button
                      onClick={handleDownloadJSON}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-gray-800"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">JSON</span>
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-gray-800"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">PDF (Exec Brief)</span>
                    </button>
                    <div className="my-1 border-t border-gray-200" />
                    <button
                      onClick={handleDownloadAudit}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-gray-800"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="font-medium">Audit Package (.zip)</span>
                    </button>
                  </div>
                )}
              </div>
              </div>

              {/* Count + Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 flex items-center gap-2 border-b border-gray-200">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span>
                    {filteredShipments.length} record{filteredShipments.length === 1 ? '' : 's'} shown
                  </span>
                </div>
                <div className="bg-white">
                  <DataTable data={filteredShipments} />
                </div>
              </div>
            </Section>

            {/* Create Fix Ticket (collapsible) */}
            <Section
              title="Create Fix Ticket"
              caption="Generate & route a structured escalation with all impacted shipments to the right team."
              collapsible
              defaultOpen={false}
            >
              <div className="space-y-6">
                {/* Routing target */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">Routing target</div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-800">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="escalationMode"
                        value="warehouse"
                        checked={escalationMode === 'warehouse'}
                        onChange={() => setEscalationMode('warehouse')}
                      />
                      <span>Specific Warehouse / DC</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="escalationMode"
                        value="internal"
                        checked={escalationMode === 'internal'}
                        onChange={() => setEscalationMode('internal')}
                      />
                      <span>Internal AX / EDI / Finance team</span>
                    </label>
                  </div>
                </div>

                {/* Destination picker */}
                <div className="space-y-3">
                  {escalationMode === 'warehouse' ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse / DC</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Internal Team</label>
                      <select
                        value={selectedInternalTeam}
                        onChange={(e) => setSelectedInternalTeam(e.target.value)}
                        className="w/full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleGenerateEmail}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Generate Ticket Draft
                  </button>

                  <button
                    onClick={handleCopyEmail}
                    className="bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Draft
                  </button>

                  {emailReady && (
                    <button
                      onClick={handleSendEmail}
                      className="bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Open Ticket / Notify Team
                    </button>
                  )}
                </div>

                {/* Preview */}
                {emailDraft && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-red-900 mb-2">Ticket Preview</div>
                    <div className="bg-white border border-red-200 rounded-lg p-4 font-mono text-xs text-gray-800 whitespace-pre-wrap">
                      {emailDraft}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Trends */}
            <Section
              title="Throughput & Stability"
              caption="Today vs trailing 7 days. Are we getting faster or falling behind?"
              className="bg-[#0f172a] border border-gray-700 text-white"
            >
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
                <div className="text-white font-semibold mb-2 text-lg">Trend of Stuck Shipments (incl. Today)</div>
                <TrendLineChart data={trendChartData} />
              </div>
            </Section>

            {/* Leaderboard */}
            <Section
              title="Site Performance Leaderboard"
              caption="Which DCs are driving the most revenue risk and delay right now."
              className="bg-[#0f172a] border border-gray-700 text-white"
            >
              <div className="mb-4 flex flex-wrap items-end gap-4">
                <div className="text-sm text-gray-300 font-medium">Ranking metric</div>
                <select
                  value={barMetric}
                  onChange={(e) => setBarMetric(e.target.value as any)}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="stuckCount">Open Shipments Stuck</option>
                  <option value="avgAgeHrs">Avg Aging (hrs)</option>
                  <option value="failureRatePct">Load Failure %</option>
                </select>
              </div>

              <CustomBarCompareChart data={perWarehouseStats} metric={barMetric} />
            </Section>

            {/* Footer */}
            <div className="text-xs text-gray-400 text-center py-4">
              ENV: DEMO — This dashboard replaces manual VLOOKUP across DHL / AX / EDI. It quantifies unbooked revenue,
              flags SLA exposure, and routes fix tickets in one click.
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
