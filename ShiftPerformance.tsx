
import React, { useMemo, useState } from 'react';
import { ProductionRecord } from './types';
import { ShiftPerformanceChart } from './components/Charts';
import { 
  Timer, Users, Zap, TrendingUp, ArrowUpRight, ArrowDownRight, 
  BarChart2, Clock, ShieldCheck, Activity, Target, Table as TableIcon,
  Download, Filter, Search, RefreshCw, FileText
} from 'lucide-react';
import { parseCustomDate } from './App';

interface ShiftPerformanceProps {
  records: ProductionRecord[];
}

const SHIFT_TARGET = 20000; // Target kg per shift

export const ShiftPerformance: React.FC<ShiftPerformanceProps> = ({ records }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const shiftStats = useMemo(() => {
    if (records.length === 0) return null;

    // Derived shift data with re-processing metrics
    const history = records.map(r => {
      // Simulate shift distribution and re-processing based on total
      const shiftA = r.totalProduction * 0.45;
      const shiftB = r.totalProduction * 0.35;
      const shiftC = r.totalProduction * 0.20;
      
      // Simulate re-processing (2% to 8% range)
      const reproA = shiftA * (0.02 + Math.random() * 0.02);
      const reproB = shiftB * (0.03 + Math.random() * 0.03);
      const reproC = shiftC * (0.05 + Math.random() * 0.05);

      return {
        id: r.id,
        date: r.date,
        total: r.totalProduction,
        shiftA: { output: shiftA, repro: reproA, eff: (shiftA / SHIFT_TARGET) * 100 },
        shiftB: { output: shiftB, repro: reproB, eff: (shiftB / SHIFT_TARGET) * 100 },
        shiftC: { output: shiftC, repro: reproC, eff: (shiftC / SHIFT_TARGET) * 100 },
      };
    });

    const filtered = history.filter(h => h.date.toLowerCase().includes(searchQuery.toLowerCase()))
                            .sort((a, b) => parseCustomDate(b.date).getTime() - parseCustomDate(a.date).getTime());

    const latest = filtered[0] || history[history.length - 1];
    
    // Aggregates for footer
    const totals = filtered.reduce((acc, h) => ({
      outA: acc.outA + h.shiftA.output,
      repA: acc.repA + h.shiftA.repro,
      outB: acc.outB + h.shiftB.output,
      repB: acc.repB + h.shiftB.repro,
      outC: acc.outC + h.shiftC.output,
      repC: acc.repC + h.shiftC.repro,
    }), { outA: 0, repA: 0, outB: 0, repB: 0, outC: 0, repC: 0 });

    return {
      history: history.slice(-30).map(h => ({
        date: h.date,
        shiftA: h.shiftA.output,
        shiftB: h.shiftB.output,
        shiftC: h.shiftC.output
      })),
      filtered,
      latest,
      totals
    };
  }, [records, searchQuery]);

  if (!shiftStats) return null;

  const { history, filtered, latest, totals } = shiftStats;

  const exportShiftData = () => {
    const headers = ['Date', 'Shift A Output', 'Shift A Repro', 'Shift B Output', 'Shift B Repro', 'Shift C Output', 'Shift C Repro', 'Daily Total'];
    const rows = filtered.map(h => [
      h.date, 
      h.shiftA.output.toFixed(0), h.shiftA.repro.toFixed(0),
      h.shiftB.output.toFixed(0), h.shiftB.repro.toFixed(0),
      h.shiftC.output.toFixed(0), h.shiftC.repro.toFixed(0),
      h.total.toFixed(0)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift_performance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-app-accent/10 text-app-accent text-[10px] font-black rounded-sm border border-app-accent/20 uppercase tracking-widest flex items-center gap-1">
              <Clock size={10} /> Shift Cycle Monitor
            </span>
          </div>
          <h1 className="text-3xl font-black text-app-text tracking-tight uppercase">Shift Performance Command</h1>
          <p className="text-app-text-muted font-medium text-sm">Real-time efficiency tracking across production teams</p>
        </div>
        <div className="flex gap-2">
           <button onClick={exportShiftData} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm">
             <Download size={14} /> Export CSV
           </button>
        </div>
      </header>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ShiftCard 
          label="Shift A (06:00 - 14:00)" 
          value={latest.shiftA.output} 
          efficiency={latest.shiftA.eff} 
          color="indigo" 
          operator="Rahman / Jabbar"
        />
        <ShiftCard 
          label="Shift B (14:00 - 22:00)" 
          value={latest.shiftB.output} 
          efficiency={latest.shiftB.eff} 
          color="emerald" 
          operator="Sumon / Karim"
        />
        <ShiftCard 
          label="Shift C (22:00 - 06:00)" 
          value={latest.shiftC.output} 
          efficiency={latest.shiftC.eff} 
          color="amber" 
          operator="Rafiq / Nizam"
        />
      </div>

      {/* Main Trend Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-app-card p-6 rounded-lg border border-app-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-app-text uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="text-app-accent" size={20} /> Productivity Trends
              </h3>
              <p className="text-xs text-app-text-muted font-medium">Historical output comparison across shift cycles</p>
            </div>
            <div className="flex gap-4">
              <LegendItem color="#6366f1" label="A" />
              <LegendItem color="#10b981" label="B" />
              <LegendItem color="#f59e0b" label="C" />
            </div>
          </div>
          <ShiftPerformanceChart data={history} />
        </div>

        <div className="lg:col-span-4 bg-app-card p-6 rounded-lg border border-app-border shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-app-text uppercase tracking-tight mb-6 flex items-center gap-2">
            <Target className="text-app-accent" size={20} /> Team Benchmarking
          </h3>
          <div className="space-y-6 flex-1">
             <TeamMetric label="Shift A (Morning)" score={92} output={latest.shiftA.output} />
             <TeamMetric label="Shift B (Evening)" score={78} output={latest.shiftB.output} />
             <TeamMetric label="Shift C (Night)" score={45} output={latest.shiftC.output} />
          </div>
        </div>
      </div>

      {/* Detailed Data Table Section */}
      <div className="bg-app-card rounded-lg border border-app-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-app-border bg-app-bg/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-black text-app-text flex items-center gap-2 uppercase text-xs tracking-widest">
            <TableIcon size={16} className="text-app-accent" /> Shift Analytics Registry
          </h3>
          <div className="relative w-full sm:w-64">
             <Search size={14} className="absolute left-3 top-2.5 text-app-text-muted" />
             <input 
               type="text" 
               placeholder="Search by date..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-app-bg border border-app-border rounded-md text-[10px] font-bold text-app-text focus:outline-none focus:ring-1 focus:ring-app-accent"
             />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-[10px] border-collapse min-w-[1000px] border border-app-border">
             <thead className="bg-app-bg text-app-text-muted uppercase font-black">
               <tr className="border-b border-app-border">
                 <th rowSpan={2} className="px-4 py-4 border-r border-app-border sticky left-0 bg-app-bg z-20">Date</th>
                 <th colSpan={3} className="px-4 py-2 border-r border-app-border border-b bg-indigo-500/5 text-indigo-600">Shift A (Morning)</th>
                 <th colSpan={3} className="px-4 py-2 border-r border-app-border border-b bg-emerald-500/5 text-emerald-600">Shift B (Evening)</th>
                 <th colSpan={3} className="px-4 py-2 border-r border-app-border border-b bg-amber-500/5 text-amber-600">Shift C (Night)</th>
                 <th rowSpan={2} className="px-4 py-4">Total Output</th>
               </tr>
               <tr className="border-b border-app-border">
                 <th className="px-3 py-2 border-r border-app-border">Output (kg)</th>
                 <th className="px-3 py-2 border-r border-app-border">Eff %</th>
                 <th className="px-3 py-2 border-r border-app-border">Repro (kg)</th>
                 <th className="px-3 py-2 border-r border-app-border">Output (kg)</th>
                 <th className="px-3 py-2 border-r border-app-border">Eff %</th>
                 <th className="px-3 py-2 border-r border-app-border">Repro (kg)</th>
                 <th className="px-3 py-2 border-r border-app-border">Output (kg)</th>
                 <th className="px-3 py-2 border-r border-app-border">Eff %</th>
                 <th className="px-3 py-2 border-r border-app-border">Repro (kg)</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-app-border">
               {filtered.map((h) => (
                 <tr key={h.id} className="table-row-hover group transition-colors">
                   <td className="px-4 py-3 font-black text-app-text border-r border-app-border sticky left-0 bg-app-card z-10 transition-colors whitespace-nowrap">{h.date}</td>
                   
                   {/* SHIFT A */}
                   <td className="px-3 py-3 border-r border-app-border font-bold text-app-text">{h.shiftA.output.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                   <td className={`px-3 py-3 border-r border-app-border font-black ${h.shiftA.eff > 85 ? 'text-emerald-500' : h.shiftA.eff > 65 ? 'text-amber-500' : 'text-rose-500'}`}>{h.shiftA.eff.toFixed(1)}%</td>
                   <td className="px-3 py-3 border-r border-app-border font-medium text-rose-500">{h.shiftA.repro.toLocaleString(undefined, {maximumFractionDigits:0})}</td>

                   {/* SHIFT B */}
                   <td className="px-3 py-3 border-r border-app-border font-bold text-app-text">{h.shiftB.output.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                   <td className={`px-3 py-3 border-r border-app-border font-black ${h.shiftB.eff > 85 ? 'text-emerald-500' : h.shiftB.eff > 65 ? 'text-amber-500' : 'text-rose-500'}`}>{h.shiftB.eff.toFixed(1)}%</td>
                   <td className="px-3 py-3 border-r border-app-border font-medium text-rose-500">{h.shiftB.repro.toLocaleString(undefined, {maximumFractionDigits:0})}</td>

                   {/* SHIFT C */}
                   <td className="px-3 py-3 border-r border-app-border font-bold text-app-text">{h.shiftC.output.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                   <td className={`px-3 py-3 border-r border-app-border font-black ${h.shiftC.eff > 85 ? 'text-emerald-500' : h.shiftC.eff > 65 ? 'text-amber-500' : 'text-rose-500'}`}>{h.shiftC.eff.toFixed(1)}%</td>
                   <td className="px-3 py-3 border-r border-app-border font-medium text-rose-500">{h.shiftC.repro.toLocaleString(undefined, {maximumFractionDigits:0})}</td>

                   <td className="px-4 py-3 font-black text-app-accent">{h.total.toLocaleString(undefined, {maximumFractionDigits:0})} kg</td>
                 </tr>
               ))}
               {filtered.length === 0 && (
                 <tr>
                   <td colSpan={11} className="py-12 text-app-text-muted italic text-center">No telemetry records found for current query.</td>
                 </tr>
               )}
             </tbody>
             <tfoot className="bg-app-bg/50 border-t-2 border-app-border font-black">
               <tr>
                 <td className="px-4 py-4 text-center text-app-accent uppercase tracking-widest sticky left-0 bg-app-bg border-r border-app-border">Aggregate</td>
                 <td className="px-3 py-4 border-r border-app-border">{totals.outA.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                 <td className="px-3 py-4 border-r border-app-border">Avg: {(totals.outA / Math.max(1, filtered.length * SHIFT_TARGET) * 100).toFixed(1)}%</td>
                 <td className="px-3 py-4 border-r border-app-border text-rose-500">{totals.repA.toLocaleString(undefined, {maximumFractionDigits:0})}</td>

                 <td className="px-3 py-4 border-r border-app-border">{totals.outB.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                 <td className="px-3 py-4 border-r border-app-border">Avg: {(totals.outB / Math.max(1, filtered.length * SHIFT_TARGET) * 100).toFixed(1)}%</td>
                 <td className="px-3 py-4 border-r border-app-border text-rose-500">{totals.repB.toLocaleString(undefined, {maximumFractionDigits:0})}</td>

                 <td className="px-3 py-4 border-r border-app-border">{totals.outC.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                 <td className="px-3 py-4 border-r border-app-border">Avg: {(totals.outC / Math.max(1, filtered.length * SHIFT_TARGET) * 100).toFixed(1)}%</td>
                 <td className="px-3 py-4 border-r border-app-border text-rose-500">{totals.repC.toLocaleString(undefined, {maximumFractionDigits:0})}</td>

                 <td className="px-4 py-4 text-app-accent">{(totals.outA + totals.outB + totals.outC).toLocaleString(undefined, {maximumFractionDigits:0})} kg</td>
               </tr>
             </tfoot>
          </table>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MiniMetric title="Avg Response Time" value="12.4m" icon={Timer} color="blue" />
        <MiniMetric title="Active Operators" value="48" icon={Users} color="violet" />
        <MiniMetric title="Power Consumption" value="2.4 kWh/kg" icon={Zap} color="amber" />
        <MiniMetric title="Safety Compliance" value="100%" icon={ShieldCheck} color="emerald" />
      </div>
    </div>
  );
};

const ShiftCard: React.FC<{ label: string; value: number; efficiency: number; color: string; operator: string }> = ({ label, value, efficiency, color, operator }) => {
  const colorClass = color === 'indigo' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' : 
                    color === 'emerald' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 
                    'text-amber-500 bg-amber-500/10 border-amber-500/20';
  
  const barColor = color === 'indigo' ? 'bg-indigo-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div className="bg-app-card p-6 rounded-lg border border-app-border shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full ${barColor}`}></div>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-md ${colorClass}`}>
          <Timer size={18} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{label}</p>
          <p className="text-[9px] font-bold text-app-text-muted">{operator}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-3xl font-black text-app-text tracking-tighter">{value.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-bold text-app-text-muted">kg</span></p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Efficiency:</span>
            <span className={`text-[10px] font-black ${efficiency > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{efficiency.toFixed(1)}%</span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-app-bg rounded-sm overflow-hidden border border-app-border p-0.5">
          <div className={`h-full ${barColor} rounded-sm transition-all duration-1000`} style={{ width: `${Math.min(100, efficiency)}%` }}></div>
        </div>
      </div>
    </div>
  );
};

const TeamMetric: React.FC<{ label: string; score: number; output: number }> = ({ label, score, output }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <span className="text-[11px] font-black text-app-text uppercase tracking-tight">{label}</span>
      <span className="text-[10px] font-bold text-app-text-muted">{(output/1000).toFixed(1)}k kg</span>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-app-bg rounded-full overflow-hidden border border-app-border p-0.5">
        <div className={`h-full rounded-full transition-all duration-1000 ${score > 80 ? 'bg-indigo-500' : score > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${score}%` }}></div>
      </div>
      <span className="text-xs font-black text-app-text w-8">{score}%</span>
    </div>
  </div>
);

const MiniMetric: React.FC<{ title: string; value: string; icon: any; color: string }> = ({ title, value, icon: Icon, color }) => {
  const colorMap: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    violet: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  };
  return (
    <div className="bg-app-card p-4 rounded-lg border border-app-border shadow-sm flex items-center gap-4">
      <div className={`p-2 rounded-md ${colorMap[color]}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest leading-none mb-1">{title}</p>
        <p className="text-sm font-black text-app-text">{value}</p>
      </div>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
    <span className="text-[10px] font-black uppercase text-app-text-muted">{label}</span>
  </div>
);
