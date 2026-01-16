
export interface ColorGroupData {
  groupName: string;
  weight: number;
  percentage?: number;
}

export interface IndustryData {
  name: string;
  total: number;
  loadingCap?: number;
  colorGroups: ColorGroupData[];
  inhouse: number;
  subContract: number;
}

export interface ProductionRecord {
  id: string;
  date: string; // ISO format or DD MMM YYYY
  lantabur: IndustryData;
  taqwa: IndustryData;
  totalProduction: number;
  createdAt: string;
}

export interface RFTBatchEntry {
  mc: string;
  batchNo: string;
  buyer: string;
  order: string;
  colour: string;
  colorGroup: string;
  fType: string;
  fQty: number;
  loadCapPercent: number;
  shadeOk: boolean;
  shadeNotOk: boolean;
  dyeingType: string;
  shiftUnload: string;
  remarks: string;
}

export interface RFTReportRecord {
  id: string;
  date: string;
  unit: string;
  companyName: string;
  entries: RFTBatchEntry[];
  bulkRftPercent: number;
  labRftPercent: number;
  shiftPerformance: {
    yousuf: number;
    humayun: number;
  };
  shiftCount: {
    yousuf: number;
    humayun: number;
  };
  manualNotOk?: {
    yousuf: number;
    humayun: number;
  };
  manualNotOkFormula?: {
    yousuf: string;
    humayun: string;
  };
  manualReMatching?: {
    yousuf: number;
    humayun: number;
  };
  manualReMatchingFormula?: {
    yousuf: string;
    humayun: string;
  };
  manualNote?: {
    yousuf: string;
    humayun: string;
  };
  createdAt: string;
}

export interface DashboardStats {
  todayTotal: number;
  monthTotal: number;
  yearTotal: number;
  industryComparison: {
    lantabur: number;
    taqwa: number;
  };
}

export type ThemeType = 'light' | 'dark' | 'material' | 'tokio-night' | 'monokai' | 'dracula';

export type AccentType = 'indigo' | 'blue' | 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan';

export interface AppSettings {
  theme: ThemeType;
  accent: AccentType;
}
