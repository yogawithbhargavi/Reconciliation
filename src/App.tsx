import { useState } from 'react';
import { Download, Mail, PlayCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import Section from './components/Section';
import KPICard from './components/KPICard';
import InsightBox from './components/InsightBox';
import FileUploader from './components/FileUploader';
import InfoBox from './components/InfoBox';
import DataTable from './components/DataTable';
import BarChart from './components/BarChart';
import { parseCSV } from './utils/csv-parser';
import { reconcileData, generateEmailDraft } from './utils/reconciliation';
import { exportToCSV } from './utils/export';
import type { ReconciliationResult } from './types';

function App() {
  const [dhlFile, setDhlFile] = useState<File | null>(null);
  const [b2biFile, setB2biFile] = useState<File | null>(null);
  const [axFile, setAxFile] = useState<File | null>(null);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses');
  const [emailDraft, setEmailDraft] = useState('');

  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: 'America/Chicago',
  }) + ' CT';

  const handleRunReconciliation = async () => {
    if (!dhlFile || !b2biFile || !axFile) {
      alert('Please upload all three files to run reconciliation.');
      return;
    }

    setLoading(true);
    try {
      const [dhlData, b2biData, axData] = await Promise.all([
        parseCSV(dhlFile),
        parseCSV(b2biFile),
        parseCSV(axFile),
      ]);

      const reconciliationResult = reconcileData(dhlData, b2biData, axData);
      setResult(reconciliationResult);
    } catch (error) {
      console.error('Reconciliation error:', error);
      alert('Error processing files. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEmail = () => {
    if (!result) return;
    const draft = generateEmailDraft(result.stuckShipments, selectedWarehouse);
    setEmailDraft(draft);
  };

  const handleDownload = () => {
    if (!result) return;
    const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '');
    exportToCSV(result.stuckShipments, `MISSING_945_${today}.csv`);
  };

  const warehouses = result
    ? ['All Warehouses', ...Array.from(new Set(result.stuckShipments.map(s => s.Warehouse))).sort()]
    : ['All Warehouses'];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar timestamp={timestamp} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Missing 945 Reconciliation
          </h2>
          <p className="text-sm text-gray-600">
            Warehouse shipped vs AX posted vs EDI confirmation
          </p>
        </div>

        <Section title="Data Inputs" caption="These are the 3 source-of-truth systems this reconciliation depends on.">
          <div className="flex flex-wrap gap-4 mb-6">
            <FileUploader
              label="1. DHL Shipment History"
              hint="Physical shipments from DHL (what actually left the building)."
              file={dhlFile}
              onChange={setDhlFile}
            />
            <FileUploader
              label="2. B2Bi / EDI Results"
              hint="Did AX accept the 945, or did it fail to load?"
              file={b2biFile}
              onChange={setB2biFile}
            />
            <FileUploader
              label="3. AX Status Snapshot"
              hint="AX view of order state (Picking List / Packing Slip / Invoiced)."
              file={axFile}
              onChange={setAxFile}
            />
          </div>
          <button
            onClick={handleRunReconciliation}
            disabled={loading || !dhlFile || !b2biFile || !axFile}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            {loading ? 'Processing...' : 'Run Reconciliation'}
          </button>
        </Section>

        <InfoBox>
          <strong>Three-way reconciliation:</strong>
          <br />
          1. DHL Shipment History → what actually shipped.
          <br />
          2. B2Bi / EDI Results → did AX accept or reject the 945 confirmation.
          <br />
          3. AX 940 Snapshot → AX's current truth (still Picking List? invoiced?).
          <br />
          <br />
          We surface only the orders that were shipped, failed to load in AX ("AX Load Failure"),
          and AX still shows them in Picking List. Those are your "still stuck / action required" orders.
        </InfoBox>

        {result && (
          <>
            <Section title="Today's Health" caption="Live reconciliation snapshot">
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
                  subtitle="Physically shipped but AX still shows Picking List"
                  valueColor="text-red-600"
                />
              </div>
            </Section>

            <Section title="Operational Insights" caption="Where should we focus first?">
              <div className="flex flex-wrap gap-4">
                <InsightBox label="Top Warehouse With Issues" value={result.insights.topWarehouse} />
                <InsightBox label="Most Common Failure Reason" value={result.insights.topReason} />
                <InsightBox label="Oldest Stuck Shipment" value={`${result.insights.oldestStuck} old`} />
              </div>
            </Section>

            <Section title="Reconciliation Overview" caption="Scale of risk across today's orders">
              <BarChart
                data={[
                  { label: 'Total Shipped', value: result.summary.totalShipments, color: 'bg-blue-500' },
                  { label: 'AX Load Failures', value: result.summary.totalFailures, color: 'bg-amber-500' },
                  { label: 'Still Stuck', value: result.summary.totalStuck, color: 'bg-red-600' },
                ]}
              />
            </Section>

            <Section
              title="Shipments Requiring Action"
              caption="These orders shipped but are still not posted in AX / not confirmed back to the customer."
            >
              <DataTable data={result.stuckShipments} />
            </Section>

            <Section
              title="Escalation / Notify Ops"
              caption="Generate an escalation email draft by warehouse. This is how we operationalize the handoff to AX / EDI teams."
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select warehouse to escalate:
                  </label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {warehouses.map(wh => (
                      <option key={wh} value={wh}>
                        {wh}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleGenerateEmail}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Generate Email Draft
                </button>
                {emailDraft && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-red-900 mb-2">Email Preview</div>
                    <div className="bg-white border border-red-200 rounded-lg p-4 font-mono text-xs text-gray-800 whitespace-pre-wrap">
                      {emailDraft}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            <Section
              title="Download Exception Report"
              caption="CSV handoff for audit, finance, or manual AX/B2Bi re-processing."
            >
              <button
                onClick={handleDownload}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV Report
              </button>
            </Section>

            <div className="text-xs text-gray-400 text-center py-4">
              This dashboard replaces manual VLOOKUP-based reconciliation across DHL, AX, and the B2Bi layer.
              It surfaces only revenue-impacting / SLA-risk orders, prioritizes them by age/severity,
              and streamlines escalation to the responsible ops team.
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
