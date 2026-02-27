import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { ProductionRecord, ColorGroupData } from './types';
import { extractProductionData } from './services/geminiService';
import { parseCustomDate } from './App';
import { ProductionTrendChart, DownloadButton } from './components/Charts';
import { PasskeyModal } from './components/PasskeyModal';
import { 
  Upload, Loader2, Trash2, Search, 
  Copy, FileSpreadsheet, Activity, Factory, AlertCircle, CheckCircle2,
  PieChart as PieChartIcon, X, BarChart2, AlertTriangle, Calendar, FilterX, Filter,
  Sigma, BarChart3, TrendingUp, Info, Table as TableIcon, Layers, Maximize2,
  Edit3, Save, ArrowRight, MousePointer2, Target, Droplets, Zap, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,
  ComposedChart, LabelList
} from 'recharts';

interface ProductionDataProps {
  records: ProductionRecord[];
  onAddRecord: (record: ProductionRecord, replaceId?: string) => void;
  onDeleteRecord: (id: string) => void;
  onLoadFullHistory?: () => void;
}

type TabType = 'history' | 'lantabur' | 'taqwa';

const CHART_COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a', '#a855f7', '#f97316', '#14b8a6'];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export const ProductionData: React.FC<ProductionDataProps> = ({ records, onAddRecord, onDeleteRecord, onLoadFullHistory }) => {
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [isUploading, setIsUploading] = useState(false);
  const [updatingRecordId, setUpdatingRecordId] = useState<string | null>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  const [selectedRecordForChart, setSelectedRecordForChart] = useState<{ record: ProductionRecord, mode: TabType } | null>(null);
  const [showFilteredSummary, setShowFilteredSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [localRecords, setLocalRecords] = useState<ProductionRecord[]>([]);

  const [passkeyContext, setPasskeyContext] = useState<{ isOpen: boolean; action: () => void; label: string }>({
    isOpen: false,
    action: () => {},
    label: ''
  });

  const requestAdmin = (label: string, action: () => void) => {
    setPasskeyContext({ isOpen: true, action, label });
  };

  const colorGroupNames = [
    '100% Polyester', 'Average', 'Black', 'Dark', 'Extra Dark', 
    'DOUBLE PART', 'Light', 'Medium', 'N/wash', 'Royal', 'White'
  ];

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = parseCustomDate(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear().toString();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        const extracted = await extractProductionData(base64, file.type);
        const newRecord: ProductionRecord = {
          id: (updatingRecordId as any) || crypto.randomUUID(),
          date: extracted.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          lantabur: { ...extracted.lantabur, name: 'Lantabur' },
          taqwa: { ...extracted.taqwa, name: 'Taqwa' },
          totalProduction: (extracted.lantabur.total || 0) + (extracted.taqwa.total || 0),
          createdAt: new Date().toISOString(),
        };
        onAddRecord(newRecord, (updatingRecordId as any) || undefined);
        setSuccess(updatingRecordId ? "Record updated!" : "Data synced!");
        setIsUploading(false);
        setUpdatingRecordId(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to process file.");
      setIsUploading(false);
    }
  };

  const getGroupValue = (groups: ColorGroupData[], name: string): number => {
    if (!groups) return 0;
    const searchName = name.trim().toUpperCase();
    
    // Sum all entries that match the name or variants
    return groups.reduce((acc, g) => {
      const gn = (g.groupName || "").trim().toUpperCase();
      
      // Special logic for DOUBLE PART aggregation
      if (searchName === 'DOUBLE PART') {
        if (gn === 'DOUBLE PART' || 
            gn === 'DOUBLE PART -BLACK' || 
            gn === 'DOUBLE PART -BLAC' || 
            gn === 'DOUBLE PART-BLACK' || 
            gn === 'DOUBLE PART-BLAC' ||
            gn === 'DOUBLE PART - BLACK') {
          return acc + (Number(g.weight) || 0);
        }
      } 
      // Special logic for N/WASH normalization
      else if (searchName === 'N/WASH') {
        if (gn === 'N/WASH' || gn === 'NORMAL WASH' || gn === 'N-WASH') {
          return acc + (Number(g.weight) || 0);
        }
      }
      // Exact match for other categories
      else if (gn === searchName) {
        return acc + (Number(g.weight) || 0);
      }
      
      return acc;
    }, 0);
  };

  const filteredRecords = useMemo(() => {
    const base = isEditing ? localRecords : records;
    return base
      .filter(r => {
        const d = parseCustomDate(r.date);
        const matchesMonth = d.getMonth() === filterMonth;
        const matchesYear = d.getFullYear() === filterYear;
        const matchesSearch = r.date.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesRange = true;
        if (startDate || endDate) {
          const recordTime = d.getTime();
          if (startDate && recordTime < new Date(startDate).setHours(0,0,0,0)) matchesRange = false;
          if (endDate && recordTime > new Date(endDate).setHours(23,59,59,999)) matchesRange = false;
        }
        
        return matchesMonth && matchesYear && matchesSearch && matchesRange;
      })
      .sort((a, b) => parseCustomDate(b.date).getTime() - parseCustomDate(a.date).getTime());
  }, [records, localRecords, isEditing, searchQuery, startDate, endDate, filterMonth, filterYear]);

  const handleRetrieve = () => {
    setIsRetrieving(true);
    if (onLoadFullHistory) {
      onLoadFullHistory();
    }
    setTimeout(() => setIsRetrieving(false), 800);
  };

  const totals = useMemo(() => {
    const stats = {
      lantaburTotal: 0,
      taqwaTotal: 0,
      combinedTotal: 0,
      industryTotal: 0,
      inhouse: 0,
      subContract: 0,
      colorGroups: {} as Record<string, number>,
      lantaburColors: {} as Record<string, number>,
      taqwaColors: {} as Record<string, number>
    };

    filteredRecords.forEach(r => {
      const lTotal = r.lantabur.inhouse + r.lantabur.subContract;
      const tTotal = r.taqwa.inhouse + r.taqwa.subContract;
      
      stats.lantaburTotal += lTotal;
      stats.taqwaTotal += tTotal;
      stats.combinedTotal += (lTotal + tTotal);

      colorGroupNames.forEach(name => {
        const lVal = getGroupValue(r.lantabur.colorGroups, name);
        const tVal = getGroupValue(r.taqwa.colorGroups, name);
        stats.lantaburColors[name] = (stats.lantaburColors[name] || 0) + lVal;
        stats.taqwaColors[name] = (stats.taqwaColors[name] || 0) + tVal;
        stats.colorGroups[name] = (stats.colorGroups[name] || 0) + lVal + tVal;
      });

      if (activeTab === 'history') {
        stats.inhouse += r.lantabur.inhouse + r.taqwa.inhouse;
        stats.subContract += r.lantabur.subContract + r.taqwa.subContract;
      } else {
        const ind = r[activeTab as 'lantabur' | 'taqwa'];
        stats.industryTotal += (ind.inhouse + ind.subContract);
        stats.inhouse += ind.inhouse;
        stats.subContract += ind.subContract;
      }
    });

    return stats;
  }, [filteredRecords, activeTab]);

  const analyticsData = useMemo(() => {
    const sourceMap = activeTab === 'history' ? totals.colorGroups : (activeTab === 'lantabur' ? totals.lantaburColors : totals.taqwaColors);
    const totalWeight = activeTab === 'history' ? totals.combinedTotal : totals.industryTotal;
    return {
      sourceMap,
      totalWeight,
      chartData: Object.entries(sourceMap)
        .map(([name, weight]) => ({ name, weight: weight as any }))
        .filter(d => d.weight > 0)
        .sort((a,b) => b.weight - a.weight)
    };
  }, [activeTab, totals]);

  const handleCopy = (record: ProductionRecord, type: 'lantabur' | 'taqwa' | 'combined') => {
    const getIndustryBlock = (industry: 'lantabur' | 'taqwa') => {
      const data = record[industry];
      const actualIndustryTotal = data.inhouse + data.subContract;
      const getPercent = (val: number) => ((val / Math.max(1, actualIndustryTotal)) * 100).toFixed(2);
      const activeGroups = colorGroupNames.map(name => ({ name, weight: getGroupValue(data.colorGroups, name) })).filter(group => group.weight > 0);
      const groupsString = activeGroups.map(g => `${g.name}: ${g.weight.toLocaleString()} kg (${getPercent(g.weight)}%)`).join('\n');
      
      const recDate = parseCustomDate(record.date);
      const mRecords = records.filter(r => {
        const d = parseCustomDate(r.date);
        return d.getMonth() === recDate.getMonth() && d.getFullYear() === recDate.getFullYear();
      });
      const mTotal = mRecords.reduce((s, r) => s + (r[industry].inhouse + r[industry].subContract), 0);
      const mAvg = mTotal / (mRecords.length || 1);

      return `╰─> ${industry.charAt(0).toUpperCase() + industry.slice(1)} Data:
Total = ${actualIndustryTotal.toLocaleString()} kg
${groupsString}

Inhouse: ${data.inhouse.toLocaleString()} kg (${getPercent(data.inhouse)}%)
Sub Contract: ${data.subContract.toLocaleString()} kg (${getPercent(data.subContract)}%)

LAB RFT:
Total this month: ${mTotal.toLocaleString()} kg
Avg/day: ${mAvg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
    };

    let text = `Date: ${formatDisplayDate(record.date)}`;
    if (type === 'combined') {
      text += `\n----------------------------\n${getIndustryBlock('lantabur')}\n\n${getIndustryBlock('taqwa')}`;
    } else {
      text += `\n----------------------------\n${getIndustryBlock(type)}`;
    }

    navigator.clipboard.writeText(text).then(() => { 
      setSuccess("Summary copied!"); 
      setTimeout(() => setSuccess(null), 3000); 
    });
  };

  const handleExportCSV = () => {
    const tabLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    const monthLabel = MONTHS[filterMonth];
    const filename = `${tabLabel} Production Table (${monthLabel} ${filterYear}).csv`;

    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeTab === 'history') {
      headers = ["Date", "Lantabur Total", "Taqwa Total", "Daily Total", "Inhouse Total", "Subcon Total"];
      rows = filteredRecords.map(r => [
        r.date,
        r.lantabur.inhouse + r.lantabur.subContract,
        r.taqwa.inhouse + r.taqwa.subContract,
        (r.lantabur.inhouse + r.lantabur.subContract) + (r.taqwa.inhouse + r.taqwa.subContract),
        r.lantabur.inhouse + r.taqwa.inhouse,
        r.lantabur.subContract + r.taqwa.subContract
      ]);
    } else {
      const industryKey = activeTab as 'lantabur' | 'taqwa';
      headers = ["Date", `${tabLabel} Total`, "Inhouse", "Subcon", ...colorGroupNames];
      rows = filteredRecords.map(r => {
        const ind = r[industryKey];
        const row = [
          r.date,
          ind.inhouse + ind.subContract,
          ind.inhouse,
          ind.subContract
        ];
        colorGroupNames.forEach(name => {
          row.push(getGroupValue(ind.colorGroups, name));
        });
        return row;
      });
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess("Data exported successfully!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const updateLocalCellValue = (recordId: string, industry: 'lantabur' | 'taqwa' | null, field: string, value: number) => {
    setLocalRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const updatedRec = { ...rec };
        if (industry) {
          const updatedInd = { ...updatedRec[industry] };
          if (field === 'total') { updatedInd.total = value; updatedInd.inhouse = Math.max(0, updatedInd.total - updatedInd.subContract); }
          else if (field === 'inhouse') { updatedInd.inhouse = value; updatedInd.total = updatedInd.inhouse + updatedInd.subContract; }
          else if (field === 'subContract') { updatedInd.subContract = value; updatedInd.total = updatedInd.inhouse + updatedInd.subContract; }
          updatedRec[industry] = updatedInd;
        }
        updatedRec.totalProduction = (updatedRec.lantabur.inhouse + updatedRec.lantabur.subContract) + (updatedRec.taqwa.inhouse + updatedRec.taqwa.subContract);
        return updatedRec;
      }
      return rec;
    }));
  };

  const getRowDisplayData = (r: ProductionRecord, tab: TabType) => {
    if (tab === 'history') {
      const combinedColorGroups = colorGroupNames.map(name => ({
        groupName: name,
        weight: getGroupValue(r.lantabur.colorGroups, name) + getGroupValue(r.taqwa.colorGroups, name)
      }));
      const lTot = r.lantabur.inhouse + r.lantabur.subContract;
      const tTot = r.taqwa.inhouse + r.taqwa.subContract;
      return {
        total: lTot + tTot,
        inhouse: r.lantabur.inhouse + r.taqwa.inhouse,
        subContract: r.lantabur.subContract + r.taqwa.subContract,
        colorGroups: combinedColorGroups
      };
    } else {
      const ind = r[tab];
      return {
        ...ind,
        total: ind.inhouse + ind.subContract
      };
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app-text">Production Data Management</h1>
          <p className="text-app-text-muted text-sm">Industrial Production Node Hub</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-app-card border border-app-border rounded-lg p-1 shadow-sm items-center">
            <div className="px-2 text-app-accent">
              <Calendar size={14} />
            </div>
            <select 
              value={filterMonth} 
              onChange={e => setFilterMonth(Number(e.target.value))} 
              className="bg-transparent text-[10px] font-black uppercase focus:outline-none cursor-pointer border-r border-app-border px-4 py-1.5"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select 
              value={filterYear} 
              onChange={e => setFilterYear(Number(e.target.value))} 
              className="bg-transparent text-[10px] font-black uppercase focus:outline-none cursor-pointer px-4 py-1.5"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex bg-app-card rounded-md p-1 border border-app-border shadow-sm">
            {['history', 'lantabur', 'taqwa'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as TabType)} className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all capitalize ${activeTab === tab ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:bg-app-bg hover:text-app-text'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-app-card p-6 rounded-lg border-2 border-dashed border-app-border text-center hover:border-app-accent transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[140px]" onClick={() => { requestAdmin("Upload Report", () => { setUpdatingRecordId(null); fileInputRef.current?.click(); }); }}>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
          {isUploading ? (
            <div className="py-2"><Loader2 className="animate-spin text-app-accent mx-auto mb-2" size={28} /><p className="text-xs font-medium text-app-text">Extracting...</p></div>
          ) : (
            <div className="py-2">
              <Upload size={32} className="mx-auto text-app-text-muted group-hover:text-app-accent transition-colors mb-2" />
              <h3 className="text-sm font-semibold text-app-text">Upload Daily Report</h3>
              <p className="text-xs text-app-text-muted mt-1">PDF or Image Sync</p>
            </div>
          )}
        </section>
        
        <div className="lg:col-span-2 bg-app-card p-6 rounded-lg border border-app-border shadow-sm flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black text-app-text-muted uppercase tracking-wider">Search Date</label>
              <div className="relative h-[40px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input type="text" placeholder="..." className="w-full h-full pl-9 pr-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-app-accent transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black text-app-text-muted uppercase tracking-wider">From</label>
              <input type="date" className="w-full h-[40px] px-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-app-accent transition-all" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black text-app-text-muted uppercase tracking-wider">To</label>
              <input type="date" className="w-full h-[40px] px-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-app-accent transition-all" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleExportCSV} className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#059669] text-white rounded-lg text-[13px] font-bold hover:bg-[#047857] transition-all shadow-sm">
              <FileSpreadsheet size={16} /> Export Data
            </button>
            <div className="flex gap-3">
              <button onClick={handleRetrieve} disabled={isRetrieving} className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#10b981] text-white rounded-lg text-[13px] font-bold hover:bg-[#059669] transition-all shadow-sm disabled:opacity-50 h-[42px]">
                {isRetrieving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Fetch
              </button>
              <button onClick={() => { setSearchQuery(''); setStartDate(''); setEndDate(''); setFilterMonth(new Date().getMonth()); setFilterYear(new Date().getFullYear()); }} className="flex items-center justify-center gap-2 px-8 py-2.5 bg-app-bg border border-app-border text-app-text-muted rounded-lg text-[13px] font-bold hover:text-app-text transition-all h-[42px]">
                <FilterX size={16} /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-app-card rounded-lg shadow-sm border border-app-border overflow-hidden">
        <div className="p-4 border-b border-app-border bg-app-bg/30 flex justify-between items-center">
          <h3 className="font-semibold text-app-text flex items-center gap-2 capitalize text-sm">
            {activeTab === 'history' ? <Activity size={16} className="text-app-accent" /> : <Factory size={16} className="text-app-accent" />}
            {activeTab} Production Table ({MONTHS[filterMonth]} {filterYear})
          </h3>
          <div className="flex gap-2">
             {!isEditing ? (
               <>
                <button onClick={() => requestAdmin("Manual Production Entry", () => { setLocalRecords([...records]); setIsEditing(true); })} className="w-8 h-8 rounded-full bg-app-accent/10 text-app-accent flex items-center justify-center hover:bg-app-accent hover:text-white transition-all"><Edit3 size={16} /></button>
                <button onClick={() => setShowFilteredSummary(true)} className="w-8 h-8 rounded-full bg-app-accent/10 text-app-accent flex items-center justify-center hover:bg-app-accent hover:text-white transition-all"><Sigma size={16} /></button>
               </>
             ) : (
               <div className="flex gap-2">
                 <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-[10px] font-black uppercase text-app-text-muted border border-app-border rounded-md hover:bg-app-bg transition-all">Cancel</button>
                 <button onClick={() => { localRecords.forEach(rec => onAddRecord(rec, rec.id)); setIsEditing(false); setSuccess("Saved!"); }} className="px-3 py-1.5 text-[10px] font-black uppercase bg-emerald-600 text-white rounded-md shadow-md hover:bg-emerald-700 transition-all"><Save size={14} className="inline mr-1" /> Save</button>
               </div>
             )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {isRetrieving ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={32} className="text-app-accent animate-spin mb-4" />
              <p className="text-xs font-black text-app-text-muted uppercase tracking-widest animate-pulse">Synchronizing Node Data...</p>
            </div>
          ) : (
            <table className="w-full text-center text-[11px] border-collapse min-w-max">
              <thead className="bg-app-bg text-app-text-muted uppercase font-semibold">
                <tr className="border-b border-app-border">
                  <th className="px-3 py-3 sticky left-0 bg-app-bg z-20 border-r border-app-border min-w-[100px] text-center">Date</th>
                  <th className="px-3 py-3 border-r border-app-border">Net Total</th>
                  <th className="px-3 py-3 border-r border-app-border">Inhouse</th>
                  <th className="px-3 py-3 border-r border-app-border">Subcon</th>
                  {colorGroupNames.map(name => <th key={name} className="px-3 py-3 min-w-[90px] border-r border-app-border">{name}</th>)}
                  <th className="px-3 py-3 sticky right-0 bg-app-card z-10 border-l border-app-border text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredRecords.map((r) => {
                  const industry: 'lantabur' | 'taqwa' | null = activeTab === 'history' ? null : activeTab;
                  const displayData = getRowDisplayData(r, activeTab);

                  return (
                    <tr key={r.id} className="table-row-hover group transition-colors">
                      <td className="px-3 py-3 font-bold text-app-text sticky left-0 bg-app-card z-10 border-r border-app-border whitespace-nowrap text-center">{formatDisplayDate(r.date)}</td>
                      <td className="px-3 py-3 font-bold text-app-accent border-r border-app-border">
                        {isEditing && industry ? (
                          <input type="number" className="w-16 bg-app-bg border border-app-border rounded px-1 py-0.5 text-center focus:outline-none" value={displayData.total} onChange={e => updateLocalCellValue(r.id, industry!, 'total', parseFloat(e.target.value) || 0)} />
                        ) : displayData.total.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-emerald-500 font-medium border-r border-app-border">{displayData.inhouse.toLocaleString()}</td>
                      <td className="px-3 py-3 text-amber-600 font-medium border-r border-app-border">{displayData.subContract.toLocaleString()}</td>
                      {colorGroupNames.map(name => (
                        <td key={name} className="px-3 py-3 text-app-text-muted border-r border-app-border">
                          {getGroupValue(displayData.colorGroups, name).toLocaleString()}
                        </td>
                      ))}
                      <td className="px-3 py-3 sticky right-0 bg-app-card z-10 border-l border-app-border">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleCopy(r, activeTab === 'history' ? 'combined' : activeTab)} className="text-app-text-muted hover:text-app-accent transition-colors p-1 rounded-sm hover:bg-app-accent/10"><Copy size={13} /></button>
                          <button onClick={() => setSelectedRecordForChart({ record: r, mode: activeTab })} className="text-app-text-muted hover:text-app-accent transition-colors p-1 rounded-sm hover:bg-app-accent/10"><PieChartIcon size={13} /></button>
                          <button onClick={() => { requestAdmin("Delete Record", () => onDeleteRecord(r.id)); }} className="text-app-text-muted hover:text-rose-500 transition-colors p-1 rounded-sm hover:bg-rose-500/10"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={colorGroupNames.length + 5} className="py-20 text-center opacity-30">
                      <div className="flex flex-col items-center gap-2">
                        <Activity size={40} />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">No entries detected for selected period.</p>
                        <button onClick={handleRetrieve} className="mt-2 text-[10px] font-black uppercase text-app-accent border-b border-app-accent/30 hover:border-app-accent transition-all">Search All Node History</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {showFilteredSummary && (
        <div className="modal-overlay" onClick={() => setShowFilteredSummary(false)}>
          <div className="bg-app-card rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-app-border" onClick={e => e.stopPropagation()}>
            <header className="px-6 py-4 border-b border-app-border flex justify-between items-center bg-app-card shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-app-accent text-app-accent-contrast rounded-md shadow-sm">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-app-text">Data Analytics Summary</h2>
                    <p className="text-xs text-app-text-muted">High-Fidelity Industrial Core // {filteredRecords.length} Data Points</p>
                  </div>
                </div>
                <button onClick={() => setShowFilteredSummary(false)} className="p-2 hover:bg-app-bg rounded-full transition-colors text-app-text-muted"><X size={20} /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-app-bg/10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SummaryKPICard 
                    label={activeTab === 'history' ? 'TOTAL PRODUCTION' : `${activeTab.toUpperCase()} TOTAL`}
                    value={analyticsData.totalWeight}
                    color="indigo"
                  />
                  <SummaryKPICard 
                    label="INHOUSE WEIGHT"
                    value={totals.inhouse}
                    color="emerald"
                  />
                  <SummaryKPICard 
                    label="SUBCON WEIGHT"
                    value={totals.subContract}
                    color="amber"
                  />
               </div>

               <div className="bg-app-card p-8 rounded-2xl border border-app-border shadow-sm">
                  <h3 className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                     <Layers size={16} className="text-[#10b981]" /> Industrial Segment Distribution Intelligence
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
                     {colorGroupNames.map((name, idx) => {
                        const weight = analyticsData.sourceMap[name] || 0;
                        if (weight === 0) return null;
                        const colors: ('indigo' | 'emerald' | 'amber')[] = ['indigo', 'emerald', 'amber'];
                        return <MetricTile key={name} label={name} weight={weight} total={analyticsData.totalWeight} color={colors[idx % 3]} />;
                     })}
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-app-card p-6 rounded-xl border border-app-border shadow-sm">
                    <h3 className="text-sm font-black text-app-text uppercase tracking-widest mb-8 flex items-center gap-2"><TrendingUp size={16} className="text-app-accent" /> Continuous Production Trend</h3>
                    <div className="h-72">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[...filteredRecords].reverse()}>
                             <defs>
                                <linearGradient id="colorSum" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="var(--app-accent)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--app-accent)" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} />
                             <XAxis dataKey="date" hide /><YAxis axisLine={false} tickLine={false} fontSize={10} stroke="var(--app-text-muted)" />
                             <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '11px'}} labelFormatter={l => formatDisplayDate(l)} />
                             <Area type="monotone" dataKey="totalProduction" stroke="var(--app-accent)" fillOpacity={1} fill="url(#colorSum)" strokeWidth={3} />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-app-card p-6 rounded-xl border border-app-border shadow-sm">
                    <h3 className="text-sm font-black text-app-text uppercase tracking-widest mb-8 flex items-center gap-2"><BarChart2 size={16} className="text-app-accent" /> Color Wise Percentage</h3>
                    <div className="h-72">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.chartData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.3} />
                             <XAxis dataKey="name" fontSize={9} fontWeight={900} axisLine={false} tickLine={false} interval={0} angle={0} dy={10} /><YAxis hide />
                             <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '11px'}} formatter={(val: any) => [`${val.toLocaleString()} kg (${((val/Math.max(1, analyticsData.totalWeight))*100).toFixed(1)}%)`, 'Weight']} />
                             <Bar dataKey="weight" radius={[4, 4, 0, 0]} barSize={28}>
                                {analyticsData.chartData.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                <LabelList dataKey="weight" position="top" style={{fontSize: '9px', fontWeight: '900', fill: 'var(--app-text-muted)'}} formatter={(v: any) => `${((v/Math.max(1, analyticsData.totalWeight))*100).toFixed(1)}%`} />
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                  </div>
               </div>

               <div className="bg-app-card rounded-xl border border-app-border shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-app-border bg-app-bg/20 flex items-center gap-2">
                    <TableIcon size={16} className="text-app-accent" /><h3 className="text-sm font-black text-app-text uppercase tracking-widest">Industrial Values Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-[10px] border-collapse min-w-[1200px]">
                      <thead className="bg-app-bg text-app-text-muted uppercase font-black tracking-widest sticky top-0 z-10">
                        <tr className="border-b border-app-border">
                           <th className="px-4 py-3 border-r border-app-border sticky left-0 bg-app-bg">Date</th>
                           <th className="px-4 py-3 border-r border-app-border">Net Total</th>
                           <th className="px-4 py-3 border-r border-app-border">Inhouse</th>
                           <th className="px-4 py-3 border-r border-app-border">Subcon</th>
                           {colorGroupNames.map(n => <th key={n} className="px-4 py-3 border-r border-white/10">{n}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-app-border">
                        {filteredRecords.map(r => (
                          <tr key={r.id} className="hover:bg-app-accent/5 font-bold transition-colors">
                             <td className="px-4 py-2 border-r border-app-border sticky left-0 bg-app-card whitespace-nowrap">{formatDisplayDate(r.date)}</td>
                             <td className="px-4 py-2 border-r border-app-border text-app-accent">{(activeTab === 'history' ? (r.lantabur.inhouse + r.lantabur.subContract + r.taqwa.inhouse + r.taqwa.subContract) : (r[activeTab as 'lantabur'|'taqwa'].inhouse + r[activeTab as 'lantabur'|'taqwa'].subContract)).toLocaleString()}</td>
                             <td className="px-4 py-2 border-r border-app-border text-emerald-600">{(activeTab === 'history' ? (r.lantabur.inhouse + r.taqwa.inhouse) : r[activeTab as 'lantabur'|'taqwa'].inhouse).toLocaleString()}</td>
                             <td className="px-4 py-2 border-r border-app-border text-amber-600">{(activeTab === 'history' ? (r.lantabur.subContract + r.taqwa.subContract) : r[activeTab as 'lantabur'|'taqwa'].subContract).toLocaleString()}</td>
                             {colorGroupNames.map(name => {
                               const val = activeTab === 'history' ? (getGroupValue(r.lantabur.colorGroups, name) + getGroupValue(r.taqwa.colorGroups, name)) : getGroupValue(r[activeTab as 'lantabur'|'taqwa'].colorGroups, name);
                               return <td key={name} className="px-4 py-2 border-r border-app-border text-app-text-muted">{val > 0 ? val.toLocaleString() : '-'}</td>
                             })}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-app-bg/50 font-black text-app-text uppercase border-t-2 border-app-border sticky bottom-0">
                         <tr>
                            <td className="px-4 py-3 border-r border-app-border sticky left-0 bg-app-bg">Aggregate</td>
                            <td className="px-4 py-3 border-r border-app-border text-app-accent">{analyticsData.totalWeight.toLocaleString()}</td>
                            <td className="px-4 py-3 border-r border-app-border text-emerald-600">{totals.inhouse.toLocaleString()}</td>
                            <td className="px-4 py-3 border-r border-app-border text-amber-600">{totals.subContract.toLocaleString()}</td>
                            {colorGroupNames.map(name => <td key={name} className="px-4 py-3 border-r border-app-border">{(analyticsData.sourceMap[name] || 0).toLocaleString()}</td>)}
                         </tr>
                      </tfoot>
                    </table>
                  </div>
               </div>
            </div>
            <footer className="p-5 border-t border-app-border flex justify-center bg-app-card shrink-0">
               <button onClick={() => setShowFilteredSummary(false)} className="px-16 py-2.5 bg-[#0f172a] text-white rounded-lg text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl active:scale-95">Close Summary</button>
            </footer>
          </div>
        </div>
      )}

      {selectedRecordForChart && (
        <div className="modal-overlay" onClick={() => setSelectedRecordForChart(null)}>
           <div className="bg-app-card rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-app-border" onClick={e => e.stopPropagation()}>
              <header className="px-8 py-6 border-b border-app-border flex justify-between items-center bg-app-card shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-app-accent text-app-accent-contrast rounded-xl shadow-lg">
                      <PieChartIcon size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-app-text tracking-tighter uppercase">Daily Production Audit</h2>
                      <p className="text-sm font-bold text-app-text-muted flex items-center gap-2">
                        <Calendar size={14} /> {formatDisplayDate(selectedRecordForChart.record.date)} • 
                        <span className="uppercase tracking-widest text-app-accent">{selectedRecordForChart.mode} NODE Registry</span>
                      </p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedRecordForChart(null)} className="p-2 hover:bg-app-bg rounded-full transition-colors text-app-text-muted"><X size={28} /></button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-app-bg/10">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(() => {
                      const data = getRowDisplayData(selectedRecordForChart.record, selectedRecordForChart.mode);
                      return (
                        <>
                          <SummaryKPICard label="TOTAL LOADED" value={data.total} color="indigo" />
                          <SummaryKPICard label="INHOUSE VOLUME" value={data.inhouse} color="emerald" />
                          <SummaryKPICard label="SUBCONTRACT VOLUME" value={data.subContract} color="amber" />
                        </>
                      );
                    })()}
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 bg-app-card p-6 rounded-2xl border border-app-border shadow-sm flex flex-col">
                       <h3 className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                          <Droplets size={16} className="text-app-accent" /> Portfolio Distribution
                       </h3>
                       <div className="h-64 relative">
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie 
                                   data={(() => {
                                      const data = getRowDisplayData(selectedRecordForChart.record, selectedRecordForChart.mode);
                                      return colorGroupNames.map((name) => ({
                                         name, 
                                         value: getGroupValue(data.colorGroups, name)
                                      })).filter(v => v.value > 0);
                                   })()} 
                                   innerRadius={60} 
                                   outerRadius={80} 
                                   paddingAngle={5} 
                                   dataKey="value"
                                >
                                   {colorGroupNames.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '12px'}} />
                                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px'}} />
                             </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                             <span className="text-[10px] font-black text-app-text-muted uppercase">Loaded</span>
                             <span className="text-2xl font-black text-app-text tracking-tighter">
                                {getRowDisplayData(selectedRecordForChart.record, selectedRecordForChart.mode).total.toLocaleString()}
                             </span>
                          </div>
                       </div>
                    </div>

                    <div className="lg:col-span-7 bg-app-card p-6 rounded-2xl border border-app-border shadow-sm">
                       <h3 className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                          <Target size={16} className="text-[#f43f5e]" /> Colorwise Breakdown Details
                       </h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(() => {
                             const data = getRowDisplayData(selectedRecordForChart.record, selectedRecordForChart.mode);
                             return colorGroupNames.map((name, idx) => {
                                const val = getGroupValue(data.colorGroups, name);
                                if (val === 0) return null;
                                const pct = ((val / Math.max(1, data.total)) * 100).toFixed(1);
                                return (
                                  <div key={name} className="p-3 bg-app-bg/50 rounded-xl border border-app-border/40 flex items-center justify-between group hover:border-app-accent transition-colors">
                                     <div>
                                        <p className="text-[9px] font-black text-app-text-muted uppercase mb-1">{name}</p>
                                        <p className="text-lg font-black text-app-text tracking-tight">{val.toLocaleString()} <span className="text-[9px] font-bold opacity-50">KG</span></p>
                                     </div>
                                     <div className="text-right">
                                        <span className="text-xs font-black text-app-accent drop-shadow-sm">{pct}%</span>
                                        <div className="w-12 h-1 bg-app-bg rounded-full overflow-hidden mt-1">
                                           <div className="h-full bg-app-accent" style={{ width: `${pct}%` }}></div>
                                        </div>
                                     </div>
                                  </div>
                                );
                             });
                          })()}
                       </div>
                    </div>
                 </div>

                 <div className="bg-app-card p-8 rounded-2xl border border-app-border shadow-sm">
                    <h3 className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                       <Zap size={16} className="text-amber-500" /> Category Comparison Intelligence
                    </h3>
                    <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(() => {
                             const data = getRowDisplayData(selectedRecordForChart.record, selectedRecordForChart.mode);
                             return colorGroupNames.map((name) => ({
                                name, 
                                weight: getGroupValue(data.colorGroups, name)
                             })).filter(v => v.weight > 0).sort((a,b) => b.weight - a.weight);
                          })()}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.3} />
                             <XAxis dataKey="name" fontSize={9} fontWeight={900} axisLine={false} tickLine={false} dy={10} interval={0} />
                             <YAxis hide />
                             <Tooltip cursor={{fill: 'var(--app-bg)', opacity: 0.5}} contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 'bold'}} />
                             <Bar dataKey="weight" radius={[4, 4, 0, 0]} barSize={40}>
                                {colorGroupNames.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                <LabelList dataKey="weight" position="top" style={{fontSize: '10px', fontWeight: '900', fill: 'var(--app-text-muted)'}} formatter={(v: any) => v.toLocaleString()} />
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              <footer className="p-6 border-t border-app-border flex justify-center bg-app-card shrink-0">
                 <button onClick={() => setSelectedRecordForChart(null)} className="px-12 py-3 bg-[#0f172a] text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-2">
                    Dismiss Portfolio Insight
                 </button>
              </footer>
           </div>
        </div>
      )}

      <PasskeyModal isOpen={passkeyContext.isOpen} onClose={() => setPasskeyContext(p => ({...p, isOpen: false}))} onSuccess={passkeyContext.action} actionLabel={passkeyContext.label} />
    </div>
  );
};

const MetricTile: React.FC<{ label: string; weight: number; total: number; color?: 'indigo' | 'emerald' | 'amber' }> = ({ label, weight, total, color = 'indigo' }) => {
  const pct = ((weight / Math.max(1, total)) * 100).toFixed(1);
  const colorMap = {
    indigo: { text: 'text-[#6366f1]', dot: 'bg-[#6366f1]' },
    emerald: { text: 'text-[#10b981]', dot: 'bg-[#10b981]' },
    amber: { text: 'text-[#d97706]', dot: 'bg-[#d97706]' },
  };
  
  const currentTheme = colorMap[color];

  return (
    <div className="bg-app-card p-4 rounded-xl border border-app-border shadow-sm flex flex-col transition-all duration-300 group hover:shadow-md hover:border-slate-300">
      <div className="mb-1 flex justify-between items-start">
        <p className="text-[12px] font-black text-app-text-muted uppercase tracking-[0.15em] truncate pr-2">{label}</p>
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <p className={`text-3xl font-black tracking-tighter ${currentTheme.text}`}>
          {weight.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </p>
        <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-tighter">KG</span>
      </div>
      <div className="mt-4 pt-3 border-t border-app-border/30 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-app-text tabular-nums">{pct}%</span>
            <div className="flex gap-1">
               <div className={`w-1.5 h-1.5 rounded-full ${currentTheme.dot}`}></div>
               <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
            </div>
         </div>
         <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">PERCENTAGE</span>
      </div>
    </div>
  );
};

const SummaryKPICard: React.FC<{ label: string; value: number; color?: 'indigo' | 'emerald' | 'amber' }> = ({ label, value, color = 'indigo' }) => {
  const colorMap: { [key: string]: { text: string; dot: string; hover: string } } = {
    indigo: { text: 'text-[#6366f1]', dot: 'bg-[#6366f1]', hover: 'hover:border-[#6366f1]' },
    emerald: { text: 'text-[#10b981]', dot: 'bg-[#10b981]', hover: 'hover:border-[#10b981]' },
    amber: { text: 'text-[#d97706]', dot: 'bg-[#d97706]', hover: 'hover:border-[#d97706]' },
  };
  
  const currentTheme = colorMap[color];

  return (
    <div className={`bg-app-card p-5 rounded-2xl border border-app-border shadow-sm flex flex-col transition-all duration-300 group ${currentTheme.hover}`}>
      <div className="mb-1">
        <p className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] mb-2">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <p className={`text-3xl font-black tracking-tighter ${currentTheme.text}`}>
            {value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </p>
          <span className="text-xs font-bold text-app-text-muted uppercase tracking-widest">KG</span>
        </div>
      </div>
      <div className="mt-5 pt-3 border-t border-app-border/40 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
         <div className="flex gap-1">
            <div className={`w-2 h-2 rounded-full ${currentTheme.dot}`}></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
         </div>
         <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Logic Node</span>
      </div>
    </div>
  );
};