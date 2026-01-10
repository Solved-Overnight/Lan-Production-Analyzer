
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { RFTReportRecord, RFTBatchEntry } from './types';
import { 
  Plus, Upload, Save, Trash2, Search, FileText, ChevronLeft, ChevronRight,
  ClipboardCheck, Clock, CheckCircle2, AlertCircle, Loader2, X, Factory, User,
  LayoutGrid, Download, Edit3, ArrowLeft, ArrowRight, Users, Percent, Filter, Activity,
  CalendarDays, FlaskConical, Edit, FilterIcon, Calendar, RefreshCw, BarChart3, TrendingUp, Layers,
  Hash, ChevronDown, Check, Zap, Target, Globe, Trophy, Info, MonitorCheck, PieChart,
  ChevronUp, BarChart, ShieldCheck
} from 'lucide-react';
import { parseCustomDate } from './App';
import { extractRFTData } from './services/geminiService';

interface RFTReportProps {
  records: RFTReportRecord[];
  onSave: (record: RFTReportRecord, replaceId?: string) => void;
  onDelete: (id: string) => void;
}

const EMPTY_ENTRY: RFTBatchEntry = {
  mc: '',
  batchNo: '',
  buyer: '',
  order: '',
  colour: '',
  colorGroup: '',
  fType: '',
  fQty: 0,
  loadCapPercent: 0,
  shadeOk: true,
  shadeNotOk: false,
  dyeingType: 'B/D CARD',
  shiftUnload: 'DAY',
  remarks: ''
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const formatRFTDate = (dateStr: string) => {
  try {
    const d = parseCustomDate(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

// Stable component outside the parent to prevent focus loss
const EntryRow = React.memo(({ 
  entry, 
  index, 
  readOnly, 
  onUpdate, 
  onDelete 
}: { 
  entry: RFTBatchEntry, 
  index: number, 
  readOnly: boolean, 
  onUpdate: (index: number, field: keyof RFTBatchEntry, value: any) => void,
  onDelete: (index: number) => void
}) => (
  <tr className="border-b border-app-border group hover:bg-app-accent/5 transition-colors">
    <td className="p-1 border-r border-app-border text-center font-bold">
      {readOnly ? entry.mc : <input type="text" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.mc} onChange={e => onUpdate(index, 'mc', e.target.value)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center font-medium">
      {readOnly ? entry.batchNo : <input type="text" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.batchNo} onChange={e => onUpdate(index, 'batchNo', e.target.value)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center font-medium">
      {readOnly ? entry.buyer : <input type="text" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.buyer} onChange={e => onUpdate(index, 'buyer', e.target.value)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center font-medium text-[9px]">
      {readOnly ? entry.order : <input type="text" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.order} onChange={e => onUpdate(index, 'order', e.target.value)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center text-[9px]">
      {readOnly ? entry.colour : <input type="text" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.colour} onChange={e => onUpdate(index, 'colour', e.target.value)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center text-[9px] font-bold text-app-accent">
      {readOnly ? entry.colorGroup : <input type="text" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.colorGroup} onChange={e => onUpdate(index, 'colorGroup', e.target.value)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center font-bold text-[9px] uppercase tracking-tighter">
      {readOnly ? entry.fType : <input type="text" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.fType} onChange={e => onUpdate(index, 'fType', e.target.value)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center font-black text-[9px] text-app-accent">
      {readOnly ? entry.fQty.toLocaleString() : <input type="number" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.fQty} onChange={e => onUpdate(index, 'fQty', parseFloat(e.target.value) || 0)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center text-[8px] font-bold text-app-text-muted">
      {readOnly ? `${entry.loadCapPercent}%` : <input type="number" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.loadCapPercent} onChange={e => onUpdate(index, 'loadCapPercent', parseFloat(e.target.value) || 0)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center">
      {readOnly ? (entry.shadeOk ? <CheckCircle2 className="mx-auto text-emerald-500" size={12} /> : '') : <input type="checkbox" className="accent-emerald-500 w-3 h-3 cursor-pointer" checked={entry.shadeOk} onChange={e => onUpdate(index, 'shadeOk', e.target.checked)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center">
      {readOnly ? (entry.shadeNotOk ? <AlertCircle className="mx-auto text-rose-500" size={12} /> : '') : <input type="checkbox" className="accent-rose-500 w-3 h-3 cursor-pointer" checked={entry.shadeNotOk} onChange={e => onUpdate(index, 'shadeNotOk', e.target.checked)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center text-[8px] font-black uppercase tracking-tighter text-blue-500">
      {readOnly ? entry.dyeingType : <input type="text" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.dyeingType} onChange={e => onUpdate(index, 'dyeingType', e.target.value)} />}
    </td>
    <td className="p-1 border-r border-app-border text-center text-[8px] font-bold text-amber-600">
      {readOnly ? entry.shiftUnload : <input type="text" className="w-full bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all" value={entry.shiftUnload} onChange={e => onUpdate(index, 'shiftUnload', e.target.value)} />}
    </td>
    <td className="p-1">
      <div className="flex items-center gap-1">
        {readOnly ? <span className="text-[8px] italic opacity-60 block text-center w-full truncate">{entry.remarks}</span> : <input type="text" className="flex-1 bg-white/50 border border-transparent focus:border-app-accent/30 rounded px-1 py-0.5 text-center focus:outline-none transition-all text-[8px]" value={entry.remarks} onChange={e => onUpdate(index, 'remarks', e.target.value)} />}
        {!readOnly && (
          <button onClick={() => onDelete(index)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-all opacity-0 group-hover:opacity-100">
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </td>
  </tr>
));

export const RFTReport: React.FC<RFTReportProps> = ({ records, onSave, onDelete }) => {
  const [viewMode, setViewMode] = useState<'browse' | 'create' | 'view' | 'edit'>('browse');
  const [selectedRecord, setSelectedRecord] = useState<RFTReportRecord | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [isRetrieving, setIsRetrieving] = useState(false);

  const [editingRecord, setEditingRecord] = useState<RFTReportRecord>({
    id: '',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/'),
    unit: 'Unit-02',
    companyName: 'Lantabur Apparels Ltd.',
    entries: [ { ...EMPTY_ENTRY } ],
    bulkRftPercent: 0,
    labRftPercent: 0,
    shiftPerformance: { yousuf: 0, humayun: 0 },
    shiftCount: { yousuf: 0, humayun: 0 },
    createdAt: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateDailyPerformance = (entries: RFTBatchEntry[]) => {
    const bulkEntries = entries.filter(e => e.dyeingType?.toUpperCase().includes('B/D CARD') || !e.dyeingType);
    const bulkOk = bulkEntries.filter(e => e.shadeOk).length;
    const bulkTotal = bulkEntries.length;
    const bulkRft = bulkTotal > 0 ? (bulkOk / bulkTotal) * 100 : 0;

    const labEntries = entries.filter(e => e.dyeingType?.toUpperCase().includes('LAB'));
    const labOk = labEntries.filter(e => e.shadeOk).length;
    const labTotal = labEntries.length;
    const labRft = labTotal > 0 ? (labOk / labTotal) * 100 : 0;

    return { bulkRft, labRft, bulkTotal, labTotal };
  };

  useEffect(() => {
    if (viewMode === 'create' || viewMode === 'edit') {
      const { bulkRft, labRft } = calculateDailyPerformance(editingRecord.entries);
      if (Math.abs(editingRecord.bulkRftPercent - bulkRft) > 0.01 || Math.abs(editingRecord.labRftPercent - labRft) > 0.01) {
        setEditingRecord(prev => ({
          ...prev,
          bulkRftPercent: parseFloat(bulkRft.toFixed(2)),
          labRftPercent: parseFloat(labRft.toFixed(2))
        }));
      }
    }
  }, [editingRecord.entries, viewMode]);

  const masterStats = useMemo(() => {
    if (records.length === 0) return null;

    const sortedByDate = [...records].sort((a, b) => parseCustomDate(b.date).getTime() - parseCustomDate(a.date).getTime());
    const latest = sortedByDate[0];
    const currMonth = new Date().getMonth();
    const currYear = new Date().getFullYear();

    const calculateAggregates = (filtered: RFTReportRecord[]) => {
      if (filtered.length === 0) return { bulk: 0, lab: 0, batches: 0, days: 0 };
      const avgBulk = filtered.reduce((acc, r) => acc + r.bulkRftPercent, 0) / filtered.length;
      const avgLab = filtered.reduce((acc, r) => acc + (r.labRftPercent || 0), 0) / filtered.length;
      const totalBatches = filtered.reduce((acc, r) => acc + r.entries.length, 0);
      return { bulk: avgBulk, lab: avgLab, batches: totalBatches, days: filtered.length };
    };

    return {
      today: {
        bulk: latest.bulkRftPercent,
        lab: latest.labRftPercent,
        batches: latest.entries.length,
        date: latest.date,
        records: [latest]
      },
      thisMonth: {
        ...calculateAggregates(records.filter(r => {
          const d = parseCustomDate(r.date);
          return d.getMonth() === currMonth && d.getFullYear() === currYear;
        })),
        records: records.filter(r => {
          const d = parseCustomDate(r.date);
          return d.getMonth() === currMonth && d.getFullYear() === currYear;
        })
      },
      thisYear: {
        ...calculateAggregates(records.filter(r => {
          const d = parseCustomDate(r.date);
          return d.getFullYear() === currYear;
        })),
        records: records.filter(r => {
          const d = parseCustomDate(r.date);
          return d.getFullYear() === currYear;
        })
      },
      total: {
        ...calculateAggregates(records),
        records: records
      }
    };
  }, [records]);

  const handleDownloadReport = (period: 'today' | 'thisMonth' | 'thisYear' | 'total') => {
    if (!masterStats) return;
    const stats = masterStats[period];
    if (!stats.records || stats.records.length === 0) return;

    const headers = [
      'Date', 'MC', 'Batch No', 'Buyer', 'Order', 'Colour', 'Color Group', 
      'F/Type', 'F.Qty', 'Load Cap%', 'Shade OK', 'Shade RE', 'Dyeing Type', 'Shift Unload', 'Remarks'
    ];

    const rows = stats.records.flatMap(record => 
      record.entries.map(entry => [
        record.date,
        entry.mc,
        entry.batchNo,
        entry.buyer,
        entry.order,
        entry.colour,
        entry.colorGroup,
        entry.fType,
        entry.fQty,
        entry.loadCapPercent,
        entry.shadeOk ? 'YES' : 'NO',
        entry.shadeNotOk ? 'YES' : 'NO',
        entry.dyeingType,
        entry.shiftUnload,
        entry.remarks
      ])
    );

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RFT_${period.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        const d = parseCustomDate(r.date);
        const matchesDate = d.getMonth() === filterMonth && d.getFullYear() === filterYear;
        const matchesSearch = r.date.includes(searchQuery) || formatRFTDate(r.date).toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDate && matchesSearch;
      })
      .sort((a, b) => parseCustomDate(b.date).getTime() - parseCustomDate(a.date).getTime());
  }, [records, filterMonth, filterYear, searchQuery]);

  const handleRetrieve = () => {
    setIsRetrieving(true);
    setTimeout(() => setIsRetrieving(false), 800);
  };

  const handleCreateNew = () => {
    setEditingRecord({
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/'),
      unit: 'Unit-02',
      companyName: 'Lantabur Apparels Ltd.',
      entries: [ { ...EMPTY_ENTRY } ],
      bulkRftPercent: 0,
      labRftPercent: 0,
      shiftPerformance: { yousuf: 0, humayun: 0 },
      shiftCount: { yousuf: 0, humayun: 0 },
      createdAt: new Date().toISOString()
    });
    setViewMode('create');
  };

  const handleEditExisting = () => {
    if (selectedRecord) {
      setEditingRecord({ ...selectedRecord });
      setViewMode('edit');
    }
  };

  const handleAddEntry = () => {
    setEditingRecord(prev => ({
      ...prev,
      entries: [...prev.entries, { ...EMPTY_ENTRY }]
    }));
  };

  const handleUpdateEntry = useCallback((index: number, field: keyof RFTBatchEntry, value: any) => {
    setEditingRecord(prev => {
      const newEntries = [...prev.entries];
      if (field === 'shadeOk' && value === true) {
        newEntries[index] = { ...newEntries[index], shadeOk: true, shadeNotOk: false };
      } else if (field === 'shadeNotOk' && value === true) {
        newEntries[index] = { ...newEntries[index], shadeOk: false, shadeNotOk: true };
      } else {
        newEntries[index] = { ...newEntries[index], [field]: value };
      }
      return { ...prev, entries: newEntries };
    });
  }, []);

  const handleDeleteEntry = useCallback((index: number) => {
    setEditingRecord(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSave = () => {
    const recordDate = parseCustomDate(editingRecord.date);
    
    // Automatically update filters so user sees their saved record
    setFilterMonth(recordDate.getMonth());
    setFilterYear(recordDate.getFullYear());
    setSearchQuery('');

    onSave(editingRecord, viewMode === 'edit' ? editingRecord.id : undefined);
    setViewMode('browse');
    setError(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        try {
          const extracted = await extractRFTData(base64, file.type);
          if (!extracted || !extracted.entries) {
            throw new Error("No data returned from AI extraction.");
          }

          // Sanitize numeric fields
          const sanitizedEntries = extracted.entries.map((entry: any) => ({
            ...entry,
            fQty: parseFloat(entry.fQty) || 0,
            loadCapPercent: parseFloat(entry.loadCapPercent) || 0,
          }));

          setEditingRecord(prev => ({
            ...prev,
            ...extracted,
            entries: sanitizedEntries,
            // Ensure ID from state is preserved, or fallback to UUID
            id: prev.id || crypto.randomUUID(),
            createdAt: prev.createdAt || new Date().toISOString()
          }));
        } catch (err: any) {
          setError(err.message || "AI extraction failed.");
        } finally {
          setIsExtracting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsExtracting(false);
      setError("Failed to read file.");
    }
  };

  const totals = useMemo(() => {
    const data = (viewMode === 'view' && selectedRecord) ? selectedRecord : editingRecord;
    const totalQty = data.entries.reduce((sum, e) => sum + (Number(e.fQty) || 0), 0);
    const avgLoad = data.entries.length > 0 
      ? data.entries.reduce((sum, e) => sum + (Number(e.loadCapPercent) || 0), 0) / data.entries.length
      : 0;
    const okCount = data.entries.filter(e => e.shadeOk).length;
    const notOkCount = data.entries.filter(e => e.shadeNotOk).length;
    return { totalQty, avgLoad, okCount, notOkCount };
  }, [editingRecord, selectedRecord, viewMode]);

  if (viewMode === 'create' || viewMode === 'edit' || (viewMode === 'view' && selectedRecord)) {
    const data = (viewMode === 'view' ? selectedRecord! : editingRecord);
    const isReadOnly = viewMode === 'view';

    const getShiftColorGroupStats = (operatorName: string) => {
      return data.entries
        .filter(entry => entry.shiftUnload?.toUpperCase().includes(operatorName.toUpperCase()))
        .reduce((acc: Record<string, { qty: number, count: number }>, curr) => {
          const group = curr.colorGroup || 'Misc';
          if (!acc[group]) acc[group] = { qty: 0, count: 0 };
          acc[group].qty += Number(curr.fQty) || 0;
          acc[group].count += 1;
          return acc;
        }, {} as Record<string, { qty: number, count: number }>);
    };

    const yousufColorGroups = (Object.entries(getShiftColorGroupStats('YOUSUF')) as [string, { qty: number, count: number }][]).sort((a, b) => b[1].qty - a[1].qty);
    const humayunColorGroups = (Object.entries(getShiftColorGroupStats('HUMAYUN')) as [string, { qty: number, count: number }][]).sort((a, b) => b[1].qty - a[1].qty);

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('browse')} className="p-1.5 bg-app-card border border-app-border rounded-md hover:bg-app-bg transition-all active:scale-95"><ArrowLeft size={16} /></button>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="px-1 py-0.5 bg-app-accent/10 text-app-accent text-[7px] font-black rounded uppercase tracking-widest border border-app-accent/20">Operational Node</span>
              </div>
              <h1 className="text-lg font-black text-app-text tracking-tight uppercase">
                {isReadOnly ? 'Report Insight' : (viewMode === 'edit' ? 'Update Entry' : 'Create Entry')}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            {!isReadOnly && (
              <button onClick={() => fileInputRef.current?.click()} disabled={isExtracting} className="flex items-center gap-1.5 px-3 py-1.5 bg-app-card text-app-text border border-app-border rounded-md text-[10px] font-bold uppercase hover:bg-app-bg transition-all">
                {isExtracting ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} AI Sync
              </button>
            )}
            {!isReadOnly && (
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-md text-[10px] font-bold uppercase hover:bg-emerald-700 transition-all">
                <Save size={12} /> Save
              </button>
            )}
            {isReadOnly && (
              <button onClick={handleEditExisting} className="flex items-center gap-1.5 px-4 py-1.5 bg-app-accent text-white rounded-md text-[10px] font-bold uppercase hover:bg-app-accent-hover transition-all">
                <Edit size={12} /> Edit
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
        </header>

        {error && (
          <div className="bg-rose-500/10 text-rose-500 p-3 rounded-md border border-rose-500/20 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="bg-app-accent p-4 rounded-lg shadow-md text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg border border-white/20 backdrop-blur-md">
               <Factory size={20} />
            </div>
            <div>
              {isReadOnly ? <p className="text-base font-black uppercase tracking-tight">{data.companyName}</p> : <input className="bg-transparent border-b border-white/30 text-base font-black uppercase focus:outline-none" value={data.companyName} onChange={e => setEditingRecord({...data, companyName: e.target.value})} />}
              <p className="text-[8px] font-bold opacity-70 uppercase tracking-widest">Industrial Production Node</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
               <p className="text-[7px] font-black uppercase tracking-widest opacity-60 mb-1">Registry Date</p>
               {isReadOnly ? <p className="font-bold text-xs">{data.date}</p> : <input className="bg-transparent border-b border-white/30 font-bold text-xs focus:outline-none text-center" value={data.date} onChange={e => setEditingRecord({...data, date: e.target.value})} />}
            </div>
            <div className="text-center">
               <p className="text-[7px] font-black uppercase tracking-widest opacity-60 mb-1">Production Unit</p>
               {isReadOnly ? <p className="font-bold text-xs">{data.unit}</p> : <input className="bg-transparent border-b border-white/30 font-bold text-xs focus:outline-none text-center" value={data.unit} onChange={e => setEditingRecord({...data, unit: e.target.value})} />}
            </div>
          </div>
        </div>

        <div className="bg-app-card rounded-lg border border-app-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-[9px] border-collapse min-w-[1250px]">
              <thead className="bg-[#1e293b] text-white uppercase font-bold tracking-wider border-b border-white/10 sticky top-0 z-20 shadow-md">
                <tr>
                  <th className="p-2 border-r border-white/10 w-12 text-center">MC</th>
                  <th className="p-2 border-r border-white/10 w-28 text-center">Batch No.</th>
                  <th className="p-2 border-r border-white/10 w-32 text-center">Buyer</th>
                  <th className="p-2 border-r border-white/10 w-32 text-center">Order</th>
                  <th className="p-2 border-r border-white/10 w-32 text-center">Colour</th>
                  <th className="p-2 border-r border-white/10 w-32 text-center text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] font-black">Color Group</th>
                  <th className="p-2 border-r border-white/10 w-24 text-center">F/Type</th>
                  <th className="p-2 border-r border-white/10 w-20 text-center">Qty</th>
                  <th className="p-2 border-r border-white/10 w-16 text-center">Load%</th>
                  <th className="p-2 border-r border-white/10 w-12 text-center text-emerald-400">OK</th>
                  <th className="p-2 border-r border-white/10 w-12 text-center text-rose-400">RE</th>
                  <th className="p-2 border-r border-white/10 w-24 text-center">Dyeing</th>
                  <th className="p-2 border-r border-white/10 w-20 text-center">Shift</th>
                  <th className="p-2 text-center w-24">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, idx) => (
                  <EntryRow 
                    key={`${data.id}-entry-${idx}`} 
                    entry={entry} 
                    index={idx} 
                    readOnly={isReadOnly}
                    onUpdate={handleUpdateEntry}
                    onDelete={handleDeleteEntry}
                  />
                ))}
              </tbody>
              <tfoot className="bg-[#0f172a] text-white font-black border-t border-white/20 text-[8px] uppercase tracking-widest shadow-inner">
                <tr>
                  <td className="p-2 text-center border-r border-white/10">{data.entries.length}</td>
                  <td colSpan={6} className="p-2 text-center border-r border-white/10 opacity-70">Summary Dashboard Totals</td>
                  <td className="p-2 text-center border-r border-white/10 text-emerald-400 font-black">{totals.totalQty.toLocaleString()}</td>
                  <td className="p-2 text-center border-r border-white/10">{totals.avgLoad.toFixed(1)}%</td>
                  <td className="p-2 text-center border-r border-white/10 text-emerald-400">{totals.okCount}</td>
                  <td className="p-2 text-center border-r border-white/10 text-rose-400">{totals.notOkCount}</td>
                  <td colSpan={3} className="p-2 text-center text-white/60 italic">{totals.okCount + totals.notOkCount} BATCHES PROCESSED</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {!isReadOnly && (
            <div className="p-3 bg-app-bg/5 border-t border-app-border text-center">
              <button onClick={handleAddEntry} className="inline-flex items-center gap-1.5 px-6 py-1.5 bg-app-accent/10 text-app-accent border border-app-accent/20 rounded-md text-[9px] font-bold uppercase hover:bg-app-accent hover:text-white transition-all">
                <Plus size={14} /> Add Batch Entry
              </button>
            </div>
          )}
        </div>

        {/* SUMMARY SECTION - RFT CARDS IN SINGLE LINE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-app-card border border-app-border rounded-lg p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Target size={80} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded shadow-inner">
                    <MonitorCheck size={20} />
                 </div>
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-muted">Bulk RFT Precision</h3>
                    <p className="text-[8px] font-bold text-emerald-600 uppercase">Production Threshold</p>
                 </div>
              </div>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black tracking-tighter text-app-text">{data.bulkRftPercent}%</span>
                 <span className={`text-[10px] font-black uppercase ${data.bulkRftPercent >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {data.bulkRftPercent >= 90 ? 'High' : 'Normal'}
                 </span>
              </div>
              <div className="w-full h-1 bg-app-bg rounded-full mt-4 overflow-hidden border border-app-border/50">
                 <div className="h-full bg-emerald-500" style={{ width: `${data.bulkRftPercent}%` }}></div>
              </div>
           </div>

           <div className="bg-app-card border border-app-border rounded-lg p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <FlaskConical size={80} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-blue-500/10 text-blue-600 rounded shadow-inner">
                    <Trophy size={20} />
                 </div>
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-muted">Lab RFT Matching</h3>
                    <p className="text-[8px] font-bold text-blue-600 uppercase">Recipe Accuracy</p>
                 </div>
              </div>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black tracking-tighter text-app-text">{data.labRftPercent}%</span>
                 <span className={`text-[10px] font-black uppercase ${data.labRftPercent >= 95 ? 'text-blue-500' : 'text-slate-500'}`}>
                    Benchmark
                 </span>
              </div>
              <div className="w-full h-1 bg-app-bg rounded-full mt-4 overflow-hidden border border-app-border/50">
                 <div className="h-full bg-blue-500" style={{ width: `${data.labRftPercent}%` }}></div>
              </div>
           </div>
        </div>

        {/* FULL WIDTH OPERATOR INTELLIGENCE HUB */}
        <div className="w-full bg-[#1e293b] rounded-lg border border-slate-700 shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-3 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                 <Users size={14} className="text-app-accent" /> Operator Intelligence Hub
              </h4>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Shift Telemetry</span>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 flex-1 overflow-hidden">
              <OperatorStatsBox 
                name="YOUSUF" 
                qty={data.shiftPerformance?.yousuf || 0} 
                batches={data.shiftCount?.yousuf || 0} 
                color="indigo" 
                colorGroups={yousufColorGroups}
              />
              <OperatorStatsBox 
                name="HUMAYUN" 
                qty={data.shiftPerformance?.humayun || 0} 
                batches={data.shiftCount?.humayun || 0} 
                color="amber" 
                colorGroups={humayunColorGroups}
              />
            </div>

            <div className="bg-slate-900 px-6 py-2 border-t border-white/5 flex justify-between items-center">
               <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest italic flex items-center gap-1.5">
                  <Info size={10} /> Shift throughput metrics verified against machine registry
               </p>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-0.5 bg-indigo-500"></div>
                     <span className="text-[7px] font-black text-slate-400 uppercase">Primary Operator</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-0.5 bg-amber-500"></div>
                     <span className="text-[7px] font-black text-slate-400 uppercase">Secondary Operator</span>
                  </div>
               </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
             <div className="w-9 h-9 bg-app-accent rounded-md flex items-center justify-center text-white shadow-md">
                <ClipboardCheck size={18} />
             </div>
             <div>
                <h1 className="text-xl font-black text-app-text tracking-tight uppercase leading-none">RFT Dashboard</h1>
                <p className="text-app-text-muted font-bold text-[9px] uppercase tracking-widest mt-1 opacity-60">Quality Intelligence Center</p>
             </div>
          </div>
        </div>
        <button onClick={handleCreateNew} className="flex items-center gap-1.5 px-5 py-2 bg-app-accent text-white rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-app-accent-hover transition-all shadow-md active:scale-95 group">
          <Plus size={14} /> New Registry
        </button>
      </header>

      {masterStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
           <DetailedSummaryCard icon={Zap} label="Today's Performance" stats={masterStats.today} color="emerald" info={`LATEST: ${formatRFTDate(masterStats.today.date)}`} onDownload={() => handleDownloadReport('today')} />
           <DetailedSummaryCard icon={CalendarDays} label="Monthly Performance" stats={masterStats.thisMonth} color="blue" info={`${MONTHS[new Date().getMonth()].toUpperCase()} ${new Date().getFullYear()}`} onDownload={() => handleDownloadReport('thisMonth')} />
           <DetailedSummaryCard icon={Target} label="Yearly Performance" stats={masterStats.thisYear} color="violet" info={`Node Cycle ${new Date().getFullYear()}`} onDownload={() => handleDownloadReport('thisYear')} />
           <DetailedSummaryCard icon={Globe} label="Lifecycle Total" stats={masterStats.total} color="app-accent" info="Historical Aggregate" onDownload={() => handleDownloadReport('total')} />
        </div>
      )}

      <div className="bg-app-card p-1.5 rounded-md border border-app-border shadow-sm flex flex-col lg:flex-row items-center gap-1.5">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-1.5 w-full">
           <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={14} />
              <select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} className="w-full pl-9 pr-3 py-1.5 bg-app-bg border border-app-border rounded text-[10px] font-bold text-app-text focus:outline-none appearance-none cursor-pointer hover:border-app-accent/50 transition-colors">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
           </div>
           <div className="relative group">
              <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={14} />
              <select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} className="w-full pl-9 pr-3 py-1.5 bg-app-bg border border-app-border rounded text-[10px] font-bold text-app-text focus:outline-none appearance-none cursor-pointer hover:border-app-accent/50 transition-colors">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={14} />
              <input type="text" placeholder="Day filter..." className="w-full pl-9 pr-3 py-1.5 bg-app-bg border border-app-border rounded text-[10px] font-bold text-app-text focus:outline-none placeholder:text-app-text-muted/40 hover:border-app-accent/50 transition-colors" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
           </div>
        </div>
        <button onClick={handleRetrieve} disabled={isRetrieving} className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-6 py-1.5 bg-emerald-600 text-white rounded text-[10px] font-bold uppercase hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50">
          {isRetrieving ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Fetch Records
        </button>
      </div>

      <div className="bg-app-card rounded-md border border-app-border shadow-sm overflow-hidden">
        <div className="px-4 py-2 border-b border-app-border bg-app-bg/10 flex items-center justify-between">
           <h3 className="text-[9px] font-black text-app-text-muted uppercase tracking-widest flex items-center gap-2">
             <BarChart3 size={12} className="text-app-accent" /> Registry Archive
           </h3>
           <div className="text-[8px] font-black text-app-text-muted opacity-60 tracking-wider">
             {MONTHS[filterMonth].toUpperCase()} {filterYear} • {filteredRecords.length} NODES
           </div>
        </div>

        {isRetrieving ? (
          <div className="flex flex-col items-center justify-center py-20">
             <Loader2 size={24} className="text-app-accent animate-spin mb-3" />
             <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest animate-pulse">Syncing Telemetry...</p>
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse min-w-[800px]">
              <thead className="bg-app-bg text-[9px] font-black text-app-text-muted uppercase tracking-widest border-b border-app-border">
                <tr>
                  <th className="px-5 py-2 border-r border-app-border w-44 text-center">Entry Date</th>
                  <th className="px-5 py-2 border-r border-app-border w-16 text-center">Batches</th>
                  <th className="px-5 py-2 border-r border-app-border">RFT Performance Metrics (Bulk vs Lab)</th>
                  <th className="px-5 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-app-bg/20 transition-colors group cursor-pointer" onClick={() => { setSelectedRecord(record); setViewMode('view'); }}>
                    <td className="px-5 py-1.5 font-bold text-app-text border-r border-app-border whitespace-nowrap text-center">
                      {formatRFTDate(record.date)}
                    </td>
                    <td className="px-5 py-1.5 text-center border-r border-app-border">
                      <span className="px-1.5 py-0.5 bg-app-accent/5 text-app-accent rounded font-black text-[9px] border border-app-accent/10">
                        {record.entries.length}
                      </span>
                    </td>
                    <td className="px-5 py-1.5 border-r border-app-border">
                      <div className="flex items-center gap-6">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-[8px] font-black text-app-text-muted uppercase tracking-tighter w-14 shrink-0">Bulk RFT</span>
                          <div className="flex-1 h-1 bg-app-bg rounded-full overflow-hidden border border-app-border/30">
                            <div className={`h-full transition-all duration-700 ${record.bulkRftPercent >= 85 ? 'bg-emerald-500' : record.bulkRftPercent >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${record.bulkRftPercent}%` }}></div>
                          </div>
                          <span className="text-[9px] font-black w-7 text-right">{record.bulkRftPercent}%</span>
                        </div>
                        <div className="w-px h-3 bg-app-border"></div>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-[8px] font-black text-app-text-muted uppercase tracking-tighter w-12 shrink-0">Lab RFT</span>
                          <div className="flex-1 h-1 bg-app-bg rounded-full overflow-hidden border border-app-border/30">
                            <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${record.labRftPercent || 0}%` }}></div>
                          </div>
                          <span className="text-[9px] font-black w-7 text-right">{record.labRftPercent || 0}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <button className="text-[9px] font-black uppercase text-app-accent hover:underline px-2 py-0.5 rounded hover:bg-app-accent/5">Open</button>
                         <button onClick={(e) => { e.stopPropagation(); onDelete(record.id); }} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-all opacity-0 group-hover:opacity-100">
                           <Trash2 size={12} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardCheck size={40} className="opacity-5 text-app-accent mb-3" />
            <h3 className="text-xs font-black text-app-text uppercase">Node Archives Empty</h3>
            <p className="text-[9px] font-medium text-app-text-muted mt-1 uppercase tracking-widest opacity-60">Telemetry node is on standby.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const OperatorStatsBox: React.FC<{ 
  name: string, 
  qty: number, 
  batches: number, 
  color: string, 
  colorGroups: [string, { qty: number, count: number }][] 
}> = ({ name, qty, batches, color, colorGroups }) => {
  const accent = color === 'indigo' ? 'text-indigo-400' : 'text-amber-400';
  const border = color === 'indigo' ? 'border-indigo-500/20' : 'border-amber-500/20';
  const bg = color === 'indigo' ? 'bg-indigo-500/5' : 'bg-amber-500/5';
  const barBg = color === 'indigo' ? 'bg-indigo-600' : 'bg-amber-600';

  return (
    <div className={`flex-1 p-6 flex flex-col ${bg} group border-r border-white/5 last:border-r-0`}>
      <div className="flex items-center gap-3 mb-6">
         <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-800 border-2 ${border} group-hover:scale-105 transition-transform shadow-xl`}>
            <User size={22} className={accent} />
         </div>
         <div className="flex flex-col">
            <span className={`text-sm font-black uppercase tracking-widest ${accent}`}>{name}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1">
               <ShieldCheck size={10} className="text-emerald-500" /> Shift Supervisor
            </span>
         </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-900/40 p-3 rounded-lg border border-white/5">
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Throughput</span>
           <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{qty.toLocaleString()}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase">kg</span>
           </div>
        </div>
        <div className="bg-slate-900/40 p-3 rounded-lg border border-white/5">
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Unit Count</span>
           <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{batches}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase">batches</span>
           </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
         <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h5 className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${accent}`}>
               <BarChart size={12} /> Color Portfolio
            </h5>
            <span className="text-[8px] font-bold text-slate-500 uppercase">{colorGroups.length} categories</span>
         </div>
         
         <div className="space-y-4 max-h-[280px] overflow-y-auto custom-scrollbar pr-2 pt-2">
            {colorGroups.map(([group, stats]) => {
              const percentage = ((stats.qty / Math.max(1, qty)) * 100).toFixed(1);
              return (
                <div key={group} className="group/row">
                   <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[10px] font-black text-slate-200 uppercase truncate max-w-[140px]">
                        {group} ({percentage}%)
                      </span>
                      <div className="text-right">
                         <span className="text-[10px] font-medium text-slate-300 tabular-nums">
                           {stats.qty.toLocaleString()} <span className="text-[8px] text-slate-500">kg</span>
                         </span>
                         <span className="text-[8px] font-bold text-slate-500 italic ml-1">
                           ({stats.count} B)
                         </span>
                      </div>
                   </div>
                   <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full ${barBg} transition-all duration-1000 shadow-[0_0_8px_rgba(var(--app-accent-rgb),0.3)]`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                   </div>
                </div>
              );
            })}
            {colorGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 opacity-30">
                 <Activity size={24} className="text-slate-500 mb-2" />
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">No shift telemetry</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

const DetailedSummaryCard: React.FC<{ icon: any, label: string, stats: any, color: string, info: string, onDownload: () => void }> = ({ icon: Icon, label, stats, color, info, onDownload }) => {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10',
    blue: 'bg-blue-500/5 text-blue-600 border-blue-500/10',
    violet: 'bg-violet-500/5 text-violet-600 border-violet-500/10',
    'app-accent': 'bg-app-accent/5 text-app-accent border-app-accent/10',
  };
  
  return (
    <div className={`p-4 rounded-md border shadow-sm transition-all hover:bg-app-card ${colorMap[color] || colorMap['app-accent']} group`}>
       <div className="flex items-center justify-between mb-3 border-b border-app-border/10 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded shadow-sm border border-app-border/10">
               <Icon size={16} />
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-none mb-0.5">{label}</span>
               <span className="text-[7px] font-bold text-app-text-muted uppercase tracking-tighter">{info}</span>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="p-1.5 bg-white/50 border border-app-border/20 rounded hover:bg-app-accent hover:text-white transition-all text-app-text-muted opacity-0 group-hover:opacity-100"
            title="Download Excel Report"
          >
            <Download size={14} />
          </button>
       </div>
       
       <div className="space-y-3">
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-app-text-muted uppercase tracking-tighter">Bulk RFT</span>
                <span className="text-xl font-black tracking-tighter">{stats.bulk.toFixed(1)}%</span>
             </div>
             <div className="flex flex-col text-right">
                <span className="text-[8px] font-black text-app-text-muted uppercase tracking-tighter">Lab RFT</span>
                <span className="text-xl font-black tracking-tighter text-blue-600">{stats.lab.toFixed(1)}%</span>
             </div>
          </div>

          <div className="pt-2 border-t border-app-border/10 flex justify-between items-center">
             <div className="flex items-center gap-1.5">
                <Layers size={10} className="text-app-text-muted opacity-50" />
                <span className="text-[8px] font-black text-app-text-muted uppercase tracking-widest">Total Batches</span>
             </div>
             <span className="text-sm font-black">{stats.batches}</span>
          </div>
       </div>
    </div>
  );
};
