import React, { useState, useRef, useMemo } from 'react';
import { ProductionRecord, ColorGroupData } from './types';
import { extractProductionData } from './services/geminiService';
import { parseCustomDate } from './App';
import { ProductionTrendChart } from './components/Charts';
import { 
  Upload, Loader2, Trash2, Search, 
  Copy, FileSpreadsheet, Activity, Factory, AlertCircle, CheckCircle2,
  PieChart as PieChartIcon, X, BarChart2, AlertTriangle, Calendar, FilterX, Filter,
  Sigma, BarChart3, TrendingUp, Info, Table as TableIcon, Layers, Maximize2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,
  ComposedChart
} from 'recharts';

interface ProductionDataProps {
  records: ProductionRecord[];
  onAddRecord: (record: ProductionRecord, replaceId?: string) => void;
  onDeleteRecord: (id: string) => void;
}

type TabType = 'history' | 'lantabur' | 'taqwa';

const CHART_COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];

export const ProductionData: React.FC<ProductionDataProps> = ({ records, onAddRecord, onDeleteRecord }) => {
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [isUploading, setIsUploading] = useState(false);
  const [updatingRecordId, setUpdatingRecordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRecordForChart, setSelectedRecordForChart] = useState<ProductionRecord | null>(null);
  const [showFilteredSummary, setShowFilteredSummary] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{id: string, date: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    
    const clickEvt = new MouseEvent('click', {
      view: window,
      bubbles: false,
      cancelable: true,
    });
    a.dispatchEvent(clickEvt);

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const supportedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      setError("Unsupported file format. Please upload a PDF or an Image.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string;
          const base64 = result.split(',')[1];
          const extracted = await extractProductionData(base64, file.type);
          
          const newRecord: ProductionRecord = {
            id: updatingRecordId || crypto.randomUUID(),
            date: extracted.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            lantabur: { ...extracted.lantabur, name: 'Lantabur' },
            taqwa: { ...extracted.taqwa, name: 'Taqwa' },
            totalProduction: (extracted.lantabur.total || 0) + (extracted.taqwa.total || 0),
            createdAt: new Date().toISOString(),
          };

          onAddRecord(newRecord, updatingRecordId || undefined);
          setSuccess(updatingRecordId ? "Record updated successfully!" : "Data extracted and saved!");
          setIsUploading(false);
          setUpdatingRecordId(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (extractionError: any) {
          setError(extractionError.message || "AI failed to process the document.");
          setIsUploading(false);
          setUpdatingRecordId(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError("An unexpected error occurred during upload.");
      setIsUploading(false);
      setUpdatingRecordId(null);
    }
  };

  const getGroupValue = (groups: ColorGroupData[], name: string): number => {
    if (name === 'DOUBLE PART') {
      const dp = groups.find(g => g.groupName === 'Double Part')?.weight || 0;
      const dpb = groups.find(g => g.groupName === 'Double Part -Black')?.weight || 0;
      return dp + dpb;
    }
    return groups.find(g => g.groupName === name)?.weight || 0;
  };

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        const matchesSearch = r.date.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesRange = true;
        if (startDate || endDate) {
          const recordTime = parseCustomDate(r.date).getTime();
          if (startDate) {
            const startTime = new Date(startDate).setHours(0,0,0,0);
            if (recordTime < startTime) matchesRange = false;
          }
          if (endDate) {
            const endTime = new Date(endDate).setHours(23,59,59,999);
            if (recordTime > endTime) matchesRange = false;
          }
        }
        
        return matchesSearch && matchesRange;
      })
      .sort((a, b) => parseCustomDate(b.date).getTime() - parseCustomDate(a.date).getTime());
  }, [records, searchQuery, startDate, endDate]);

  const totals = useMemo(() => {
    const stats = {
      lantaburTotal: 0,
      taqwaTotal: 0,
      combinedTotal: 0,
      industryTotal: 0,
      inhouse: 0,
      subContract: 0,
      colorGroups: {} as Record<string, number>
    };

    filteredRecords.forEach(r => {
      stats.lantaburTotal += r.lantabur.total;
      stats.taqwaTotal += r.taqwa.total;
      stats.combinedTotal += r.totalProduction;

      if (activeTab === 'history') {
        colorGroupNames.forEach(name => {
          stats.colorGroups[name] = (stats.colorGroups[name] || 0) + 
            getGroupValue(r.lantabur.colorGroups, name) + 
            getGroupValue(r.taqwa.colorGroups, name);
        });
        stats.inhouse += r.lantabur.inhouse + r.taqwa.inhouse;
        stats.subContract += r.lantabur.subContract + r.taqwa.subContract;
      } else {
        const ind = activeTab === 'lantabur' ? r.lantabur : r.taqwa;
        stats.industryTotal += ind.total;
        stats.inhouse += ind.inhouse;
        stats.subContract += ind.subContract;
        colorGroupNames.forEach(name => {
          stats.colorGroups[name] = (stats.colorGroups[name] || 0) + getGroupValue(ind.colorGroups, name);
        });
      }
    });

    return stats;
  }, [filteredRecords, activeTab]);

  const calculateMonthlyStats = (recordDate: string, industry: 'lantabur' | 'taqwa') => {
    const targetDate = parseCustomDate(recordDate);
    const month = targetDate.getMonth();
    const year = targetDate.getFullYear();
    const monthRecords = records.filter(r => {
      const d = parseCustomDate(r.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const totalMonth = monthRecords.reduce((sum, r) => sum + r[industry].total, 0);
    const avgDay = monthRecords.length > 0 ? totalMonth / monthRecords.length : 0;
    return { totalMonth, avgDay };
  };

  const handleCopy = (record: ProductionRecord, type: 'lantabur' | 'taqwa' | 'combined') => {
    const getIndustryBlock = (industry: 'lantabur' | 'taqwa') => {
      const data = record[industry];
      const { totalMonth, avgDay } = calculateMonthlyStats(record.date, industry);
      const getPercent = (val: number) => ((val / Math.max(1, data.total)) * 100).toFixed(2);
      
      const black = getGroupValue(data.colorGroups, 'Black');
      const average = getGroupValue(data.colorGroups, 'Average');
      const doublePart = getGroupValue(data.colorGroups, 'DOUBLE PART');
      const white = getGroupValue(data.colorGroups, 'White');
      const royal = getGroupValue(data.colorGroups, 'Royal');

      return `╰─> ${industry.charAt(0).toUpperCase() + industry.slice(1)} Data:
Total = ${data.total.toLocaleString()} kg
${data.loadingCap ? `Loading cap: ${data.loadingCap}%\n` : ''}Black: ${black.toLocaleString()} kg (${getPercent(black)}%)
Average: ${average.toLocaleString()} kg (${getPercent(average)}%)
Double Part: ${doublePart.toLocaleString()} kg (${getPercent(doublePart)}%)
${royal > 0 ? `Royal: ${royal.toLocaleString()} kg (${getPercent(royal)}%)\n` : ''}White: ${white.toLocaleString()} kg (${getPercent(white)}%)

Inhouse: ${data.inhouse.toLocaleString()} kg (${getPercent(data.inhouse)}%)
Sub Contract: ${data.subContract.toLocaleString()} kg (${getPercent(data.subContract)}%)

LAB RFT:
Total this month: ${totalMonth.toLocaleString()} kg
Avg/day: ${avgDay.toLocaleString()} kg`;
    };

    let text = `Date: ${formatDisplayDate(record.date)}`;

    if (type === 'combined') {
      text += `\n----------------------------\n${getIndustryBlock('lantabur')}\n\n${getIndustryBlock('taqwa')}`;
    } else {
      text += `\n----------------------------\n${getIndustryBlock(type)}`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setSuccess(type === 'combined' ? "Combined report copied!" : `${type.charAt(0).toUpperCase() + type.slice(1)} report copied!`);
      setTimeout(() => setSuccess(null), 3000);
    });
  };

  const executeDelete = () => {
    if (recordToDelete) {
      onDeleteRecord(recordToDelete.id);
      setRecordToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const exportToExcel = (industry?: 'lantabur' | 'taqwa') => {
    let headers = ['Date', 'Total Weight', 'Inhouse', 'Sub Contract'];
    if (industry) headers = [...headers, ...colorGroupNames];
    else headers.push('Lantabur Total', 'Taqwa Total');

    const rows = filteredRecords.map(r => {
      const base = [formatDisplayDate(r.date)];
      if (industry) {
        const ind = r[industry];
        return [...base, ind.total, ind.inhouse, ind.subContract, ...colorGroupNames.map(name => getGroupValue(ind.colorGroups, name))];
      } else {
        return [...base, r.totalProduction, r.lantabur.inhouse + r.taqwa.inhouse, r.lantabur.subContract + r.taqwa.subContract, r.lantabur.total, r.taqwa.total];
      }
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${industry || 'production'}_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app-text">Production Data Management</h1>
          <p className="text-app-text-muted text-sm">Detailed breakdown and history for Lantabur & Taqwa</p>
        </div>
        <div className="flex bg-app-card rounded-md p-1 border border-app-border shadow-sm">
          {['history', 'lantabur', 'taqwa'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as TabType)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all capitalize ${activeTab === tab ? 'bg-app-accent text-app-accent-contrast shadow-sm' : 'text-app-text-muted hover:bg-app-bg hover:text-app-text'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Top Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section 
          className="bg-app-card p-6 rounded-lg border-2 border-dashed border-app-border text-center hover:border-app-accent transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[140px]" 
          onClick={() => { setUpdatingRecordId(null); fileInputRef.current?.click(); }}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
          {isUploading ? (
            <div className="py-2"><Loader2 className="animate-spin text-app-accent mx-auto mb-2" size={28} /><p className="text-xs font-medium text-app-text">Extracting...</p></div>
          ) : (
            <div className="py-2">
              <Upload size={32} className="mx-auto text-app-text-muted group-hover:text-app-accent transition-colors mb-2" />
              <h3 className="text-sm font-semibold text-app-text">Upload New Daily Report</h3>
              <p className="text-xs text-app-text-muted mt-1">PDF or Image</p>
            </div>
          )}
        </section>

        <div className="lg:col-span-2 bg-app-card p-6 rounded-lg border border-app-border shadow-sm flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="text-[10px] font-bold text-app-text-muted uppercase mb-1 block ml-1">Quick Search</label>
              <Search className="absolute left-3 top-8 text-app-text-muted" size={14} />
              <input 
                type="text" 
                placeholder="Search by date..." 
                className="w-full pl-9 pr-4 py-2 bg-app-bg border border-app-border rounded-md text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2 grid grid-cols-2 gap-3 relative">
              <div>
                <label className="text-[10px] font-bold text-app-text-muted uppercase mb-1 block ml-1">From Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-md text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent/20"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-app-text-muted uppercase mb-1 block ml-1">To Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-md text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent/20"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => exportToExcel(activeTab === 'history' ? undefined : activeTab as any)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-all"
            >
              <FileSpreadsheet size={16} />
              Export Data
            </button>
            <button 
              className="flex items-center justify-center gap-2 px-6 py-2 bg-app-accent text-app-accent-contrast rounded-md text-xs font-semibold hover:bg-app-accent-hover shadow-sm transition-all"
            >
              <Filter size={16} />
              Filter
            </button>
            <button 
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-app-bg border border-app-border text-app-text-muted rounded-md text-xs font-semibold hover:text-rose-500 hover:border-rose-500/30 shadow-sm transition-all"
            >
              <FilterX size={16} />
              Clear
            </button>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className={`p-3 rounded-md flex items-center gap-3 text-xs border ${error ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
          {error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          <p className="font-medium">{error || success}</p>
        </div>
      )}

      <section className="bg-app-card rounded-lg shadow-sm border border-app-border overflow-hidden">
        <div className="p-4 border-b border-app-border bg-app-bg/30 flex justify-between items-center">
          <h3 className="font-semibold text-app-text flex items-center gap-2 capitalize text-sm">
            {activeTab === 'history' ? <Activity size={16} className="text-app-accent" /> : <Factory size={16} className="text-app-accent" />}
            {activeTab} Production Table
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-app-text-muted bg-app-card border border-app-border px-2 py-0.5 rounded-sm">
              {filteredRecords.length} records shown
            </span>
            <button 
              onClick={() => setShowFilteredSummary(true)}
              disabled={filteredRecords.length === 0}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-app-accent/10 text-app-accent hover:bg-app-accent hover:text-app-accent-contrast transition-all shadow-sm border border-app-accent/20 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Show Summary & Analytics"
            >
              <Sigma size={16} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto relative">
          <table className="w-full text-center text-[11px] border-collapse min-w-max border border-app-border">
            {activeTab === 'history' ? (
              <>
                <thead className="bg-app-bg text-app-text-muted uppercase font-semibold">
                  <tr className="border-b border-app-border">
                    <th className="px-4 py-3 text-center sticky left-0 bg-app-bg z-20 border-r border-app-border">Date</th>
                    <th className="px-4 py-3 border-r border-app-border">Lantabur (kg)</th>
                    <th className="px-4 py-3 border-r border-app-border">Taqwa (kg)</th>
                    <th className="px-4 py-3 border-r border-app-border">Daily Total</th>
                    <th className="px-4 py-3 text-center min-w-[150px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="table-row-hover group transition-colors">
                      <td className="px-4 py-3 font-medium text-app-text text-center whitespace-nowrap sticky left-0 bg-app-card z-10 border-r border-app-border transition-colors">{formatDisplayDate(r.date)}</td>
                      <td className="px-4 py-3 font-medium text-app-accent border-r border-app-border">{r.lantabur.total.toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-rose-500 border-r border-app-border">{r.taqwa.total.toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-app-text border-r border-app-border">{r.totalProduction.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleCopy(r, 'combined')} className="text-app-text-muted hover:text-app-accent transition-colors p-1.5 rounded-sm hover:bg-app-accent/10" title="Copy Combined Summary"><Copy size={16} /></button>
                          <button onClick={() => setSelectedRecordForChart(r)} className="text-app-text-muted hover:text-app-accent transition-colors p-1.5 rounded-sm hover:bg-app-accent/10" title="View Chart"><PieChartIcon size={16} /></button>
                          <button onClick={() => { setUpdatingRecordId(r.id); fileInputRef.current?.click(); }} className="text-app-text-muted hover:text-amber-500 transition-colors p-1.5 rounded-sm hover:bg-amber-500/10" title="Upload New Report"><Upload size={16} /></button>
                          <button onClick={() => setRecordToDelete({id: r.id, date: r.date})} className="text-app-text-muted hover:text-rose-500 transition-colors p-1.5 rounded-sm hover:bg-rose-500/10" title="Delete Record"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-app-text-muted italic">No records found matching your filters.</td>
                    </tr>
                  )}
                </tbody>
              </>
            ) : (
              <>
                <thead className="bg-app-bg text-app-text-muted uppercase font-semibold">
                  <tr className="border-b border-app-border">
                    <th className="px-3 py-3 sticky left-0 bg-app-bg z-20 border-r border-app-border min-w-[100px] text-center">Date</th>
                    <th className="px-3 py-3 border-r border-app-border">Total</th>
                    <th className="px-3 py-3 border-r border-app-border">Inhouse</th>
                    <th className="px-3 py-3 border-r border-app-border">Subcon</th>
                    {colorGroupNames.map(name => (
                      <th key={name} className="px-3 py-3 min-w-[90px] border-r border-app-border">{name}</th>
                    ))}
                    <th className="px-3 py-3 sticky right-0 bg-app-bg z-20 border-l border-app-border min-w-[120px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {filteredRecords.map((r) => {
                    const ind = activeTab === 'lantabur' ? r.lantabur : r.taqwa;
                    return (
                      <tr key={r.id} className="table-row-hover group transition-colors">
                        <td className="px-3 py-3 font-bold text-app-text sticky left-0 bg-app-card z-10 border-r border-app-border text-center whitespace-nowrap transition-colors">{formatDisplayDate(r.date)}</td>
                        <td className="px-3 py-3 font-bold text-app-accent border-r border-app-border">{ind.total.toLocaleString()}</td>
                        <td className="px-3 py-3 text-emerald-500 font-medium border-r border-app-border">{ind.inhouse.toLocaleString()}</td>
                        <td className="px-3 py-3 text-amber-600 font-medium border-r border-app-border">{ind.subContract.toLocaleString()}</td>
                        {colorGroupNames.map(name => (
                          <td key={name} className="px-3 py-3 text-app-text-muted border-r border-app-border">
                            {getGroupValue(ind.colorGroups, name).toLocaleString()}
                          </td>
                        ))}
                        <td className="px-3 py-3 sticky right-0 bg-app-card z-10 border-l border-app-border text-center transition-colors">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => handleCopy(r, activeTab as any)} className="text-app-text-muted hover:text-app-accent transition-colors p-1 rounded-sm hover:bg-app-accent/10" title="Copy Text"><Copy size={13} /></button>
                            <button onClick={() => setSelectedRecordForChart(r)} className="text-app-text-muted hover:text-app-accent transition-colors p-1 rounded-sm hover:bg-app-accent/10" title="View Chart"><PieChartIcon size={13} /></button>
                            <button onClick={() => { setUpdatingRecordId(r.id); fileInputRef.current?.click(); }} className="text-app-text-muted hover:text-app-accent transition-colors p-1 rounded-sm hover:bg-app-accent/10" title="Update via Report"><Upload size={13} /></button>
                            <button onClick={() => setRecordToDelete({id: r.id, date: r.date})} className="text-app-text-muted hover:text-rose-500 transition-colors p-1 rounded-sm hover:bg-rose-500/10" title="Delete Record"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={colorGroupNames.length + 5} className="py-10 text-app-text-muted italic">No records found matching your filters.</td>
                    </tr>
                  )}
                </tbody>
              </>
            )}
          </table>
        </div>
      </section>

      {/* Analytics Summary Modal */}
      {showFilteredSummary && (
        <div 
          className="modal-overlay"
          onClick={() => setShowFilteredSummary(false)}
        >
          <div 
            className="bg-app-card rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-app-border"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-6 py-4 border-b border-app-border flex justify-between items-center bg-app-card shrink-0">
              <div className="flex flex-1 items-center justify-between mr-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-app-accent text-app-accent-contrast rounded-md shadow-sm">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-app-text">Data Analytics Summary</h2>
                    <p className="text-xs text-app-text-muted">Aggregated summary for {filteredRecords.length} records</p>
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Project:</span>
                    <span className="text-xs font-bold text-app-accent px-2 py-0.5 bg-app-accent/10 rounded-sm border border-app-accent/20 capitalize">
                      {activeTab === 'history' ? 'Combined Industries' : activeTab}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Range:</span>
                    <span className="text-xs font-medium text-app-text">
                      {startDate && endDate ? `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}` : 
                       startDate ? `From ${formatDisplayDate(startDate)}` :
                       endDate ? `Until ${formatDisplayDate(endDate)}` : "Full History"}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowFilteredSummary(false)} className="p-2 hover:bg-app-bg rounded-full transition-colors text-app-text-muted"><X size={20} /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-app-bg/10">
              {/* Aggregate KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-app-card p-4 rounded-lg border border-app-border shadow-sm">
                  <p className="text-[10px] font-bold text-app-text-muted uppercase mb-1">Total Production</p>
                  <p className="text-2xl font-black text-app-accent">{totals.combinedTotal.toLocaleString()} <span className="text-xs font-normal text-app-text-muted">kg</span></p>
                </div>
                {activeTab !== 'history' ? (
                  <>
                    <div className="bg-app-card p-4 rounded-lg border border-app-border shadow-sm">
                      <p className="text-[10px] font-bold text-app-text-muted uppercase mb-1">Total {activeTab} Weight</p>
                      <p className="text-2xl font-black text-emerald-600">{totals.industryTotal.toLocaleString()} <span className="text-xs font-normal text-app-text-muted">kg</span></p>
                    </div>
                    <div className="bg-app-card p-4 rounded-lg border border-app-border shadow-sm">
                      <p className="text-[10px] font-bold text-app-text-muted uppercase mb-1">Inhouse Weight</p>
                      <p className="text-2xl font-black text-app-text">{totals.inhouse.toLocaleString()} <span className="text-xs font-normal text-app-text-muted">kg</span></p>
                    </div>
                    <div className="bg-app-card p-4 rounded-lg border border-app-border shadow-sm">
                      <p className="text-[10px] font-bold text-app-text-muted uppercase mb-1">Subcon Weight</p>
                      <p className="text-2xl font-black text-amber-600">{totals.subContract.toLocaleString()} <span className="text-xs font-normal text-app-text-muted">kg</span></p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-app-card p-4 rounded-lg border border-app-border shadow-sm">
                      <p className="text-[10px] font-bold text-app-text-muted uppercase mb-1">Lantabur Total</p>
                      <p className="text-2xl font-black text-app-accent">{totals.lantaburTotal.toLocaleString()} <span className="text-xs font-normal text-app-text-muted">kg</span></p>
                    </div>
                    <div className="bg-app-card p-4 rounded-lg border border-app-border shadow-sm">
                      <p className="text-[10px] font-bold text-app-text-muted uppercase mb-1">Taqwa Total</p>
                      <p className="text-2xl font-black text-rose-500">{totals.taqwaTotal.toLocaleString()} <span className="text-xs font-normal text-app-text-muted">kg</span></p>
                    </div>
                    <div className="bg-app-card p-4 rounded-lg border border-app-border shadow-sm">
                      <p className="text-[10px] font-bold text-app-text-muted uppercase mb-1">Avg per Record</p>
                      <p className="text-2xl font-black text-app-text">{(totals.combinedTotal / Math.max(1, filteredRecords.length)).toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-xs font-normal text-app-text-muted">kg</span></p>
                    </div>
                  </>
                )}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-app-card p-6 rounded-lg border border-app-border shadow-sm">
                  <h3 className="text-sm font-bold text-app-text mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-app-accent"/> Production Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...filteredRecords].reverse()}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--app-accent)" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="var(--app-accent)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" />
                        <XAxis dataKey="date" hide />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="var(--app-text-muted)" />
                        <Tooltip 
                          contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '12px'}}
                          labelFormatter={(label) => formatDisplayDate(label)}
                        />
                        <Area type="monotone" dataKey="totalProduction" stroke="var(--app-accent)" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-app-card p-6 rounded-lg border border-app-border shadow-sm">
                  <h3 className="text-sm font-bold text-app-text mb-6 flex items-center gap-2"><PieChartIcon size={16} className="text-app-accent"/> {activeTab === 'history' ? 'Industry Share' : 'Source Share'}</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activeTab === 'history' ? [
                            { name: 'Lantabur', value: totals.lantaburTotal },
                            { name: 'Taqwa', value: totals.taqwaTotal }
                          ] : [
                            { name: 'Inhouse', value: totals.inhouse },
                            { name: 'Sub-Contract', value: totals.subContract }
                          ]}
                          innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none"
                        >
                          <Cell fill="var(--app-accent)" /><Cell fill="#f43f5e" />
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)'}} />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Table Section */}
              <div className="bg-app-card rounded-lg border border-app-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-app-border bg-app-bg/20 flex items-center gap-2">
                  <TableIcon size={16} className="text-app-accent" />
                  <h3 className="text-sm font-bold text-app-text">Detailed Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-[10px] border-collapse min-w-[1200px] border border-app-border">
                    <thead className="bg-app-bg text-app-text-muted uppercase font-bold sticky top-0 z-10 shadow-sm">
                      <tr className="border-b border-app-border">
                        <th className="px-3 py-3 text-center sticky left-0 bg-app-bg z-20 border-r border-app-border">Date</th>
                        <th className="px-3 py-3 border-r border-app-border">TOTAL</th>
                        <th className="px-3 py-3 border-r border-app-border">INHOUSE</th>
                        <th className="px-3 py-3 border-r border-app-border">SUBCON</th>
                        {colorGroupNames.map(name => (
                          <th key={name} className="px-3 py-3 min-w-[90px] border-r border-app-border">{name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border">
                      {filteredRecords.map(r => {
                        const isHistory = activeTab === 'history';
                        const weight = isHistory ? r.totalProduction : (activeTab === 'lantabur' ? r.lantabur.total : r.taqwa.total);
                        const inhouse = isHistory ? (r.lantabur.inhouse + r.taqwa.inhouse) : (activeTab === 'lantabur' ? r.lantabur.inhouse : r.taqwa.inhouse);
                        const subcon = isHistory ? (r.lantabur.subContract + r.taqwa.subContract) : (activeTab === 'lantabur' ? r.lantabur.subContract : r.taqwa.subContract);
                        
                        return (
                          <tr key={r.id} className="table-row-hover group transition-colors border-b border-app-border/50">
                            <td className="px-3 py-2 font-bold text-app-text sticky left-0 bg-app-card z-10 border-r border-app-border text-center transition-colors">{formatDisplayDate(r.date)}</td>
                            <td className="px-3 py-2 font-black text-app-accent border-r border-app-border">{weight.toLocaleString()}</td>
                            <td className="px-3 py-2 text-emerald-600 border-r border-app-border font-medium">{inhouse.toLocaleString()}</td>
                            <td className="px-3 py-2 text-amber-600 border-r border-app-border font-medium">{subcon.toLocaleString()}</td>
                            {colorGroupNames.map(name => {
                              const val = isHistory 
                                ? getGroupValue(r.lantabur.colorGroups, name) + getGroupValue(r.taqwa.colorGroups, name)
                                : getGroupValue(activeTab === 'lantabur' ? r.lantabur.colorGroups : r.taqwa.colorGroups, name);
                              return (
                                <td key={name} className="px-3 py-2 text-app-text-muted border-r border-app-border">{val.toLocaleString()}</td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] bg-app-card border-t-2 border-app-border">
                      <tr className="bg-app-accent/5 font-bold text-app-text">
                        <td className="px-3 py-2 text-center uppercase text-[10px] tracking-widest text-app-accent sticky left-0 bg-app-card border-r border-app-border">
                          SUMMARY
                        </td>
                        <td className="px-3 py-2 text-app-accent border-r border-app-border font-bold">
                          {(activeTab === 'history' ? totals.combinedTotal : totals.industryTotal).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-emerald-600 border-r border-app-border font-bold">
                          {totals.inhouse.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-amber-600 border-r border-app-border font-bold">
                          {totals.subContract.toLocaleString()}
                        </td>
                        {colorGroupNames.map(name => (
                          <td key={name} className="px-3 py-2 font-bold border-r border-app-border">
                            {(totals.colorGroups[name] || 0).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <footer className="p-4 border-t border-app-border flex justify-center bg-app-card shrink-0">
              <button onClick={() => setShowFilteredSummary(false)} className="px-10 py-2 bg-app-accent text-app-accent-contrast rounded-md text-sm font-bold hover:bg-app-accent-hover transition-all shadow-sm">Close Summary</button>
            </footer>
          </div>
        </div>
      )}

      {recordToDelete && (
        <div 
          className="modal-overlay"
          onClick={() => setRecordToDelete(null)}
        >
          <div 
            className="bg-app-card rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-app-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-md flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-app-text mb-2 uppercase">Confirm Purge</h3>
              <p className="text-sm text-app-text-muted">
                Are you sure you want to delete the production record for <span className="font-bold text-app-text">{formatDisplayDate(recordToDelete.date)}</span>? 
                This will remove data for both Lantabur and Taqwa industries.
              </p>
            </div>
            <div className="p-4 bg-app-bg/50 flex gap-3">
              <button onClick={() => setRecordToDelete(null)} className="flex-1 px-4 py-2 bg-app-card border border-app-border text-app-text rounded-md text-sm font-semibold hover:bg-app-bg transition-colors">Cancel</button>
              <button onClick={executeDelete} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-md text-sm font-semibold hover:bg-rose-700 transition-colors shadow-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {selectedRecordForChart && (() => {
        const isHistory = activeTab === 'history';
        const displayTitle = isHistory ? 'Production Insight' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Insight`;
        const displayTotal = isHistory 
          ? selectedRecordForChart.totalProduction 
          : selectedRecordForChart[activeTab as 'lantabur' | 'taqwa'].total;
        
        const inhouse = isHistory 
          ? (selectedRecordForChart.lantabur.inhouse + selectedRecordForChart.taqwa.inhouse) 
          : selectedRecordForChart[activeTab as 'lantabur' | 'taqwa'].inhouse;
          
        const subcon = isHistory 
          ? (selectedRecordForChart.lantabur.subContract + selectedRecordForChart.taqwa.subContract) 
          : selectedRecordForChart[activeTab as 'lantabur' | 'taqwa'].subContract;

        return (
          <div 
            className="modal-overlay"
            onClick={() => setSelectedRecordForChart(null)}
          >
            <div 
              className="bg-app-card rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-app-border"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-card shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-app-accent text-app-accent-contrast rounded-md shadow-lg ring-4 ring-app-accent/10">
                    {isHistory ? <Sigma size={24} /> : <Factory size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-app-text tracking-tight uppercase">{displayTitle}</h2>
                      <span className="px-2 py-0.5 bg-app-accent/10 text-app-accent text-[10px] font-bold rounded-sm border border-app-accent/20 uppercase tracking-widest">Live Record</span>
                    </div>
                    <p className="text-sm text-app-text-muted font-medium flex items-center gap-1.5 mt-0.5">
                      <Calendar size={14} /> {formatDisplayDate(selectedRecordForChart.date)}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedRecordForChart(null)} className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-all text-app-text-muted"><X size={24} /></button>
              </header>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-app-bg/10">
                {/* Hero KPI Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-app-card p-5 rounded-lg border border-app-border shadow-sm group hover:border-app-accent transition-all">
                    <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mb-1.5">Total Weight Output</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-black text-app-accent">{displayTotal.toLocaleString()}</p>
                      <span className="text-xs font-bold text-app-text-muted mb-1">KG</span>
                    </div>
                  </div>
                  <div className="bg-app-card p-5 rounded-lg border border-app-border shadow-sm group hover:border-emerald-500 transition-all">
                    <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mb-1.5">Inhouse Processing</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-black text-emerald-600">{inhouse.toLocaleString()}</p>
                      <span className="text-xs font-bold text-app-text-muted mb-1">KG</span>
                    </div>
                  </div>
                  <div className="bg-app-card p-5 rounded-lg border border-app-border shadow-sm group hover:border-amber-500 transition-all">
                    <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mb-1.5">Sub-Contract Ops</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-black text-amber-600">{subcon.toLocaleString()}</p>
                      <span className="text-xs font-bold text-app-text-muted mb-1">KG</span>
                    </div>
                  </div>
                  <div className="bg-app-card p-5 rounded-lg border border-app-border shadow-sm group hover:border-violet-500 transition-all">
                    <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mb-1.5">Color Variants</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-black text-violet-600">
                        {colorGroupNames.filter(name => {
                          const val = isHistory 
                            ? (getGroupValue(selectedRecordForChart.lantabur.colorGroups, name) + getGroupValue(selectedRecordForChart.taqwa.colorGroups, name))
                            : getGroupValue(selectedRecordForChart[activeTab as 'lantabur' | 'taqwa'].colorGroups, name);
                          return val > 0;
                        }).length}
                      </p>
                      <span className="text-xs font-bold text-app-text-muted mb-1">UNITS</span>
                    </div>
                  </div>
                </div>

                {/* Side by Side Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Distribution Profile (Horizontal Bar) */}
                  <div className="bg-app-card p-6 rounded-lg border border-app-border shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-black text-app-text uppercase tracking-widest flex items-center gap-2">
                        <BarChart2 size={18} className="text-app-accent" />
                        Distribution Profile
                      </h3>
                      {!isHistory && (
                        <div className="px-3 py-1 bg-app-accent/5 rounded-sm text-[10px] font-bold text-app-accent border border-app-accent/10">
                          {activeTab.toUpperCase()} SOURCE
                        </div>
                      )}
                    </div>
                    <div className="h-[340px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          layout="vertical" 
                          data={colorGroupNames.map((name, index) => ({
                            name,
                            weight: isHistory 
                              ? (getGroupValue(selectedRecordForChart.lantabur.colorGroups, name) + getGroupValue(selectedRecordForChart.taqwa.colorGroups, name))
                              : getGroupValue(selectedRecordForChart[activeTab as 'lantabur' | 'taqwa'].colorGroups, name),
                            fill: CHART_COLORS[index % CHART_COLORS.length]
                          })).filter(d => d.weight > 0).sort((a,b) => b.weight - a.weight)}
                          margin={{ left: 20, right: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--app-border)" opacity={0.5} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            fontSize={11} 
                            width={120} 
                            stroke="var(--app-text)"
                            fontWeight={600}
                          />
                          <Tooltip 
                            cursor={{fill: 'var(--app-bg)', opacity: 0.5}} 
                            contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)'}}
                            itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                          />
                          <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Operational Mix and Industry Contrib */}
                  <div className="space-y-6">
                    <div className="bg-app-card p-6 rounded-lg border border-app-border shadow-sm">
                      <h3 className="text-sm font-black text-app-text uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Layers size={18} className="text-app-accent" />
                        Operational Mix
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Inhouse', value: inhouse },
                                { name: 'Sub-Contract', value: subcon }
                              ]}
                              innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#f59e0b" />
                            </Pie>
                            <Tooltip 
                              contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)'}}
                              itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                            />
                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 600, color: 'var(--app-text)'}} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {isHistory && (
                      <div className="bg-app-card p-6 rounded-lg border border-app-border shadow-sm">
                        <h3 className="text-sm font-black text-app-text uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Activity size={18} className="text-app-accent" />
                          Industry contribution
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { name: 'Lantabur', weight: selectedRecordForChart.lantabur.total },
                              { name: 'Taqwa', weight: selectedRecordForChart.taqwa.total }
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="var(--app-text)" fontWeight={600} />
                              <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="var(--app-text-muted)" />
                              <Tooltip cursor={{fill: 'var(--app-bg)', opacity: 0.5}} />
                              <Bar dataKey="weight" radius={[4, 4, 0, 0]} barSize={50}>
                                <Cell fill="var(--app-accent)" />
                                <Cell fill="#f43f5e" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row Value Sheet */}
                <div className="bg-app-card rounded-lg border border-app-border shadow-sm overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-app-border bg-app-bg/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TableIcon size={18} className="text-app-accent" />
                      <h3 className="text-sm font-black text-app-text uppercase tracking-widest">Row Value Sheet</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-app-border bg-app-bg/10">
                          <th className="px-6 py-3 text-[10px] font-bold text-app-text-muted uppercase tracking-widest">Category Detail</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-app-text-muted uppercase tracking-widest text-right">Extracted Net Weight (KG)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-app-border/50">
                        <tr className="bg-app-accent/5">
                          <td className="px-6 py-3 text-sm font-bold text-app-accent uppercase">Aggregated Production Output</td>
                          <td className="px-6 py-3 text-sm font-black text-app-accent text-right">{displayTotal.toLocaleString()}</td>
                        </tr>
                        {colorGroupNames.map((name) => {
                          const val = isHistory 
                            ? (getGroupValue(selectedRecordForChart.lantabur.colorGroups, name) + getGroupValue(selectedRecordForChart.taqwa.colorGroups, name))
                            : getGroupValue(selectedRecordForChart[activeTab as 'lantabur' | 'taqwa'].colorGroups, name);
                          
                          if (val === 0) return null;
                          
                          return (
                            <tr key={name} className="hover:bg-app-bg/5 transition-colors">
                              <td className="px-6 py-2 text-xs font-medium text-app-text uppercase tracking-tighter">{name}</td>
                              <td className="px-6 py-2 text-xs font-bold text-app-text text-right">{val.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <footer className="p-5 border-t border-app-border text-center bg-app-card shrink-0 flex items-center justify-between px-8">
                <p className="text-[10px] text-app-text-muted font-bold uppercase tracking-widest">Lantabur IT v2.5</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const csv = `Category,Value\nTotal,${displayTotal}\nInhouse,${inhouse}\nSubcon,${subcon}\n` + colorGroupNames.map(name => `${name},${isHistory ? (getGroupValue(selectedRecordForChart.lantabur.colorGroups, name) + getGroupValue(selectedRecordForChart.taqwa.colorGroups, name)) : getGroupValue(selectedRecordForChart[activeTab as 'lantabur' | 'taqwa'].colorGroups, name)}`).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      triggerDownload(blob, `Production_Insight_${selectedRecordForChart.date}.csv`);
                    }}
                    className="px-6 py-2 bg-app-bg border border-app-border text-app-text rounded-md text-sm font-bold hover:bg-app-border/10 transition-all flex items-center gap-2"
                  >
                    <FileSpreadsheet size={16} /> Export CSV
                  </button>
                  <button 
                    onClick={() => setSelectedRecordForChart(null)} 
                    className="px-10 py-2 bg-app-text text-app-card rounded-md text-sm font-black hover:opacity-90 transition-all shadow-sm active:scale-95"
                  >
                    Dismiss
                  </button>
                </div>
              </footer>
            </div>
          </div>
        );
      })()}
    </div>
  );
};