
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { RFTReportRecord, RFTBatchEntry } from './types';
import { 
  Timer, Activity, Scale, AlertCircle, Trophy, BarChart2, 
  Target, Calendar, Edit3, Save, X, Loader2, Database,
  PieChart as PieIcon, TrendingUp, Users, User, ShieldCheck, Info, BarChart,
  ArrowUpRight, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Hash, Zap
} from 'lucide-react';
import { parseCustomDate } from './App';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Bar, LabelList, Area, AreaChart,
  BarChart as ReBarChart
} from 'recharts';

interface ShiftPerformanceProps {
  records: RFTReportRecord[];
  onUpdateRecord?: (record: RFTReportRecord) => void;
}

const SHIFT_TARGET = 12250; 
const CHART_COLORS = {
  yousuf: '#6366f1',
  humayun: '#f59e0b',
  color: '#8b5cf6', 
  white: '#94a3b8', 
  wash: '#06b6d4',  
  re: '#f43f5e',
  notOk: '#f43f5e'
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

type GraphViewType = 'velocity' | 'notOk' | 'efficiency';

export const ShiftPerformance: React.FC<ShiftPerformanceProps> = ({ records, onUpdateRecord }) => {
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [graphView, setGraphView] = useState<GraphViewType>('velocity');
  
  const [localManualNotOk, setLocalManualNotOk] = useState<Record<string, { yousuf: number; humayun: number }>>({});
  const [localManualRe, setLocalManualRe] = useState<Record<string, { yousuf: number; humayun: number }>>({});

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
    const notOkData: Record<string, { yousuf: number; humayun: number }> = {};
    const reData: Record<string, { yousuf: number; humayun: number }> = {};
    records.forEach(r => {
      if (r.manualNotOk) {
        notOkData[r.id] = { 
          yousuf: Number(r.manualNotOk.yousuf) || 0, 
          humayun: Number(r.manualNotOk.humayun) || 0 
        };
      }
      if (r.manualReMatching) {
        reData[r.id] = { 
          yousuf: Number(r.manualReMatching.yousuf) || 0, 
          humayun: Number(r.manualReMatching.humayun) || 0 
        };
      }
    });
    setLocalManualNotOk(notOkData);
    setLocalManualRe(reData);
  }, [records]);

  const reportData = useMemo(() => {
    const filtered = records.filter(r => {
      const d = parseCustomDate(r.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });

    const days = new Date(filterYear, filterMonth + 1, 0).getDate();
    const rows = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const matchingRecords = filtered.filter(r => parseCustomDate(r.date).getDate() === day);
      const dailyEntries = matchingRecords.flatMap(r => r.entries || []);
      
      const yEntries = dailyEntries.filter(e => (e.shiftUnload || "").toUpperCase().includes('YOUSUF'));
      const hEntries = dailyEntries.filter(e => (e.shiftUnload || "").toUpperCase().includes('HUMAYUN'));

      const yStats = aggregateShiftData(yEntries);
      const hStats = aggregateShiftData(hEntries);

      const recordId = matchingRecords[0]?.id;
      const manualNotOk = (recordId && localManualNotOk[recordId]) || matchingRecords[0]?.manualNotOk || { yousuf: 0, humayun: 0 };
      const yousufNotOk = Number(manualNotOk.yousuf) || 0;
      const humayunNotOk = Number(manualNotOk.humayun) || 0;

      const manualRe = (recordId && localManualRe[recordId]) || matchingRecords[0]?.manualReMatching || { yousuf: 0, humayun: 0 };
      const yousufRe = Number(manualRe.yousuf) || yStats.reMatching;
      const humayunRe = Number(manualRe.humayun) || hStats.reMatching;

      return {
        day: `${day}-${MONTHS[filterMonth]}`,
        recordId: recordId || null,
        yousuf: { 
          ...yStats, 
          reMatching: yousufRe,
          notOk: yousufNotOk, 
          actual: yStats.totalProd - yousufNotOk, 
          eff: ((yStats.totalProd - yousufNotOk) / SHIFT_TARGET) * 100 
        },
        humayun: { 
          ...hStats, 
          reMatching: humayunRe,
          notOk: humayunNotOk, 
          actual: hStats.totalProd - humayunNotOk, 
          eff: ((hStats.totalProd - humayunNotOk) / SHIFT_TARGET) * 100 
        }
      };
    });

    const totals = rows.reduce((acc, row) => {
      Object.keys(acc.yousuf).forEach(k => {
        (acc.yousuf as any)[k] += (row.yousuf as any)[k];
        (acc.humayun as any)[k] += (row.humayun as any)[k];
      });
      return acc;
    }, {
      yousuf: { color: 0, white: 0, wash: 0, reMatching: 0, totalProd: 0, batchCount: 0, notOk: 0, actual: 0, eff: 0 },
      humayun: { color: 0, white: 0, wash: 0, reMatching: 0, totalProd: 0, batchCount: 0, notOk: 0, actual: 0, eff: 0 }
    });

    const workingDaysYousuf = rows.filter(r => r.yousuf.totalProd > 0).length;
    const workingDaysHumayun = rows.filter(r => r.humayun.totalProd > 0).length;

    const avgMonthlyEffYousuf = workingDaysYousuf > 0 ? (totals.yousuf.actual / (SHIFT_TARGET * workingDaysYousuf)) * 100 : 0;
    const avgMonthlyEffHumayun = workingDaysHumayun > 0 ? (totals.humayun.actual / (SHIFT_TARGET * workingDaysHumayun)) * 100 : 0;

    return { 
      rows, 
      totals, 
      recordCount: filtered.length, 
      avgMonthlyEffYousuf, 
      avgMonthlyEffHumayun, 
      daysInMonth: days,
      workingDaysYousuf,
      workingDaysHumayun
    };
  }, [records, filterMonth, filterYear, localManualNotOk, localManualRe]);

  const handleManualUpdate = (recordId: string, shift: 'yousuf' | 'humayun', field: 'notOk' | 'reMatching', value: string) => {
    let numericValue = 0;
    if (value.startsWith('=')) {
      try {
        const cleanExpr = value.substring(1).replace(/[^-+/*0-9.]/g, '');
        if (/[0-9]$/.test(cleanExpr)) {
          numericValue = Number(new Function(`return ${cleanExpr}`)()) || 0;
        } else {
          return;
        }
      } catch (e) {
        numericValue = 0;
      }
    } else {
      numericValue = value === '' ? 0 : parseFloat(value);
    }
    if (isNaN(numericValue)) return;
    if (field === 'notOk') {
      setLocalManualNotOk(prev => ({
        ...prev,
        [recordId]: { ...(prev[recordId] || { yousuf: 0, humayun: 0 }), [shift]: numericValue }
      }));
    } else {
      setLocalManualRe(prev => ({
        ...prev,
        [recordId]: { ...(prev[recordId] || { yousuf: 0, humayun: 0 }), [shift]: numericValue }
      }));
    }
  };

  const saveAllChanges = async () => {
    if (!onUpdateRecord) return;
    setIsSaving(true);
    try {
      const allRecordIds = Array.from(new Set([...Object.keys(localManualNotOk), ...Object.keys(localManualRe)]));
      const updatePromises = allRecordIds.map(id => {
        const record = records.find(r => r.id === id);
        if (record) {
          const updatedRecord: any = { 
            ...record, 
            manualNotOk: {
              yousuf: Number(localManualNotOk[id]?.yousuf) || 0,
              humayun: Number(localManualNotOk[id]?.humayun) || 0
            },
            manualReMatching: {
              yousuf: Number(localManualRe[id]?.yousuf) || 0,
              humayun: Number(localManualRe[id]?.humayun) || 0
            }
          };
          return onUpdateRecord(updatedRecord);
        }
        return Promise.resolve();
      });
      await Promise.all(updatePromises);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save quality data:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const dailyVelocityData = useMemo(() => reportData.rows.map(r => ({
    name: r.day,
    yousuf: r.yousuf.actual,
    humayun: r.humayun.actual,
    avgEff: parseFloat(((r.yousuf.eff + r.humayun.eff) / 2).toFixed(2))
  })), [reportData]);

  const monthlyQualityData = useMemo(() => [
    { name: 'YOUSUF', value: reportData.totals.yousuf.notOk, fill: CHART_COLORS.yousuf },
    { name: 'HUMAYUN', value: reportData.totals.humayun.notOk, fill: CHART_COLORS.humayun }
  ], [reportData]);

  const monthlyEfficiencyData = useMemo(() => [
    { name: 'YOUSUF', value: parseFloat(reportData.avgMonthlyEffYousuf.toFixed(2)), fill: CHART_COLORS.yousuf },
    { name: 'HUMAYUN', value: parseFloat(reportData.avgMonthlyEffHumayun.toFixed(2)), fill: CHART_COLORS.humayun }
  ], [reportData]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-500 rounded flex items-center justify-center text-white shadow-lg ring-4 ring-amber-500/10"><Timer size={22} /></div>
          <div>
            <h1 className="text-xl font-black text-app-text uppercase tracking-tight leading-none">Shift Performance Command</h1>
            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mt-1">Industrial Intelligence Summary</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           {!isEditing ? (
             <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-app-accent text-white rounded-md text-[10px] font-black uppercase hover:bg-app-accent-hover transition-all shadow-md active:scale-95">
               <Edit3 size={14} /> Edit Quality Data
             </button>
           ) : (
             <div className="flex items-center gap-2">
               <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex items-center gap-1.5 px-4 py-1.5 bg-app-card border border-app-border text-app-text-muted rounded-md text-[10px] font-black uppercase hover:text-rose-500 transition-all active:scale-95">
                 <X size={14} /> Cancel
               </button>
               <button onClick={saveAllChanges} disabled={isSaving} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50">
                 {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
               </button>
             </div>
           )}
           <div className="bg-app-card border border-app-border rounded-lg px-3 py-1.5 flex gap-4 shadow-sm items-center">
             <div className="flex items-center gap-1.5 border-r border-app-border pr-4">
                <Calendar size={12} className="text-app-accent" />
                <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-transparent text-[10px] font-black uppercase focus:outline-none cursor-pointer">
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
             </div>
             <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-transparent text-[10px] font-black uppercase focus:outline-none cursor-pointer">
               {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
             </select>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <VisualKPICard label="Cumulative Monthly Weight" value={`${((reportData.totals.yousuf.actual + reportData.totals.humayun.actual) / 1000).toFixed(1)}k`} unit="kg" subtitle="Total Verified Unload" icon={Scale} color="indigo" />
        <VisualKPICard label="Global Plant Efficiency" value={`${((reportData.avgMonthlyEffYousuf + reportData.avgMonthlyEffHumayun) / 2).toFixed(1)}%`} unit="" subtitle="Working Day Avg" icon={Activity} color="emerald" />
        <VisualKPICard label="Dyeing Quality Loss" value={`${((reportData.totals.yousuf.notOk + reportData.totals.humayun.notOk) / 1000).toFixed(1)}k`} unit="kg" subtitle="Total Shade RE / Not OK" icon={AlertCircle} color="rose" />
        <VisualKPICard label="Top Supervisor" value={reportData.totals.yousuf.actual > reportData.totals.humayun.actual ? "YOUSUF" : "HUMAYUN"} unit="" subtitle="Month High Throughput" icon={Trophy} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-app-card p-6 rounded-lg border border-app-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#1e293b] uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="text-[#10b981]" size={20} /> PRODUCTION VELOCITY
              </h3>
              <p className="text-[10px] text-app-text-muted font-black uppercase tracking-widest">DAILY ACTUAL KG UNLOADED</p>
            </div>
            <div className="flex bg-app-bg p-1 rounded-md border border-app-border">
               <button onClick={() => setGraphView('velocity')} className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all ${graphView === 'velocity' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Velocity</button>
               <button onClick={() => setGraphView('notOk')} className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all ${graphView === 'notOk' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Not Ok</button>
               <button onClick={() => setGraphView('efficiency')} className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all ${graphView === 'efficiency' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Efficiency %</button>
            </div>
          </div>
          
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {graphView === 'velocity' ? (
                <AreaChart data={dailyVelocityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorYousuf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.yousuf} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={CHART_COLORS.yousuf} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHumayun" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.humayun} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={CHART_COLORS.humayun} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} />
                  <XAxis dataKey="name" fontSize={9} fontWeight={800} axisLine={false} tickLine={false} hide />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                  <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 'bold'}} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase'}} />
                  <Area type="monotone" dataKey="yousuf" name="YOUSUF" stroke={CHART_COLORS.yousuf} strokeWidth={3} fillOpacity={1} fill="url(#colorYousuf)" animationDuration={1500} />
                  <Area type="monotone" dataKey="humayun" name="HUMAYUN" stroke={CHART_COLORS.humayun} strokeWidth={3} fillOpacity={1} fill="url(#colorHumayun)" animationDuration={1500} />
                </AreaChart>
              ) : graphView === 'notOk' ? (
                <ReBarChart data={monthlyQualityData} margin={{ top: 25, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} />
                  <XAxis dataKey="name" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `${v} kg`} />
                  <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 'bold'}} cursor={{fill: 'var(--app-accent)', opacity: 0.05}} />
                  <Bar dataKey="value" name="Monthly Not OK" radius={[10, 10, 0, 0]} barSize={80}>
                    {monthlyQualityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fontWeight: '900', fill: '#1e293b' }} formatter={(v: number) => `${v.toLocaleString()} kg`} />
                  </Bar>
                </ReBarChart>
              ) : (
                <ReBarChart data={monthlyEfficiencyData} margin={{ top: 25, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} />
                  <XAxis dataKey="name" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{backgroundColor: 'var(--app-card)', borderRadius: '8px', border: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 'bold'}} cursor={{fill: 'var(--app-accent)', opacity: 0.05}} />
                  <Bar dataKey="value" name="Monthly Avg Eff%" radius={[10, 10, 0, 0]} barSize={80}>
                    {monthlyEfficiencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fontWeight: '900', fill: '#1e293b' }} formatter={(v: number) => `${v}%`} />
                  </Bar>
                </ReBarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-app-card p-6 rounded-lg border border-app-border shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieChartIcon size={20} className="text-[#10b981]" />
            <h3 className="text-base font-black text-[#1e293b] uppercase tracking-widest">
              SHIFT PORTFOLIO
            </h3>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
             <SupervisorPortfolioRow 
               name="YOUSUF" 
               qty={reportData.totals.yousuf.actual} 
               batches={reportData.totals.yousuf.batchCount}
               eff={reportData.avgMonthlyEffYousuf}
               labelColor="#10b981" 
               stats={{ color: reportData.totals.yousuf.color, white: reportData.totals.yousuf.white, wash: reportData.totals.yousuf.wash }} 
             />
             
             <div className="h-px w-full bg-slate-100"></div>

             <SupervisorPortfolioRow 
               name="HUMAYUN" 
               qty={reportData.totals.humayun.actual} 
               batches={reportData.totals.humayun.batchCount}
               eff={reportData.avgMonthlyEffHumayun}
               labelColor="#f59e0b" 
               stats={{ color: reportData.totals.humayun.color, white: reportData.totals.humayun.white, wash: reportData.totals.humayun.wash }} 
             />
          </div>
        </div>
      </div>

      <div className="bg-[#fef9c3] border-[3px] border-[#a16207]/30 rounded-lg overflow-hidden shadow-xl mt-6">
         <div className="bg-[#fde68a] px-6 py-4 border-b-2 border-[#a16207]/20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Database size={40} /></div>
            <h2 className="text-xl font-black text-[#854d0e] uppercase italic tracking-widest flex items-center justify-center gap-3">
              <Target size={20} className="text-[#a16207]" /> Shift Wise Production Report {MONTHS[filterMonth]}-{filterYear}
            </h2>
         </div>
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-[9px] border-collapse min-w-[1500px]">
               <thead className="bg-[#e2e8f0] text-[#1e293b] font-black uppercase border-b-2 border-slate-300">
                  <tr className="border-b border-slate-300">
                    <th className="p-3 border-r border-slate-300 w-24 text-center bg-slate-200" rowSpan={2}>Date</th>
                    <th colSpan={8} className="p-2 border-r border-slate-300 text-center bg-indigo-500/10 text-indigo-900">Shift Supervisor: YOUSUF</th>
                    <th colSpan={8} className="p-2 text-center bg-amber-500/10 text-amber-900">Shift Supervisor: HUMAYUN</th>
                  </tr>
                  <tr className="bg-slate-100 text-[8px]">
                    <th className="p-1 border-r border-slate-300">Total</th>
                    <th className="p-1 border-r border-slate-300">Color</th>
                    <th className="p-1 border-r border-slate-300">White</th>
                    <th className="p-1 border-r border-slate-300">N.Wash</th>
                    <th className={`p-1 border-r border-slate-300 ${isEditing ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-500/20 text-rose-800'}`}>RE-MATCHING</th>
                    <th className={`p-1 border-r border-slate-300 ${isEditing ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-500/20 text-rose-800'}`}>NOT OK</th>
                    <th className="p-1 border-r border-slate-300">Actual</th>
                    <th className="p-1 border-r border-slate-300">Eff%</th>
                    <th className="p-1 border-r border-slate-300">Total</th>
                    <th className="p-1 border-r border-slate-300">Color</th>
                    <th className="p-1 border-r border-slate-300">White</th>
                    <th className="p-1 border-r border-slate-300">N.Wash</th>
                    <th className={`p-1 border-r border-slate-300 ${isEditing ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-500/20 text-rose-800'}`}>RE-MATCHING</th>
                    <th className={`p-1 border-r border-slate-300 ${isEditing ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-500/20 text-rose-800'}`}>NOT OK</th>
                    <th className="p-1 border-r border-slate-300">Actual</th>
                    <th className="p-1">Eff%</th>
                  </tr>
               </thead>
               <tbody className="bg-white">
                  {reportData.rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-app-accent/5 text-center transition-colors">
                      <td className="p-2 border-r border-slate-300 font-bold text-emerald-900 bg-emerald-50/50">{row.day}</td>
                      <td className="p-2 border-r border-slate-200">{row.yousuf.totalProd.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{row.yousuf.color.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{row.yousuf.white.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{row.yousuf.wash.toLocaleString()}</td>
                      <td className={`p-2 border-r border-slate-200 ${isEditing ? 'bg-rose-500/10' : 'bg-rose-500/5'}`}>
                        {row.recordId && isEditing ? <input type="text" className="w-16 bg-white border border-rose-300 rounded text-center text-[9px] font-black focus:ring-1 focus:ring-rose-400 outline-none p-0.5" defaultValue={row.yousuf.reMatching || ''} onBlur={e => handleManualUpdate(row.recordId!, 'yousuf', 'reMatching', e.target.value)} /> : <span className="font-bold text-rose-600">{row.yousuf.reMatching.toLocaleString()}</span>}
                      </td>
                      <td className={`p-2 border-r border-slate-200 ${isEditing ? 'bg-rose-500/10' : 'bg-rose-500/5'}`}>
                        {row.recordId && isEditing ? <input type="text" className="w-16 bg-white border border-rose-300 rounded text-center text-[9px] font-black focus:ring-1 focus:ring-rose-400 outline-none p-0.5" defaultValue={row.yousuf.notOk || ''} onBlur={e => handleManualUpdate(row.recordId!, 'yousuf', 'notOk', e.target.value)} /> : <span className="font-bold text-rose-600">{row.yousuf.notOk.toLocaleString()}</span>}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-black text-indigo-900">{row.yousuf.actual.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-300 font-black text-indigo-700">{row.yousuf.eff.toFixed(2)}%</td>
                      <td className="p-2 border-r border-slate-200">{row.humayun.totalProd.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{row.humayun.color.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{row.humayun.white.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{row.humayun.wash.toLocaleString()}</td>
                      <td className={`p-2 border-r border-slate-200 ${isEditing ? 'bg-rose-500/10' : 'bg-rose-500/5'}`}>
                        {row.recordId && isEditing ? <input type="text" className="w-16 bg-white border border-rose-300 rounded text-center text-[9px] font-black focus:ring-1 focus:ring-rose-400 outline-none p-0.5" defaultValue={row.humayun.reMatching || ''} onBlur={e => handleManualUpdate(row.recordId!, 'humayun', 'reMatching', e.target.value)} /> : <span className="font-bold text-rose-600">{row.humayun.reMatching.toLocaleString()}</span>}
                      </td>
                      <td className={`p-2 border-r border-slate-200 ${isEditing ? 'bg-rose-500/10' : 'bg-rose-500/5'}`}>
                        {row.recordId && isEditing ? <input type="text" className="w-16 bg-white border border-rose-300 rounded text-center text-[9px] font-black focus:ring-1 focus:ring-rose-400 outline-none p-0.5" defaultValue={row.humayun.notOk || ''} onBlur={e => handleManualUpdate(row.recordId!, 'humayun', 'notOk', e.target.value)} /> : <span className="font-bold text-rose-600">{row.humayun.notOk.toLocaleString()}</span>}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-black text-amber-900">{row.humayun.actual.toLocaleString()}</td>
                      <td className="p-2 font-black text-amber-700">{row.humayun.eff.toFixed(2)}%</td>
                    </tr>
                  ))}
               </tbody>
               <tfoot className="bg-[#cbd5e1] text-[#0f172a] font-black border-t-2 border-slate-400">
                  <tr className="bg-slate-300">
                    <td className="p-2 border-r border-slate-400 text-center uppercase tracking-widest text-[8px]">Monthly Totals</td>
                    <td className="p-2 border-r border-slate-300 text-center">{reportData.totals.yousuf.totalProd.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center">{reportData.totals.yousuf.color.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center">{reportData.totals.yousuf.white.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center">{reportData.totals.yousuf.wash.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center">{reportData.totals.yousuf.reMatching.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center text-rose-600">{reportData.totals.yousuf.notOk.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center text-indigo-900">{reportData.totals.yousuf.actual.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-400 text-center text-indigo-700">{reportData.avgMonthlyEffYousuf.toFixed(2)}%</td>
                    <td className="p-2 border-r border-slate-300 text-center">{reportData.totals.humayun.totalProd.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center">{reportData.totals.humayun.color.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center">{reportData.totals.humayun.white.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center">{reportData.totals.humayun.wash.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center">{reportData.totals.humayun.reMatching.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center text-rose-600">{reportData.totals.humayun.notOk.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-300 text-center text-amber-900">{reportData.totals.humayun.actual.toLocaleString()}</td>
                    <td className="p-2 text-center text-amber-700">{reportData.avgMonthlyEffHumayun.toFixed(2)}%</td>
                  </tr>
               </tfoot>
            </table>
         </div>
      </div>
    </div>
  );
};

const VisualKPICard = ({ label, value, unit, subtitle, icon: Icon, color }: any) => {
  const colorMap: any = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
  };
  
  return (
    <div className="bg-app-card p-6 rounded-lg border border-app-border shadow-sm relative overflow-hidden group">
      <div className="absolute -right-4 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150">
        <Icon size={120} />
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-md border ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest opacity-70">
          {label}
        </span>
      </div>
      <div className="mb-4 relative z-10">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-800 tracking-tight">{value}</span>
          <span className="text-[10px] font-black text-app-text-muted uppercase align-baseline">
            {unit}
          </span>
        </div>
      </div>
      <div className="w-full h-px bg-slate-100 mb-3 relative z-10"></div>
      <p className="text-[10px] font-black text-app-text-muted italic opacity-60 uppercase tracking-tight relative z-10">
        {subtitle}
      </p>
    </div>
  );
};

const SupervisorPortfolioRow = ({ name, qty, batches, eff, labelColor, stats }: { name: string, qty: number, batches: number, eff: number, labelColor: string, stats: any }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const data = [
    { name: 'Color', value: stats.color, fill: CHART_COLORS.color },
    { name: 'White', value: stats.white, fill: CHART_COLORS.white },
    { name: 'Wash', value: stats.wash, fill: CHART_COLORS.wash },
  ].filter(d => d.value > 0);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex flex-col group/row">
      <div className="flex items-center gap-6">
        <div className="w-28 h-28 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={45}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-[10px] font-black text-slate-400 uppercase">Eff</span>
            <span className="text-sm font-black text-slate-800 leading-none">{eff.toFixed(0)}%</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <User size={14} style={{ color: labelColor }} />
             <span className="text-xs font-black uppercase tracking-widest truncate leading-tight" style={{ color: labelColor }}>
               {name}
             </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-slate-800 tracking-tight leading-none">{(qty / 1000).toFixed(1)}k</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">kg total</span>
          </div>
          
          <div className="flex items-center gap-4 mt-3">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded border border-slate-100">
                <Hash size={12} className="text-slate-400" />
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">Batches</span>
                   <span className="text-[10px] font-black text-slate-700 leading-none">{batches}</span>
                </div>
             </div>
             <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded border border-slate-100">
                <Zap size={12} className="text-amber-500" />
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">Efficiency</span>
                   <span className="text-[10px] font-black text-slate-700 leading-none">{eff.toFixed(1)}%</span>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      <div className="relative group/scroll flex items-center mt-4 mb-1">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 p-1.5 bg-white border border-slate-200 rounded-full shadow-md hover:scale-110 transition-all opacity-0 group-hover/scroll:opacity-100 -ml-3"
        >
          <ChevronLeft size={16} className="text-slate-600" />
        </button>

        <div 
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto scroll-smooth whitespace-nowrap px-1 py-1 no-scrollbar w-full"
        >
           <PortfolioTag label="Color" value={stats.color} total={qty} />
           <PortfolioTag label="White" value={stats.white} total={qty} />
           <PortfolioTag label="Wash" value={stats.wash} total={qty} />
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 p-1.5 bg-white border border-slate-200 rounded-full shadow-md hover:scale-110 transition-all opacity-0 group-hover/scroll:opacity-100 -mr-3"
        >
          <ChevronRight size={16} className="text-slate-600" />
        </button>
      </div>
    </div>
  );
};

const PortfolioTag = ({ label, value, total }: { label: string, value: number, total: number }) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
  
  return (
    <div className="px-4 py-2 rounded-lg border border-slate-100 flex flex-col gap-1 transition-all hover:border-slate-300 cursor-default bg-white shadow-sm shrink-0 min-w-[100px]">
      <div className="flex items-center justify-between">
         <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{label}</span>
         <span className="text-[8px] font-black text-slate-300">{percentage}%</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-black text-slate-800 tabular-nums">
          {(value/1000).toFixed(1)}k
        </span>
        <span className="text-[8px] text-slate-400 font-bold uppercase">kg</span>
      </div>
      <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
         <div className="h-full bg-app-accent opacity-30" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};
