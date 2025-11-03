import type { StuckShipment } from '../types';

interface DataTableProps {
  data: StuckShipment[];
}

export default function DataTable({ data }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No stuck shipments found. All systems synchronized.
      </div>
    );
  }

  const columns = [
    { key: 'Pickticket', label: 'Pickticket' },
    { key: 'Warehouse', label: 'Warehouse' },
    { key: 'Order', label: 'Order' },
    { key: 'Ship To', label: 'Ship To' },
    { key: 'Ship State', label: 'State' },
    { key: 'Ship Date', label: 'Ship Date' },
    { key: 'Issue Summary', label: 'Issue' },
    { key: 'Age Label', label: 'Age' },
    { key: 'EDI Message', label: 'EDI Message' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-gray-700">
                  {col.key === 'Age Label' ? (
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold text-white ${
                        row.Severity === 'high'
                          ? 'bg-red-600'
                          : row.Severity === 'medium'
                          ? 'bg-amber-500'
                          : row.Severity === 'low'
                          ? 'bg-green-500'
                          : 'bg-gray-500'
                      }`}
                    >
                      {row['Age Label']}
                    </span>
                  ) : (
                    <span className="truncate max-w-xs block">
                      {String(row[col.key as keyof StuckShipment] || '—')}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
