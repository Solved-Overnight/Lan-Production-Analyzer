import React, { useMemo, useState, useEffect, useRef } from 'react';
import { RFTReportRecord, RFTBatchEntry } from './types';
import { PasskeyModal } from './components/PasskeyModal';
import { 
  Timer, Activity, Scale, AlertCircle, Trophy, BarChart2, 
  Target, Calendar, Edit3, Save, X, Loader2, Database,
  TrendingUp, Users, User, ShieldCheck, Info, BarChart,
  ArrowUpRight, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Hash, Zap,
  FileSpreadsheet, Download, RefreshCw, Droplets, Layers, Clock, BrainCircuit,
  MessageSquareQuote, Sparkles, RotateCw, Globe, Package
} from 'lucide-react';
import { parseCustomDate } from './App';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Bar, LabelList, Area, AreaChart,
  BarChart as ReBarChart
} from 'recharts';
import { DownloadButton } from './components/Charts';
import { GoogleGenAI } from "@google/genai";

interface ShiftPerformanceProps {
  records: RFTReportRecord[];
  onUpdateRecord?: (record: RFTReportRecord) => void;
  onLoadFullHistory?: () => void;
}

const SHIFT_TARGET = 12250; 
const CHART_COLORS = {
  yousuf: '#6366f1',
  humayun: '#f59e0b',
  color: '#8b5cf6', 
  white: '#94a3b8', 
  wash: '#06b6d4',  
  re: '#f43f5e',
  notOk: '#ef4444'
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

type GraphViewType = 'velocity' | 'notOk' | 'efficiency' | 'groups';

export const ShiftPerformance: React.FC<ShiftPerformanceProps> = ({ records, onUpdateRecord, onLoadFullHistory }) => {
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [graphView, setGraphView] = useState<GraphViewType>('velocity');
  
  const [localManualNotOk, setLocalManualNotOk] = useState<Record<string, { yousuf: string; humayun: string }>>({});
  const [localManualRe, setLocalManualRe] = useState<Record<string, { yousuf: string; humayun: string }>>({});
  const [localManualNote, setLocalManualNote] = useState<Record<string, { yousuf: string; humayun: string }>>({});
  const [localManualDayCount, setLocalManualDayCount] = useState<Record<string, { yousuf: string; humayun: string }>>({});

  const mainGraphRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date();
    if (filterMonth !== today.getMonth() || filterYear !== today.getFullYear()) {
      if (onLoadFullHistory) onLoadFullHistory();
    }
  }, [filterMonth, filterYear, onLoadFullHistory]);

  const handleRetrieve = () => {
    setIsRetrieving(true);
    if (onLoadFullHistory) onLoadFullHistory();
    setTimeout(() => setIsRetrieving(false), 800);
  };

  const [passkeyContext, setPasskeyContext] = useState<{ isOpen: boolean; action: () => void; label: string }>({
    isOpen: false,
    action: () => {},
    label: ''
  });

  const requestAdmin = (label: string, action: () => void) => {
    setPasskeyContext({ isOpen: true, action, label });
  };

  const evaluateFormula = (input: string): number => {
    if (!input) return 0;
    if (input.startsWith('=')) {
      try {
        const cleanExpr = input.substring(1).replace(/[^-+/*0-9.]/g, '');
        if (/[0-9]$/.test(cleanExpr)) {
          return Number(new Function(`return ${cleanExpr}`)()) || 0;
        }
      } catch (e) {
        return 0;
      }
    }
    return parseFloat(input) || 0;
  };

  const aggregateShiftData = (entries: RFTBatchEntry[]) => {
    return entries.reduce((acc, entry) => {
      const qty = Number(entry.fQty) || 0;
      const group = (entry.colorGroup || "").toUpperCase();
      const isWhite = group === 'WHITE';
      const isWash = group.includes('WASH') || (entry.dyeingType || "").toUpperCase().includes('WASH');
      const isRe = (entry.remarks || "").toUpperCase().includes('RE');

      if (isWhite) acc.white += qty;
      else if (isWash) acc.wash += qty;
      else if (isRe) acc.reMatching += qty;
      else acc.color += qty;

      acc.totalProd += qty;
      acc.batchCount += 1;
      return acc;
    }, { color: 0, white: 0, wash: 0, reMatching: 0, totalProd: 0, batchCount: 0 });
  };

  useEffect(() => {
    const notOkData: Record<string, { yousuf: string; humayun: string }> = {};
    const reData: Record<string, { yousuf: string; humayun: string }> = {};
    const noteData: Record<string, { yousuf: string; humayun: string }> = {};
    const dayCountData: Record<string, { yousuf: string; humayun: string }> = {};
    
    records.forEach(r => {
      notOkData[r.id] = { 
        yousuf: r.manualNotOkFormula?.yousuf || r.manualNotOk?.yousuf?.toString() || '0', 
        humayun: r.manualNotOkFormula?.humayun || r.manualNotOk?.humayun?.toString() || '0' 
      };
      reData[r.id] = { 
        yousuf: r.manualReMatchingFormula?.yousuf || r.manualReMatching?.yousuf?.toString() || '0', 
        humayun: r.manualReMatchingFormula?.humayun || r.manualReMatching?.humayun?.toString() || '0' 
      };
      noteData[r.id] = {
        yousuf: r.manualNote?.yousuf || '',
        humayun: r.manualNote?.humayun || ''
      };
      dayCountData[r.id] = {
        yousuf: r.manualDayCountFormula?.yousuf || r.manualDayCount?.yousuf?.toString() || '1',
        humayun: r.manualDayCountFormula?.humayun || r.manualDayCount?.humayun?.toString() || '1'
      };
    });
    setLocalManualNotOk(notOkData);
    setLocalManualRe(reData);
    setLocalManualNote(noteData);
    setLocalManualDayCount(dayCountData);
  }, [records]);

  const reportData = useMemo(() => {
    const filtered = records.filter(r => {
      const d = parseCustomDate(r.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });

    const days = new Date(filterYear, filterMonth + 1, 0).getDate();
    const rows = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const dObj = new Date(filterYear, filterMonth, day);
      const isFriday = dObj.getDay() === 5;
      
      const matchingRecords = filtered.filter(r => parseCustomDate(r.date).getDate() === day);
      const dailyEntries = matchingRecords.flatMap(r => r.entries || []);
      
      const yEntries = dailyEntries.filter(e => (e.shiftUnload || "").toUpperCase().includes('YOUSUF'));
      const hEntries = dailyEntries.filter(e => (e.shiftUnload || "").toUpperCase().includes('HUMAYUN'));

      const yStats = aggregateShiftData(yEntries);
      const hStats = aggregateShiftData(hEntries);

      const recordId = matchingRecords[0]?.id;
      
      const manualNotOkStrs = (recordId && localManualNotOk[recordId]) || { yousuf: '0', humayun: '0' };
      const yousufNotOk = evaluateFormula(manualNotOkStrs.yousuf);
      const humayunNotOk = evaluateFormula(manualNotOkStrs.humayun);

      const manualReStrs = (recordId && localManualRe[recordId]) || { yousuf: yStats.reMatching.toString(), humayun: hStats.reMatching.toString() };
      const yousufRe = evaluateFormula(manualReStrs.yousuf);
      const humayunRe = evaluateFormula(manualReStrs.humayun);

      const manualNoteStrs = (recordId && localManualNote[recordId]) || { yousuf: '', humayun: '' };

      const manualDayCountStrs = (recordId && localManualDayCount[recordId]) || { 
        yousuf: yStats.totalProd > 0 ? '1' : '0', 
        humayun: hStats.totalProd > 0 ? '1' : '0' 
      };
      const yousufDayCount = evaluateFormula(manualDayCountStrs.yousuf);
      const humayunDayCount = evaluateFormula(manualDayCountStrs.humayun);

      return {
        day: `${day}-${MONTHS[filterMonth].substring(0, 3).toUpperCase()}`,
        isFriday,
        recordId: recordId || null,
        yousuf: { 
          ...yStats, 
          reMatching: yousufRe,
          reMatchingFormula: manualReStrs.yousuf,
          notOk: yousufNotOk, 
          notOkFormula: manualNotOkStrs.yousuf,
          dayCount: yousufDayCount,
          dayCountFormula: manualDayCountStrs.yousuf,
          actual: yStats.totalProd - yousufNotOk, 
          eff: yousufDayCount > 0 ? ((yStats.totalProd - yousufNotOk) / (SHIFT_TARGET * yousufDayCount)) * 100 : 0,
          note: manualNoteStrs.yousuf
        },
        humayun: { 
          ...hStats, 
          reMatching: humayunRe,
          reMatchingFormula: manualReStrs.humayun,
          notOk: humayunNotOk, 
          notOkFormula: manualNotOkStrs.humayun,
          dayCount: humayunDayCount,
          dayCountFormula: manualDayCountStrs.humayun,
          actual: hStats.totalProd - humayunNotOk, 
          eff: humayunDayCount > 0 ? ((hStats.totalProd - humayunNotOk) / (SHIFT_TARGET * humayunDayCount)) * 100 : 0,
          note: manualNoteStrs.humayun
        }
      };
    });

    const totals = rows.reduce((acc, row) => {
      const keys = ['color', 'white', 'wash', 'reMatching', 'totalProd', 'batchCount', 'notOk', 'actual', 'dayCount'];
      keys.forEach(k => {
        (acc.yousuf as any)[k] += (row.yousuf as any)[k] || 0;
        (acc.humayun as any)[k] += (row.humayun as any)[k] || 0;
      });

      if (row.isFriday) {
        if (row.yousuf.dayCount > 0) {
          acc.yousuf.fridayCount += 1;
          acc.yousuf.fridayHours += (row.yousuf.dayCount * 24);
        }
        if (row.humayun.dayCount > 0) {
          acc.humayun.fridayCount += 1;
          acc.humayun.fridayHours += (row.humayun.dayCount * 24);
        }
      }

      return acc;
    }, {
      yousuf: { color: 0, white: 0, wash: 0, reMatching: 0, totalProd: 0, batchCount: 0, notOk: 0, actual: 0, eff: 0, dayCount: 0, fridayCount: 0, fridayHours: 0 },
      humayun: { color: 0, white: 0, wash: 0, reMatching: 0, totalProd: 0, batchCount: 0, notOk: 0, actual: 0, eff: 0, dayCount: 0, fridayCount: 0, fridayHours: 0 }
    });

    const totalWorkingDaysYousuf = totals.yousuf.dayCount;
    const totalWorkingDaysHumayun = totals.humayun.dayCount;

    const avgMonthlyEffYousuf = totalWorkingDaysYousuf > 0 ? (totals.yousuf.actual / (SHIFT_TARGET * totalWorkingDaysYousuf)) * 100 : 0;
    const avgMonthlyEffHumayun = totalWorkingDaysHumayun > 0 ? (totals.humayun.actual / (SHIFT_TARGET * totalWorkingDaysHumayun)) * 100 : 0;

    // Time-based Production Totals
    const now = new Date();
    const todayStr = `${now.getDate()}-${MONTHS[now.getMonth()].substring(0, 3).toUpperCase()}`;
    const todayProd = rows.find(r => r.day === todayStr) ? (rows.find(r => r.day === todayStr)!.yousuf.totalProd + rows.find(r => r.day === todayStr)!.humayun.totalProd) : 0;
    const monthProd = totals.yousuf.totalProd + totals.humayun.totalProd;
    
    const yearProd = records.filter(r => parseCustomDate(r.date).getFullYear() === filterYear)
      .reduce((sum, r) => sum + r.entries.reduce((s, e) => s + (Number(e.fQty) || 0), 0), 0);
    
    const globalTotalProd = records.reduce((sum, r) => sum + r.entries.reduce((s, e) => s + (Number(e.fQty) || 0), 0), 0);

    return { 
      rows, totals, recordCount: filtered.length, avgMonthlyEffYousuf, avgMonthlyEffHumayun, 
      daysInMonth: days, totalWorkingDaysYousuf, totalWorkingDaysHumayun,
      monthName: MONTHS[filterMonth],
      summary: {
        today: todayProd,
        month: monthProd,
        year: yearProd,
        total: globalTotalProd
      }
    };
  }, [records, filterMonth, filterYear, localManualNotOk, localManualRe, localManualNote, localManualDayCount]);

  const handleManualUpdate = (recordId: string, shift: 'yousuf' | 'humayun', field: 'notOk' | 'reMatching' | 'note' | 'dayCount', value: string) => {
    if (field === 'notOk') {
      setLocalManualNotOk(prev => ({...prev, [recordId]: { ...(prev[recordId] || { yousuf: '0', humayun: '0' }), [shift]: value }}));
    } else if (field === 'reMatching') {
      setLocalManualRe(prev => ({...prev, [recordId]: { ...(prev[recordId] || { yousuf: '0', humayun: '0' }), [shift]: value }}));
    } else if (field === 'note') {
      setLocalManualNote(prev => ({...prev, [recordId]: { ...(prev[recordId] || { yousuf: '', humayun: '' }), [shift]: value }}));
    } else if (field === 'dayCount') {
      setLocalManualDayCount(prev => ({...prev, [recordId]: { ...(prev[recordId] || { yousuf: '1', humayun: '1' }), [shift]: value }}));
    }
  };

  const saveAllChanges = async () => {
    if (!onUpdateRecord) return;
    setIsEditing(false); setIsSaving(true);
    try {
      const allRecordIds = Array.from(new Set([
        ...Object.keys(localManualNotOk), 
        ...Object.keys(localManualRe), 
        ...Object.keys(localManualNote),
        ...Object.keys(localManualDayCount)
      ]));
      await Promise.all(allRecordIds.map(id => {
        const record = records.find(r => r.id === id);
        if (record) {
          const yousufNotOkStr = localManualNotOk[id]?.yousuf || '0';
          const humayunNotOkStr = localManualNotOk[id]?.humayun || '0';
          const yousufReStr = localManualRe[id]?.yousuf || '0';
          const humayunReStr = localManualRe[id]?.humayun || '0';
          const yousufNote = localManualNote[id]?.yousuf || '';
          const humayunNote = localManualNote[id]?.humayun || '';
          const yousufDayCountStr = localManualDayCount[id]?.yousuf || '1';
          const humayunDayCountStr = localManualDayCount[id]?.humayun || '1';

          return onUpdateRecord({ 
            ...record, 
            manualNotOk: { yousuf: evaluateFormula(yousufNotOkStr), humayun: evaluateFormula(humayunNotOkStr) },
            manualNotOkFormula: { yousuf: yousufNotOkStr, humayun: humayunNotOkStr },
            manualReMatching: { yousuf: evaluateFormula(yousufReStr), humayun: evaluateFormula(humayunReStr) },
            manualReMatchingFormula: { yousuf: yousufReStr, humayun: humayunReStr },
            manualDayCount: { yousuf: evaluateFormula(yousufDayCountStr), humayun: evaluateFormula(humayunDayCountStr) },
            manualDayCountFormula: { yousuf: yousufDayCountStr, humayun: humayunDayCountStr },
            manualNote: { yousuf: yousufNote, humayun: humayunNote }
          });
        }
        return Promise.resolve();
      }));
    } catch (err) { console.error(err); } finally { setIsSaving(false); }
  };

  const handleExportExcel = () => {
    const headers = [
      "Date", "Is Friday",
      "Yousuf Total", "Yousuf Color", "Yousuf White", "Yousuf N.Wash", "Yousuf RE-MATCHING", "Yousuf NOT OK", "Yousuf Day Count", "Yousuf Actual", "Yousuf Eff%", "Yousuf Note",
      "Humayun Total", "Humayun Color", "Humayun White", "Humayun N.Wash", "Humayun RE-MATCHING", "Humayun NOT OK", "Humayun Day Count", "Humayun Actual", "Humayun Eff%", "Humayun Note"
    ];

    const csvRows = reportData.rows.map(row => [
      row.day, row.isFriday ? "YES" : "NO",
      row.yousuf.totalProd, row.yousuf.color, row.yousuf.white, row.yousuf.wash, row.yousuf.reMatching, row.yousuf.notOk, row.yousuf.dayCount, row.yousuf.actual, `${row.yousuf.eff.toFixed(2)}%`, `"${row.yousuf.note || ''}"`,
      row.humayun.totalProd, row.humayun.color, row.humayun.white, row.humayun.wash, row.humayun.reMatching, row.humayun.notOk, row.humayun.dayCount, row.humayun.actual, `${row.humayun.eff.toFixed(2)}%`, `"${row.humayun.note || ''}"`
    ]);

    const totalsRow = [
      "MONTHLY TOTALS", "",
      reportData.totals.yousuf.totalProd, reportData.totals.yousuf.color, reportData.totals.yousuf.white, reportData.totals.yousuf.wash, reportData.totals.yousuf.reMatching, reportData.totals.yousuf.notOk, reportData.totals.yousuf.dayCount, reportData.totals.yousuf.actual, `${reportData.avgMonthlyEffYousuf.toFixed(2)}%`, "",
      reportData.totals.humayun.totalProd, reportData.totals.humayun.color, reportData.totals.humayun.white, reportData.totals.humayun.wash, reportData.totals.humayun.reMatching, reportData.totals.humayun.notOk, reportData.totals.humayun.dayCount, reportData.totals.humayun.actual, `${reportData.avgMonthlyEffHumayun.toFixed(2)}%`, ""
    ];

    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(',')), totalsRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Shift_Performance_${MONTHS[filterMonth]}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dailyVelocityData = useMemo(() => reportData.rows.map(r => ({ 
    name: r.day, 
    yousuf: r.yousuf.totalProd, 
    humayun: r.humayun.totalProd 
  })), [reportData]);

  const monthlyQualityData = useMemo(() => [{ name: 'YOUSUF', value: reportData.totals.yousuf.notOk, fill: CHART_COLORS.yousuf }, { name: 'HUMAYUN', value: reportData.totals.humayun.notOk, fill: CHART_COLORS.humayun }], [reportData]);
  const monthlyEfficiencyData = useMemo(() => [{ name: 'YOUSUF', value: parseFloat(reportData.avgMonthlyEffYousuf.toFixed(2)), fill: CHART_COLORS.yousuf }, { name: 'HUMAYUN', value: parseFloat(reportData.avgMonthlyEffHumayun.toFixed(2)), fill: CHART_COLORS.humayun }], [reportData]);
  const monthlyColorGroupData = useMemo(() => [
    { name: 'COLOR', yousuf: reportData.totals.yousuf.color, humayun: reportData.totals.humayun.color }, 
    { name: 'WHITE', yousuf: reportData.totals.yousuf.white, humayun: reportData.totals.humayun.white }, 
    { name: 'N.WASH', yousuf: reportData.totals.yousuf.wash, humayun: reportData.totals.humayun.wash }, 
    { name: 'RE-MATCHING', yousuf: reportData.totals.yousuf.reMatching, humayun: reportData.totals.humayun.reMatching }, 
    { name: 'NOT OK', yousuf: reportData.totals.yousuf.notOk, humayun: reportData.totals.humayun.notOk }
  ], [reportData]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-500 rounded flex items-center justify-center text-white shadow-lg ring-4 ring-amber-500/10"><Timer size={22} /></div>
          <div>
            <h1 className="text-xl font-black text-app-text uppercase tracking-tight leading-none">Shift Performance Command</h1>
            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mt-1">Industrial Intelligence Summary</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-app-card border border-app-border rounded-lg p-1 shadow-sm items-center">
            <div className="px-2 text-app-accent"><Calendar size={14} /></div>
            <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-transparent text-[10px] font-black uppercase focus:outline-none cursor-pointer border-r border-app-border px-4 py-1.5">{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-transparent text-[10px] font-black uppercase focus:outline-none cursor-pointer px-4 py-1.5">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
          <button onClick={handleRetrieve} disabled={isRetrieving} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50">
             {isRetrieving ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Fetch Node History
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <VisualKPICard label="Today's Production" value={`${(reportData.summary.today / 1000).toFixed(1)}k`} unit="kg" subtitle="Last 24h Registry" icon={Zap} color="indigo" />
        <VisualKPICard label="This Month Total" value={`${(reportData.summary.month / 1000).toFixed(1)}k`} unit="kg" subtitle={`Total ${reportData.monthName}`} icon={Calendar} color="emerald" />
        <VisualKPICard label="This Year Cumulative" value={`${(reportData.summary.year / 1000).toFixed(1)}k`} unit="kg" subtitle={`Node Cycle ${filterYear}`} icon={Target} color="rose" />
        <VisualKPICard label="Total Product" value={`${(reportData.summary.total / 1000).toFixed(1)}k`} unit="kg" subtitle="Life Cycle Hub Total" icon={Package} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[560px]">
        <div className="lg:col-span-2 flex flex-col gap-6 h-full overflow-hidden">
          <div ref={mainGraphRef} className="relative group bg-app-card p-6 rounded-lg border border-app-border shadow-sm shrink-0">
            <DownloadButton targetRef={mainGraphRef} title={`Shift_Performance_${graphView}`} />
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#1e293b] uppercase tracking-tight flex items-center gap-2"><TrendingUp className="text-[#10b981]" size={20} /> PRODUCTION VELOCITY</h3>
                <p className="text-[10px] text-app-text-muted font-black uppercase tracking-widest">DAILY TOTAL KG UNLOADED (GROSS)</p>
              </div>
              <div className="flex bg-app-bg p-1 rounded-lg border border-app-border shadow-sm">
                 <button onClick={() => setGraphView('velocity')} className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${graphView === 'velocity' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Velocity</button>
                 <button onClick={() => setGraphView('groups')} className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${graphView === 'groups' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Groups</button>
                 <button onClick={() => setGraphView('notOk')} className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${graphView === 'notOk' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Not Ok</button>
                 <button onClick={() => setGraphView('efficiency')} className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${graphView === 'efficiency' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Efficiency %</button>
              </div>
            </div>
            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {graphView === 'velocity' ? (
                  <AreaChart data={dailyVelocityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorYousuf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS.yousuf} stopOpacity={0.1}/><stop offset="95%" stopColor={CHART_COLORS.yousuf} stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorHumayun" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS.humayun} stopOpacity={0.1}/><stop offset="95%" stopColor={CHART_COLORS.humayun} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} />
                    <XAxis dataKey="name" hide /><YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                    <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 'bold'}} formatter={(val: number) => [`${val.toLocaleString()} kg`, 'Production']} />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase'}} />
                    <Area type="monotone" dataKey="yousuf" name="YOUSUF" stroke={CHART_COLORS.yousuf} strokeWidth={3} fillOpacity={1} fill="url(#colorYousuf)" /><Area type="monotone" dataKey="humayun" name="HUMAYUN" stroke={CHART_COLORS.humayun} strokeWidth={3} fillOpacity={1} fill="url(#colorHumayun)" />
                  </AreaChart>
                ) : graphView === 'notOk' ? (
                  <ReBarChart data={monthlyQualityData} margin={{ top: 25, right: 30, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} /><XAxis dataKey="name" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} dy={10} /><YAxis hide />
                    <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 'bold'}} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={80}>{monthlyQualityData.map((e, i) => <Cell key={i} fill={e.fill} />)}<LabelList dataKey="value" position="top" style={{ fontSize: '9px', fontWeight: '900', fill: '#1e293b' }} formatter={(v: number) => `${v.toLocaleString()} kg`} /></Bar>
                  </ReBarChart>
                ) : graphView === 'groups' ? (
                  <ReBarChart data={monthlyColorGroupData} margin={{ top: 25, right: 30, left: 30, bottom: 0 }} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} /><XAxis dataKey="name" fontSize={9} fontWeight={900} axisLine={false} tickLine={false} dy={10} /><YAxis hide />
                    <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 'bold'}} />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase'}} />
                    <Bar dataKey="yousuf" name="YOUSUF" fill={CHART_COLORS.yousuf} radius={[4, 4, 0, 0]} barSize={35}><LabelList dataKey="yousuf" position="top" style={{ fontSize: '8px', fontWeight: '900', fill: CHART_COLORS.yousuf }} formatter={(val: number) => val > 0 ? `${(val/1000).toFixed(1)}k` : ''} /></Bar>
                    <Bar dataKey="humayun" name="HUMAYUN" fill={CHART_COLORS.humayun} radius={[4, 4, 0, 0]} barSize={35}><LabelList dataKey="humayun" position="top" style={{ fontSize: '8px', fontWeight: '900', fill: CHART_COLORS.humayun }} formatter={(val: number) => val > 0 ? `${(val/1000).toFixed(1)}k` : ''} /></Bar>
                  </ReBarChart>
                ) : (
                  <ReBarChart data={monthlyEfficiencyData} margin={{ top: 25, right: 30, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} /><XAxis dataKey="name" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} dy={10} /><YAxis hide />
                    <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 'bold'}} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={80}>{monthlyEfficiencyData.map((e, i) => <Cell key={i} fill={e.fill} />)}<LabelList dataKey="value" position="top" style={{ fontSize: '9px', fontWeight: '900', fill: '#1e293b' }} formatter={(v: number) => `${v}%`} /></Bar>
                  </ReBarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[230px]">
                <SupervisorFridayTable name="YOUSUF" color="indigo" rows={reportData.rows} shiftKey="yousuf" />
                <SupervisorFridayTable name="HUMAYUN" color="amber" rows={reportData.rows} shiftKey="humayun" />
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UNIFIED FLIP CARD (PORTFOLIO & ANALYSIS) */}
        <div className="relative group bg-transparent perspective-1000 h-full">
          <UnifiedPortfolioAnalysis reportData={reportData} />
        </div>
      </div>

      <div ref={tableContainerRef} className="relative group bg-[#fef9c3] border-[3px] border-[#a16207]/30 rounded-lg overflow-hidden shadow-xl mt-6">
         <DownloadButton targetRef={tableContainerRef} title={`Shift_Report_Table_${MONTHS[filterMonth].substring(0, 3)}_${filterYear}`} />
         <div className="bg-[#fde68a] px-6 py-4 border-b-2 border-[#a16207]/20 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Database size={40} /></div>
            <div className="w-[320px] hidden md:block"></div>
            <h2 className="flex-1 text-xl font-black text-[#854d0e] uppercase italic tracking-widest flex items-center justify-center gap-3 text-center"><Target size={20} className="text-[#a16207]" /> Shift Wise Production Report {MONTHS[filterMonth].substring(0, 3).toUpperCase()}-{filterYear}</h2>
            <div className="flex items-center gap-2 w-[320px] justify-end relative z-10">
               {!isEditing ? (
                 <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-app-accent text-white rounded-md text-[10px] font-black uppercase hover:bg-app-accent-hover transition-all shadow-md active:scale-95 whitespace-nowrap"><Edit3 size={14} /> Edit Quality Data</button>
               ) : (
                 <div className="flex items-center gap-2">
                   <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 bg-app-card border border-app-border text-app-text-muted rounded-md text-[10px] font-black uppercase hover:text-rose-500 transition-all">Cancel</button>
                   <button onClick={() => requestAdmin("Save Quality Performance Changes", saveAllChanges)} disabled={isSaving} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase hover:bg-emerald-700 shadow-md active:scale-95 disabled:opacity-50">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save</button>
                 </div>
               )}
               <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-md text-[10px] font-bold uppercase hover:bg-emerald-700 shadow-md active:scale-95 whitespace-nowrap"><FileSpreadsheet size={14} /> EXPORT REPORT</button>
            </div>
         </div>
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-center text-[9px] border-collapse min-w-[1400px]">
               <thead className="bg-[#e2e8f0] text-[#1e293b] font-black uppercase border-b-2 border-slate-300">
                  <tr className="border-b border-slate-300">
                    <th className="p-3 border-r border-slate-300 w-12 text-center bg-slate-200 sticky left-0 z-30" rowSpan={2}>Date</th>
                    <th colSpan={10} className="p-2 border-r border-slate-300 text-center bg-indigo-500/10 text-indigo-900">Supervisor: YOUSUF</th>
                    <th colSpan={10} className="p-2 text-center bg-amber-500/10 text-amber-900">Supervisor: HUMAYUN</th>
                  </tr>
                  <tr className="bg-slate-100 text-[8px]">
                    <th className="p-1 border-r border-slate-300 w-10">Total</th><th className="p-1 border-r border-slate-300 w-10">Color</th><th className="p-1 border-r border-slate-300 w-10">White</th><th className="p-1 border-r border-slate-300 w-10">N.Wash</th><th className="p-1 border-r border-slate-300 w-14 bg-rose-500/20">RE-MATCHING</th><th className="p-1 border-r border-slate-300 w-12 bg-rose-500/20">NOT OK</th><th className="p-1 border-r border-slate-300 w-10 bg-emerald-500/10 text-emerald-800">DAY COUNT</th><th className="p-1 border-r border-slate-300 w-12">Actual</th><th className="p-1 border-r border-slate-300 w-10">Eff%</th><th className="p-1 border-r border-slate-300 w-[88px]">Note</th>
                    <th className="p-1 border-r border-slate-300 w-10">Total</th><th className="p-1 border-r border-slate-300 w-10">Color</th><th className="p-1 border-r border-slate-300 w-10">White</th><th className="p-1 border-r border-slate-300 w-10">N.Wash</th><th className="p-1 border-r border-slate-300 w-14 bg-rose-500/20">RE-MATCHING</th><th className="p-1 border-r border-slate-300 w-12 bg-rose-500/20">NOT OK</th><th className="p-1 border-r border-slate-300 w-10 bg-emerald-500/10 text-emerald-800">DAY COUNT</th><th className="p-1 border-r border-slate-300 w-12">Actual</th><th className="p-1 border-r border-slate-300 w-10">Eff%</th><th className="p-1 w-[88px]">Note</th>
                  </tr>
               </thead>
               <tbody className="bg-white">
                  {reportData.rows.map((row, idx) => (
                    <tr key={idx} className={`border-b border-slate-200 hover:bg-app-accent/5 text-center transition-colors ${row.isFriday ? 'bg-rose-50/30' : ''}`}>
                      <td className={`p-2 border-r border-slate-300 font-bold sticky left-0 z-10 ${row.isFriday ? 'text-rose-700 bg-rose-50' : 'text-emerald-900 bg-emerald-50'}`}>
                        {row.day} {row.isFriday ? '(F)' : ''}
                      </td>
                      
                      <td className="p-2 border-r border-slate-200">{row.yousuf.totalProd.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-600">{row.yousuf.color.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-600">{row.yousuf.white.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-600">{row.yousuf.wash.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 bg-rose-500/5">{row.recordId && isEditing ? <input type="text" className="w-full bg-white border border-rose-300 rounded text-center text-[9px] font-black focus:ring-1 focus:ring-rose-400 outline-none p-0.5" defaultValue={row.yousuf.reMatchingFormula || ''} onBlur={e => handleManualUpdate(row.recordId!, 'yousuf', 'reMatching', e.target.value)} /> : <span className="font-bold text-rose-600">{row.yousuf.reMatching.toLocaleString()}</span>}</td>
                      <td className="p-2 border-r border-slate-200 bg-rose-500/5">{row.recordId && isEditing ? <input type="text" className="w-full bg-white border border-rose-300 rounded text-center text-[9px] font-black focus:ring-1 focus:ring-rose-400 outline-none p-0.5" defaultValue={row.yousuf.notOkFormula || ''} onBlur={e => handleManualUpdate(row.recordId!, 'yousuf', 'notOk', e.target.value)} /> : <span className="font-bold text-rose-600">{row.yousuf.notOk.toLocaleString()}</span>}</td>
                      <td className="p-2 border-r border-slate-200 bg-emerald-500/10">{row.recordId && isEditing ? <input type="text" className="w-full bg-white border border-emerald-300 rounded text-center text-[9px] font-black focus:ring-1 focus:ring-rose-400 outline-none p-0.5" defaultValue={row.yousuf.dayCountFormula || ''} onBlur={e => handleManualUpdate(row.recordId!, 'yousuf', 'dayCount', e.target.value)} /> : <span className="font-black text-emerald-700">{row.yousuf.dayCount}</span>}</td>
                      <td className="p-2 border-r border-slate-200 font-black text-indigo-900">{row.yousuf.actual.toLocaleString()}</td><td className="p-2 border-r border-slate-200 font-black text-indigo-700">{row.yousuf.eff.toFixed(2)}%</td>
                      <td className="p-2 border-r border-slate-200 text-[8px] italic">{row.recordId && isEditing ? <input type="text" className="w-full bg-white border border-amber-300 rounded text-[8px] font-medium focus:ring-1 focus:ring-amber-400 outline-none p-0.5" defaultValue={row.yousuf.note || ''} onBlur={e => handleManualUpdate(row.recordId!, 'yousuf', 'note', e.target.value)} /> : <span className="text-slate-500">{row.yousuf.note}</span>}</td>
                      
                      <td className="p-2 border-r border-slate-200">{row.humayun.totalProd.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-600">{row.humayun.color.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-600">{row.humayun.white.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-600">{row.humayun.wash.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 bg-rose-500/5">{row.recordId && isEditing ? <input type="text" className="w-full bg-white border border-rose-300 rounded text-center text-[9px] font-black focus:ring-1 focus:ring-rose-400 outline-none p-0.5" defaultValue={row.humayun.reMatchingFormula || ''} onBlur={e => handleManualUpdate(row.recordId!, 'humayun', 'reMatching', e.target.value)} /> : <span className="font-bold text-rose-600">{row.humayun.reMatching.toLocaleString()}</span>}</td>
                      <td className="p-2 border-r border-slate-200 bg-rose-500/5">{row.recordId && isEditing ? <input type="text" className="w-full bg-white border border-rose-300 rounded text-center text-[9px] font-black focus:ring-1 focus:ring-rose-400 outline-none p-0.5" defaultValue={row.humayun.notOkFormula || ''} onBlur={e => handleManualUpdate(row.recordId!, 'humayun', 'notOk', e.target.value)} /> : <span className="font-bold text-rose-600">{row.humayun.notOk.toLocaleString()}</span>}</td>
                      <td className="p-2 border-r border-slate-200 bg-emerald-500/10">{row.recordId && isEditing ? <input type="text" className="w-full bg-white border border-emerald-300 rounded text-center text-[9px] font-black focus:ring-1 focus:ring-rose-400 outline-none p-0.5" defaultValue={row.humayun.dayCountFormula || ''} onBlur={e => handleManualUpdate(row.recordId!, 'humayun', 'dayCount', e.target.value)} /> : <span className="font-black text-emerald-700">{row.humayun.dayCount}</span>}</td>
                      <td className="p-2 border-r border-slate-200 font-black text-amber-900">{row.humayun.actual.toLocaleString()}</td><td className="p-2 border-r border-slate-200 font-black text-amber-700">{row.humayun.eff.toFixed(2)}%</td>
                      <td className="p-2 text-[8px] italic">{row.recordId && isEditing ? <input type="text" className="w-full bg-white border border-amber-300 rounded text-[8px] font-medium focus:ring-1 focus:ring-amber-400 outline-none p-0.5" defaultValue={row.humayun.note || ''} onBlur={e => handleManualUpdate(row.recordId!, 'humayun', 'note', e.target.value)} /> : <span className="text-slate-500">{row.humayun.note}</span>}</td>
                    </tr>
                  ))}
               </tbody>
               <tfoot className="bg-[#cbd5e1] text-[#0f172a] font-black border-t-2 border-slate-400">
                  <tr className="bg-slate-300">
                    <td className="p-2 border-r border-slate-400 text-center uppercase tracking-widest text-[7px] sticky left-0 z-20 bg-slate-300">Monthly Totals</td>
                    <td className="p-2 border-r border-slate-300 text-center text-[7px]">{reportData.totals.yousuf.totalProd.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-[7px]">{reportData.totals.yousuf.color.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-[7px]">{reportData.totals.yousuf.white.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-[7px]">{reportData.totals.yousuf.wash.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-[7px]">{reportData.totals.yousuf.reMatching.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-rose-600 text-[7px]">{reportData.totals.yousuf.notOk.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center bg-emerald-500/20 text-emerald-950 text-[7px]">{reportData.totals.yousuf.dayCount.toFixed(1)}</td>
                    <td className="p-2 border-r border-slate-300 text-center text-indigo-900 text-[7px]">{reportData.totals.yousuf.actual.toLocaleString()}</td><td className="p-2 border-r border-slate-400 text-center text-indigo-700 text-[7px]">{reportData.avgMonthlyEffYousuf.toFixed(2)}%</td><td className="p-2 border-r border-slate-300"></td>
                    <td className="p-2 border-r border-slate-300 text-center text-[7px]">{reportData.totals.humayun.totalProd.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-[7px]">{reportData.totals.humayun.color.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-[7px]">{reportData.totals.humayun.white.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-[7px]">{reportData.totals.humayun.wash.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-[7px]">{reportData.totals.humayun.reMatching.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-rose-600 text-[7px]">{reportData.totals.humayun.notOk.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center bg-emerald-500/20 text-emerald-950 text-[7px]">{reportData.totals.humayun.dayCount.toFixed(1)}</td>
                    <td className="p-2 border-r border-slate-300 text-center text-amber-900 text-[7px]">{reportData.totals.humayun.actual.toLocaleString()}</td><td className="p-2 border-r border-slate-300 text-center text-amber-700 text-[7px]">{reportData.avgMonthlyEffHumayun.toFixed(2)}%</td><td className="p-2"></td>
                  </tr>
               </tfoot>
            </table>
         </div>
      </div>
      <PasskeyModal isOpen={passkeyContext.isOpen} onClose={() => setPasskeyContext(p => ({ ...p, isOpen: false }))} onSuccess={passkeyContext.action} actionLabel={passkeyContext.label} />
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

const VisualKPICard = ({ label, value, unit, subtitle, icon: Icon, color }: any) => {
  const colorMap: any = { indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100', emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100', rose: 'text-rose-600 bg-rose-50 border-rose-100', amber: 'text-amber-600 bg-amber-50 border-amber-100' };
  return (
    <div className="bg-app-card p-5 rounded-lg border border-app-border shadow-sm relative overflow-hidden group">
      <div className="absolute -right-4 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150"><Icon size={120} /></div>
      <div className="flex items-center gap-3 mb-4"><div className={`p-2 rounded-md border ${colorMap[color]}`}><Icon size={18} /></div><span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest opacity-70">{label}</span></div>
      <div className="mb-2 relative z-10"><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span><span className="text-[10px] font-black text-app-text-muted uppercase align-baseline">{unit}</span></div></div>
      <div className="w-full h-px bg-slate-100 mb-2 relative z-10"></div>
      <p className="text-[10px] font-black text-app-text-muted italic opacity-60 uppercase tracking-tight relative z-10">{subtitle}</p>
    </div>
  );
};

const UnifiedPortfolioAnalysis = ({ reportData }: { reportData: any }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState<{ yousuf: string, humayun: string } | null>(null);
  const portfolioContainerRef = useRef<HTMLDivElement>(null);

  const performAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setIsFlipped(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prepareNotes = (shift: 'yousuf' | 'humayun') => {
        return reportData.rows
          .map((r: any) => ({ date: r.day, note: r[shift].note }))
          .filter((n: any) => n.note && n.note.length > 2)
          .map((n: any) => `[${n.date}]: ${n.note}`)
          .join('\n');
      };

      const notesY = prepareNotes('yousuf');
      const notesH = prepareNotes('humayun');

      const analyze = async (name: string, notes: string) => {
        if (!notes) return "No operational bottlenecks or loss reasons were officially logged by this supervisor during this period.";
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Industry Analyst Role: Summarize the daily production registry notes for Supervisor ${name} in ${reportData.monthName}. 
          Categorize the primary bottlenecks (Technical, Material, Utility, or Process). 
          Be professional, direct, and identify patterns. 
          Registry Notes:\n${notes}`,
          config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        return response.text || "Analysis failed.";
      };

      const [resY, resH] = await Promise.all([analyze('YOUSUF', notesY), analyze('HUMAYUN', notesH)]);
      setSummary({ yousuf: resY, humayun: resH });
    } catch (err) {
      console.error(err);
      setSummary({ yousuf: "Cognitive node error during processing.", humayun: "Cognitive node error during processing." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
      
      {/* FRONT SIDE: SHIFT PORTFOLIO */}
      <div className="absolute inset-0 backface-hidden bg-app-card p-6 rounded-lg border border-app-border shadow-sm flex flex-col overflow-hidden">
        <DownloadButton targetRef={portfolioContainerRef} title="Shift_Portfolio_Aggregates" />
        <div className="flex items-center gap-2 mb-4 shrink-0"><PieChartIcon size={24} className="text-[#10b981]" /><h3 className="text-lg font-black text-[#1e293b] uppercase tracking-[0.2em] leading-none">SHIFT PORTFOLIO</h3></div>
        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-1">
           <SupervisorPortfolioRow 
              name="YOUSUF" 
              qty={reportData.totals.yousuf.actual} 
              batches={reportData.totals.yousuf.batchCount} 
              eff={reportData.avgMonthlyEffYousuf} 
              labelColor="#10b981" 
              stats={{ 
                color: reportData.totals.yousuf.color, 
                white: reportData.totals.yousuf.white, 
                wash: reportData.totals.yousuf.wash,
                reMatching: reportData.totals.yousuf.reMatching,
                notOk: reportData.totals.yousuf.notOk,
                dayCount: reportData.totals.yousuf.dayCount,
                fridayCount: reportData.totals.yousuf.fridayCount || 0,
                fridayHours: reportData.totals.yousuf.fridayHours || 0
              }} 
            />
           <div className="h-px w-full bg-slate-200"></div>
           <SupervisorPortfolioRow 
              name="HUMAYUN" 
              qty={reportData.totals.humayun.actual} 
              batches={reportData.totals.humayun.batchCount} 
              eff={reportData.avgMonthlyEffHumayun} 
              labelColor="#f59e0b" 
              stats={{ 
                color: reportData.totals.humayun.color, 
                white: reportData.totals.humayun.white, 
                wash: reportData.totals.humayun.wash,
                reMatching: reportData.totals.humayun.reMatching,
                notOk: reportData.totals.humayun.notOk,
                dayCount: reportData.totals.humayun.dayCount,
                fridayCount: reportData.totals.humayun.fridayCount || 0,
                fridayHours: reportData.totals.humayun.fridayHours || 0
              }} 
            />
        </div>
        
        <div className="mt-4 pt-3 border-t border-app-border shrink-0">
          <button 
            onClick={performAnalysis}
            className="w-full py-3 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow active:scale-95"
          >
             <BrainCircuit size={18} className="text-indigo-400" /> Analyze Insights
          </button>
        </div>
      </div>

      {/* BACK SIDE: ANALYSIS ENGINE */}
      <div className="absolute inset-0 backface-hidden bg-[#0f172a] rounded-lg border border-slate-800 shadow-xl p-6 flex flex-col rotate-y-180 text-white overflow-hidden">
         <div className="flex items-center justify-between mb-5 shrink-0">
            <div className="flex items-center gap-2">
               <ShieldCheck size={20} className="text-emerald-400" />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">ANALYSIS ENGINE</h3>
            </div>
            <button onClick={() => setIsFlipped(false)} className="p-2 hover:bg-white/10 rounded transition-colors flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
               <RotateCw size={14} /> Flip Back
            </button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
            {isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                 <Loader2 size={32} className="animate-spin text-app-accent" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 animate-pulse text-center">SYNTHESIZING REGISTRY CONTEXT...</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-l-2 border-indigo-500 pl-3">YOUSUF: BOTTLENECKS</p>
                   <p className="text-[11px] leading-relaxed text-slate-300 font-medium italic bg-white/5 p-4 rounded-lg border border-white/5">
                      {summary?.yousuf}
                   </p>
                </div>
                <div className="space-y-3">
                   <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] border-l-2 border-amber-500 pl-3">HUMAYUN: BOTTLENECKS</p>
                   <p className="text-[11px] leading-relaxed text-slate-300 font-medium italic bg-white/5 p-4 rounded-lg border border-white/5">
                      {summary?.humayun}
                   </p>
                </div>
              </>
            )}
         </div>

         <div className="mt-6 pt-4 border-t border-white/5 flex justify-center shrink-0">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
               LANTABUR INDUSTRIAL AI // CORE v3.4.2
            </p>
         </div>
      </div>
    </div>
  );
};

const SupervisorPortfolioRow = ({ name, qty, batches, eff, labelColor, stats }: { name: string, qty: number, batches: number, eff: number, labelColor: string, stats: any }) => {
  const data = [
    { name: 'Color', value: stats.color, fill: CHART_COLORS.color }, 
    { name: 'White', value: stats.white, fill: CHART_COLORS.white }, 
    { name: 'Wash', value: stats.wash, fill: CHART_COLORS.wash }
  ].filter(d => d.value > 0);

  return (
    <div className="relative flex flex-col gap-4 group">
      <div className="flex items-center gap-5">
        <div className="w-24 h-24 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={4} dataKey="value" stroke="none">{data.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie></PieChart></ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-[10px] font-black text-slate-400 uppercase leading-none">Eff</span><span className="text-sm font-black text-slate-800 leading-none">{eff.toFixed(0)}%</span></div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1.5"><User size={18} style={{ color: labelColor }} /><span className="text-lg font-black uppercase tracking-widest truncate leading-tight" style={{ color: labelColor }}>{name}</span></div>
          <div className="flex items-baseline gap-1.5"><span className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{(qty / 1000).toFixed(1)}k</span><span className="text-xs font-black text-slate-400 uppercase">kg</span></div>
          <div className="flex items-center gap-3 mt-2">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md border border-slate-100 shadow-sm"><Hash size={12} className="text-slate-400" /><span className="text-xs font-black text-slate-700">{batches}</span></div>
             <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md border border-slate-100 shadow-sm"><Zap size={12} className="text-amber-500" /><span className="text-xs font-black text-slate-700">{eff.toFixed(1)}%</span></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
         <PortfolioMetric label="COLOR" value={stats.color} color={CHART_COLORS.color} />
         <PortfolioMetric label="WHITE" value={stats.white} color={CHART_COLORS.white} />
         <PortfolioMetric label="N.WASH" value={stats.wash} color={CHART_COLORS.wash} />
         <PortfolioMetric label="RE-MATCH" value={stats.reMatching} color={CHART_COLORS.re} />
         <PortfolioMetric label="NOT OK" value={stats.notOk} color={CHART_COLORS.notOk} />
         <PortfolioMetric label="DAY CNT" value={stats.dayCount} color="#10b981" isFloat />
      </div>
    </div>
  );
};

const PortfolioMetric = ({ label, value, color, isFloat }: any) => (
  <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100 flex flex-col group/metric hover:bg-white hover:border-slate-200 transition-all shadow-sm">
    <p className="text-[9px] font-black text-slate-400 uppercase truncate leading-none mb-1.5 tracking-tighter" style={{ color: value > 0 ? color : '' }}>{label}</p>
    <p className="text-sm font-black text-slate-800 tracking-tight leading-none">
       {isFloat ? value.toFixed(1) : value.toLocaleString()}
    </p>
  </div>
);

const SupervisorFridayTable = ({ name, color, rows, shiftKey }: { name: string, color: 'indigo' | 'amber', rows: any[], shiftKey: 'yousuf' | 'humayun' }) => {
  const fridayData = rows.filter(r => r.isFriday && r[shiftKey].dayCount > 0);
  const isIndigo = color === 'indigo';
  
  return (
    <div className="bg-app-card rounded-lg border border-app-border shadow-sm overflow-hidden flex flex-col h-full">
      <div className={`px-4 py-1 border-b flex items-center justify-between shrink-0 ${isIndigo ? 'bg-indigo-500/10 border-indigo-100' : 'bg-amber-500/10 border-amber-100'}`}>
         <div className="flex items-center gap-2">
            <User size={13} className={isIndigo ? 'text-indigo-600' : 'text-amber-600'} />
            <h4 className={`text-[8px] font-black uppercase tracking-widest ${isIndigo ? 'text-indigo-900' : 'text-amber-900'}`}>{name} Friday Log</h4>
         </div>
      </div>
      <div className="overflow-y-auto custom-scrollbar flex-1 relative">
        <table className="w-full text-center text-[8.5px] border-collapse">
           <thead className="bg-app-bg text-app-text-muted font-black uppercase tracking-tighter border-b border-app-border sticky top-0 z-10 shadow-sm">
              <tr>
                 <th className="p-0.5 border-r border-app-border">Date</th>
                 <th className="p-0.5 border-r border-app-border">From</th>
                 <th className="p-0.5 border-r border-app-border">To</th>
                 <th className="p-0.5 border-r border-app-border">Hours</th>
                 <th className="p-0.5">Value</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-app-border">
              {fridayData.map((r, i) => {
                 const count = r[shiftKey].dayCount;
                 const hrs = count * 24;
                 let from = "--:--";
                 let to = "--:--";
                 if (count === 0.25) { from = "08:00 AM"; to = "02:00 PM"; }
                 else if (count === 0.75) { from = "02:00 PM"; to = "08:00 AM"; }
                 else if (count === 1) { from = "08:00 AM"; to = "08:00 AM"; }

                 return (
                    <tr key={i} className="hover:bg-app-bg/50 font-bold transition-colors">
                       <td className="p-0.5 border-r border-app-border text-slate-900 whitespace-nowrap">{r.day} (F)</td>
                       <td className="p-0.5 border-r border-app-border text-slate-500">{from}</td>
                       <td className="p-0.5 border-r border-app-border text-slate-500">{to}</td>
                       <td className={`p-0.5 border-r border-app-border font-black ${isIndigo ? 'text-indigo-600' : 'text-amber-600'}`}>{hrs.toFixed(1)}h</td>
                       <td className="p-0.5 text-emerald-600">{count.toFixed(2)}</td>
                    </tr>
                 );
              })}
              {fridayData.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-[9px] font-black text-slate-300 uppercase italic">No Friday logs</td></tr>
              )}
           </tbody>
        </table>
      </div>
      {fridayData.length > 0 && (
        <div className={`shrink-0 font-black uppercase text-[5px] border-t bg-white ${isIndigo ? 'text-indigo-900 border-indigo-200' : 'text-amber-900 border-amber-200'}`}>
          <table className="w-full text-center border-collapse">
            <tbody className={isIndigo ? 'bg-indigo-50' : 'bg-amber-50'}>
              <tr>
                <td className="py-0.5 border-r border-app-border/20 text-left pl-2 uppercase tracking-tighter" colSpan={3}>MONTHLY AGGREGATE</td>
                <td className="py-0.5 border-r border-app-border/20 w-[18%] text-center font-black tracking-tighter">{fridayData.reduce((s, r) => s + (r[shiftKey].dayCount * 24), 0).toFixed(1)}H</td>
                <td className="py-0.5 w-[15%] text-center font-black tracking-tighter">{(fridayData.reduce((s, r) => s + r[shiftKey].dayCount, 0) / fridayData.length).toFixed(2)} VAL</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};