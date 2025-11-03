import type {
  DHLShipment,
  B2BiRecord,
  AXRecord,
  MergedRecord,
  StuckShipment,
  ReconciliationResult,
} from '../types';

export function classifyIssueReason(message: string): string {
  if (!message) return 'Check Message';

  const msg = message.toLowerCase();
  if (msg.includes('credit') || msg.includes('hold')) return 'Credit / On Hold';
  if (msg.includes('mismatch')) return 'Qty Mismatch';
  if (msg.includes('not found')) return 'Pickticket Not Found';
  if (msg.includes('failure')) return 'AX Load Failure';
  return 'Other / Review';
}

export function calculateAgeHours(row: MergedRecord | StuckShipment): number | null {
  const now = new Date();

  for (const col of ['Ship Date', 'PickCreatedDate']) {
    const value = row[col as keyof typeof row];
    if (value) {
      try {
        const dt = new Date(value as string);
        if (!isNaN(dt.getTime())) {
          return (now.getTime() - dt.getTime()) / (1000 * 60 * 60);
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

export function getAgeBadgeInfo(ageHours: number | null): {
  label: string;
  badgeClass: string;
  severity: 'low' | 'medium' | 'high' | 'unknown';
} {
  if (ageHours === null) {
    return { label: 'Unknown', badgeClass: 'badge-neutral', severity: 'unknown' };
  }

  if (ageHours < 4) {
    return { label: `Fresh (${Math.round(ageHours)}h)`, badgeClass: 'badge-success', severity: 'low' };
  } else if (ageHours < 24) {
    return { label: `Watch (${Math.round(ageHours)}h)`, badgeClass: 'badge-warning', severity: 'medium' };
  } else {
    return { label: `Escalate (${Math.round(ageHours)}h)`, badgeClass: 'badge-danger', severity: 'high' };
  }
}

export function reconcileData(
  dhlData: Record<string, string>[],
  b2biData: Record<string, string>[],
  axData: Record<string, string>[]
): ReconciliationResult {
  const dhlShipments = dhlData as unknown as DHLShipment[];
  const b2biRecords = b2biData as unknown as B2BiRecord[];
  const axRecords = axData as unknown as AXRecord[];

  const b2biMap = new Map(b2biRecords.map(r => [r.AXReferenceID, r]));
  const axMap = new Map(axRecords.map(r => [r.PickRoute, r]));

  const merged: MergedRecord[] = dhlShipments.map(dhl => {
    const b2bi = b2biMap.get(dhl.Pickticket);
    const ax = axMap.get(dhl.Pickticket);

    return {
      ...dhl,
      'Received in EDI?': b2bi?.InvoiceNumber || '',
      'EDI Processing Status': b2bi?.StatusSummary || '',
      'EDI Message': b2bi?.ERRORDESCRIPTION || '',
      'Found in AX?': ax?.PickRoute || '',
      SalesHeaderStatus: ax?.SalesHeaderStatus || '',
      SalesHeaderDocStatus: ax?.SalesHeaderDocStatus || '',
      PickModeOfDelivery: ax?.PickModeOfDelivery || '',
      PickCreatedDate: ax?.PickCreatedDate || '',
      DeliveryDate: ax?.DeliveryDate || '',
    };
  });

  const filtered = merged.filter(
    m => m.SalesHeaderDocStatus === 'Picking List' && m['EDI Processing Status'] === 'AX Load Failure'
  );

  const seenPicktickets = new Set<string>();
  const deduplicated = filtered.filter(item => {
    if (seenPicktickets.has(item.Pickticket)) return false;
    seenPicktickets.add(item.Pickticket);
    return true;
  });

  const stuckShipments: StuckShipment[] = deduplicated.map(record => {
    const issueSummary = classifyIssueReason(record['EDI Message']);
    const ageHours = calculateAgeHours(record);
    const ageBadgeInfo = getAgeBadgeInfo(ageHours);

    return {
      ...record,
      'Issue Summary': issueSummary,
      'Age Hours': ageHours,
      'Age Label': ageBadgeInfo.label,
      'Age Badge Class': ageBadgeInfo.badgeClass,
      Severity: ageBadgeInfo.severity,
    };
  });

  const totalShipments = dhlShipments.length;
  const totalFailures = merged.filter(m => m['EDI Processing Status'] === 'AX Load Failure').length;
  const totalStuck = stuckShipments.length;

  const warehouseCounts = new Map<string, number>();
  stuckShipments.forEach(s => {
    const wh = s.Warehouse || 'Unknown';
    warehouseCounts.set(wh, (warehouseCounts.get(wh) || 0) + 1);
  });

  const topWhEntry = Array.from(warehouseCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const topWarehouse = topWhEntry ? `${topWhEntry[0]} (${topWhEntry[1]} stuck)` : '—';

  const reasonCounts = new Map<string, number>();
  stuckShipments.forEach(s => {
    const reason = s['Issue Summary'];
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  });

  const topReasonEntry = Array.from(reasonCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const topReason = topReasonEntry ? topReasonEntry[0] : '—';

  const oldestHours = Math.max(...stuckShipments.map(s => s['Age Hours'] || 0));
  const oldestStuck = oldestHours > 0 ? `${Math.round(oldestHours)}h` : '—';

  return {
    summary: { totalShipments, totalFailures, totalStuck },
    insights: { topWarehouse, topReason, oldestStuck },
    stuckShipments,
    fullData: merged,
  };
}

export function generateEmailDraft(stuckShipments: StuckShipment[], warehouse: string): string {
  const filtered = warehouse === 'All Warehouses'
    ? stuckShipments
    : stuckShipments.filter(s => s.Warehouse === warehouse);

  if (filtered.length === 0) {
    return 'No stuck shipments for that selection.';
  }

  const count = filtered.length;
  const oldestAge = Math.max(...filtered.map(s => s['Age Hours'] || 0));
  const oldestLabel = oldestAge > 0 ? `${Math.round(oldestAge)}h` : 'Unknown';

  const reasonCounts = new Map<string, number>();
  filtered.forEach(s => {
    const reason = s['Issue Summary'];
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  });

  const mainReason = Array.from(reasonCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const picktickets = filtered.slice(0, 10).map(s => s.Pickticket).join(', ');
  const pickList = filtered.length > 10 ? `${picktickets}, ...` : picktickets;

  const subject = `ACTION REQUIRED — ${count} stuck 945s (${warehouse}, oldest ${oldestLabel})`;

  const body = `Team,

The following shipments physically departed the warehouse but have not successfully posted in AX
and have not generated customer confirmation.

Warehouse: ${warehouse}
Impact Count: ${count}
Primary Failure Reason: ${mainReason}
Oldest Open Shipment Age: ${oldestLabel}

These orders are at risk of:
 • customer escalation ("Where is my shipment?")
 • delayed invoicing / revenue posting

Picktickets impacted:
${pickList}

Please review and re-process these 945s in AX / B2Bi.

Thanks,
Reconciliation Dashboard`;

  return `Subject: ${subject}\n\n${body}`;
}
