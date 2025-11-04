import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface StuckRow {
  Pickticket: string;
  Order: string;
  Warehouse: string;
  'Ship To'?: string;
  'Issue Summary'?: string;
  AgeHours?: number | string;
  Severity?: 'high' | 'medium' | 'low' | string;
  OrderValue?: number | string;
}

interface DataTableProps {
  data: StuckRow[];
}

function SLABadge({ age }: { age?: number }) {
  const a = typeof age === 'number' ? age : Number(age ?? 0);
  if (a >= 24) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200 rounded px-2 py-[2px] leading-none">
        <AlertTriangle className="w-3 h-3" />
        Breach Risk
      </span>
    );
  }
  if (a >= 8) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 rounded px-2 py-[2px] leading-none">
        Approaching SLA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 rounded px-2 py-[2px] leading-none">
      Stable
    </span>
  );
}

export default function DataTable({ data }: DataTableProps) {
  return (
    <div className="overflow-x-auto text-sm">
      <table className="min-w-full w-full table-fixed text-left border-collapse">
        {/* Column widths so the table fills evenly with no dead gutter */}
        <colgroup>
          <col className="w-[12%]" /> {/* Pickticket */}
          <col className="w-[12%]" /> {/* Order */}
          <col className="w-[13%]" /> {/* Warehouse */}
          <col className="w-[18%]" /> {/* Ship To */}
          <col className="w-[30%]" /> {/* Issue / Reason */}
          <col className="w-[7%]" />  {/* Age */}
          <col className="w-[8%]" />  {/* SLA */}
        </colgroup>

        <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Pickticket</th>
            <th className="px-4 py-2 font-medium">Order</th>
            <th className="px-4 py-2 font-medium">Warehouse</th>
            <th className="px-4 py-2 font-medium">Ship To</th>
            <th className="px-4 py-2 font-medium">Issue / Reason</th>
            <th className="px-4 py-2 font-medium text-right">Age (hrs)</th>
            <th className="px-4 py-2 font-medium">SLA</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white text-[13px] text-gray-800">
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                No matching exceptions. Nice work.
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const age =
                row.AgeHours !== undefined && row.AgeHours !== null
                  ? Number(row.AgeHours)
                  : undefined;

              return (
                <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-[12px] text-gray-900 truncate">
                    {row.Pickticket || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-gray-900 truncate">
                    {row.Order || '—'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-gray-900 font-medium truncate">
                      {row.Warehouse || '—'}
                    </div>
                    {row.Severity && (
                      <div
                        className={`text-[10px] font-semibold ${
                          row.Severity === 'high'
                            ? 'text-red-600'
                            : row.Severity === 'medium'
                            ? 'text-amber-600'
                            : 'text-gray-500'
                        }`}
                      >
                        Priority: {String(row.Severity).slice(0,1).toUpperCase() + String(row.Severity).slice(1)}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="leading-tight truncate">{row['Ship To'] || '—'}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-gray-900 leading-tight truncate">
                      {row['Issue Summary'] || 'AX Load Failure'}
                    </div>
                    <div className="text-[11px] text-gray-500 leading-tight">
                      Shipped but not posted / not confirmed
                    </div>
                  </td>

                  <td className="px-4 py-3 font-mono text-[12px] text-right text-gray-900">
                    {age !== undefined && !Number.isNaN(age) ? age : '—'}
                  </td>

                  <td className="px-4 py-3">
                    <SLABadge age={age} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
