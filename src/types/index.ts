export interface DHLShipment {
  Warehouse: string;
  Pickticket: string;
  Order: string;
  'Drop Date': string;
  'Ship Date': string;
  'Ship To': string;
  'Ship State': string;
  'Zip Code': string;
  'Customer PO': string;
  'Ship Via': string;
  'Load ID': string;
  Weight: string;
  SKU: string;
  Units: string;
  Price: string;
  'Size Type': string;
  Size: string;
  'Product Type': string;
}

export interface B2BiRecord {
  AXReferenceID: string;
  InvoiceNumber: string;
  StatusSummary: string;
  ERRORDESCRIPTION: string;
}

export interface AXRecord {
  PickRoute: string;
  SalesHeaderStatus: string;
  SalesHeaderDocStatus: string;
  PickModeOfDelivery: string;
  PickCreatedDate: string;
  DeliveryDate: string;
}

export interface MergedRecord extends DHLShipment {
  'Received in EDI?': string;
  'EDI Processing Status': string;
  'EDI Message': string;
  'Found in AX?': string;
  SalesHeaderStatus: string;
  SalesHeaderDocStatus: string;
  PickModeOfDelivery: string;
  PickCreatedDate: string;
  DeliveryDate: string;
}

export interface StuckShipment extends MergedRecord {
  'Issue Summary': string;
  'Age Hours': number | null;
  'Age Label': string;
  'Age Badge Class': string;
  Severity: 'low' | 'medium' | 'high' | 'unknown';
}

export interface ReconciliationSummary {
  totalShipments: number;
  totalFailures: number;
  totalStuck: number;
}

export interface Insights {
  topWarehouse: string;
  topReason: string;
  oldestStuck: string;
}

export interface ReconciliationResult {
  summary: ReconciliationSummary;
  insights: Insights;
  stuckShipments: StuckShipment[];
  fullData: MergedRecord[];
}
