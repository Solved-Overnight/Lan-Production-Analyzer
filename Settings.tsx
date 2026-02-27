import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ThemeType, AccentType, SupervisorSettings, ProductionRecord, RFTReportRecord, DyeingProgramRecord, ColorGroupData } from './types';
// Added Hash icon import to fix line 488
import { 
  Palette, Monitor, Check, Sun, Moon, Zap, Coffee, Ghost, 
  Users, Timer, Target, Download, FileSpreadsheet, FileText, 
  Save, ShieldCheck, Info, Loader2, Factory, Activity, ClipboardCheck,
  TrendingUp, Globe, AlertCircle, Percent, BarChart3, TrendingDown, Clock, CalendarDays, History,
  Database, PieChart as PieChartIcon, Sigma, MousePointer2, Settings as SettingsIcon,
  ToggleLeft, ToggleRight, DollarSign, LayoutDashboard, Database as DatabaseIcon, RefreshCw,
  Ruler, Gauge, BellRing, X, Layers, Droplets, Hash
} from 'lucide-react';
import { db, ref, set, onValue } from './services/firebaseService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { parseCustomDate } from './App';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  Cell, AreaChart, Area, LabelList, ResponsiveContainer, PieChart, Pie
} from 'recharts';
import { PasskeyModal } from './components/PasskeyModal';

interface SettingsProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  accent: AccentType;
  setAccent: (accent: AccentType) => void;
}

const THEMES: { id: ThemeType; label: string; icon: any; color: string }[] = [
  { id: 'light', label: 'Light', icon: Sun, color: '#f8fafc' },
  { id: 'dark', label: 'Dark', icon: Moon, color: '#0f172a' },
  { id: 'material', label: 'Material', icon: Zap, color: '#eceff1' },
  { id: 'tokio-night', label: 'Tokio Night', icon: Coffee, color: '#1a1b26' },
  { id: 'monokai', label: 'Monokai', icon: Zap, color: '#272822' },
  { id: 'dracula', label: 'Dracula', icon: Ghost, color: '#282a36' },
];

const ACCENTS: { id: AccentType; color: string }[] = [
  { id: 'indigo', color: '#6366f1' },
  { id: 'blue', color: '#3b82f6' },
  { id: 'emerald', color: '#10b981' },
  { id: 'rose', color: '#f43f5e' },
  { id: 'amber', color: '#f59e0b' },
  { id: 'violet', color: '#8b5cf6' },
  { id: 'cyan', color: '#06b6d4' },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const DEFAULT_SUPERVISORS: SupervisorSettings = {
  supervisorA: 'YOUSUF',
  supervisorB: 'HUMAYUN',
  totalShifts: 2,
  dailyTarget: 60000
};

export const Settings: React.FC<SettingsProps> = ({ theme, setTheme, accent, setAccent }) => {
  const [supSettings, setSupSettings] = useState<SupervisorSettings>(DEFAULT_SUPERVISORS);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().getMonth());
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [allData, setAllData] = useState<{ production: ProductionRecord[], rft: RFTReportRecord[] }>({ production: [], rft: [] });
  const reportRef = useRef<HTMLDivElement>(null);

  const [passkeyContext, setPasskeyContext] = useState<{ isOpen: boolean; action: () => void; label: string }>({
    isOpen: false, action: () => {}, label: ''
  });

  const requestAdmin = (label: string, action: () => void) => {
    setPasskeyContext({ isOpen: true, action, label });
  };

  useEffect(() => {
    onValue(ref(db, 'app_settings/supervisors'), (snapshot) => {
      const data = snapshot.val();
      if (data) setSupSettings(data);
    });
    onValue(ref(db, 'production_records'), s => {
      const data = s.val() ? (Object.values(s.val()) as ProductionRecord[]) : [];
      setAllData(prev => ({ ...prev, production: data }));
    });
    onValue(ref(db, 'rft_records'), s => {
      const data = s.val() ? (Object.values(s.val()) as RFTReportRecord[]) : [];
      setAllData(prev => ({ ...prev, rft: data }));
    });
  }, []);

  const reportData = useMemo(() => {
    if (allData.production.length === 0) return null;

    const filteredProduction = allData.production.filter(r => {
      const d = parseCustomDate(r.date);
      return d.getMonth() === exportMonth && d.getFullYear() === exportYear;
    }).sort((a,b) => parseCustomDate(a.date).getTime() - parseCustomDate(b.date).getTime());

    const yearProduction = allData.production.filter(r => parseCustomDate(r.date).getFullYear() === exportYear);
    const totalProductionAll = allData.production.reduce((sum, r) => sum + r.totalProduction, 0);
    const monthTotal = filteredProduction.reduce((sum, r) => sum + r.totalProduction, 0);
    const yearTotal = yearProduction.reduce((sum, r) => sum + r.totalProduction, 0);

    const getBrandStats = (brand: 'lantabur' | 'taqwa') => {
      const brandMonth = filteredProduction.reduce((sum, r) => sum + r[brand].total, 0);
      const brandYear = yearProduction.reduce((sum, r) => sum + r[brand].total, 0);
      const todayRecord = filteredProduction.length > 0 ? filteredProduction[filteredProduction.length - 1] : null;
      return {
        today: todayRecord ? todayRecord[brand].total : 0,
        month: brandMonth,
        avg: brandMonth / (filteredProduction.length || 1),
        year: brandYear,
        inhouse: filteredProduction.reduce((sum, r) => sum + r[brand].inhouse, 0),
        subcon: filteredProduction.reduce((sum, r) => sum + r[brand].subContract, 0)
      };
    };

    const getSegmentDistribution = (brand: 'lantabur' | 'taqwa') => {
      const groups: Record<string, number> = {};
      filteredProduction.forEach(r => {
        r[brand].colorGroups.forEach(cg => {
          const name = cg.groupName.toUpperCase();
          groups[name] = (groups[name] || 0) + cg.weight;
        });
      });
      return Object.entries(groups)
        .map(([name, weight]) => ({ name, weight }))
        .sort((a,b) => b.weight - a.weight);
    };

    const filteredRFT = allData.rft.filter(r => {
      const d = parseCustomDate(r.date);
      return d.getMonth() === exportMonth && d.getFullYear() === exportYear;
    }).sort((a,b) => parseCustomDate(a.date).getTime() - parseCustomDate(b.date).getTime());

    const getShiftTotals = (sup: 'yousuf' | 'humayun') => {
      const stats = { actual: 0, batches: 0, color: 0, white: 0, wash: 0, re: 0, notOk: 0 };
      filteredRFT.forEach(r => {
        const actual = (r.shiftPerformance?.[sup] || 0) - (r.manualNotOk?.[sup] || 0);
        stats.actual += actual;
        stats.batches += r.shiftCount?.[sup] || 0;
        stats.notOk += r.manualNotOk?.[sup] || 0;
        stats.re += r.manualReMatching?.[sup] || 0;
        
        r.entries.filter(e => e.shiftUnload?.toUpperCase().includes(sup.toUpperCase())).forEach(e => {
            const group = e.colorGroup?.toUpperCase() || '';
            if (group.includes('WHITE')) stats.white += e.fQty;
            else if (group.includes('WASH')) stats.wash += e.fQty;
            else stats.color += e.fQty;
        });
      });
      return stats;
    };

    const evaluateFormula = (input: string): number => {
      if (!input) return 0;
      if (input.startsWith('=')) {
        try {
          const cleanExpr = input.substring(1).replace(/[^-+/*0-9.]/g, '');
          return Number(new Function(`return ${cleanExpr}`)()) || 0;
        } catch (e) { return 0; }
      }
      return parseFloat(input) || 0;
    };

    const tableRows = filteredRFT.map(r => {
      const getEntryData = (sup: 'yousuf' | 'humayun') => {
        const supEntries = r.entries.filter(e => e.shiftUnload?.toUpperCase().includes(sup.toUpperCase()));
        const color = supEntries.filter(e => !e.colorGroup?.toUpperCase().includes('WHITE') && !e.colorGroup?.toUpperCase().includes('WASH')).reduce((s,e) => s+e.fQty,0);
        const white = supEntries.filter(e => e.colorGroup?.toUpperCase().includes('WHITE')).reduce((s,e) => s+e.fQty,0);
        const wash = supEntries.filter(e => e.colorGroup?.toUpperCase().includes('WASH')).reduce((s,e) => s+e.fQty,0);
        const notOk = r.manualNotOk?.[sup] || 0;
        const re = r.manualReMatching?.[sup] || 0;
        const total = supEntries.reduce((s,e) => s+e.fQty,0);
        const actual = total - notOk;
        const eff = (actual / 12250) * 100;
        return { total, color, white, wash, re, notOk, actual, eff, note: r.manualNote?.[sup] || '' };
      };
      return { date: r.date.split('-')[0], yousuf: getEntryData('yousuf'), humayun: getEntryData('humayun') };
    });

    return {
      monthName: MONTHS[exportMonth],
      exportYear,
      monthTotal,
      yearTotal,
      totalProductionAll,
      lantabur: getBrandStats('lantabur'),
      taqwa: getBrandStats('taqwa'),
      lantaburSegments: getSegmentDistribution('lantabur'),
      taqwaSegments: getSegmentDistribution('taqwa'),
      yousuf: getShiftTotals('yousuf'),
      humayun: getShiftTotals('humayun'),
      unitComparisonData: filteredProduction.slice(-15).map(r => ({
        date: r.date.split(' ')[0],
        lantabur: r.lantabur.total,
        taqwa: r.taqwa.total
      })),
      tableRows
    };
  }, [allData, exportMonth, exportYear]);

  const saveSupervisors = async () => {
    setIsSaving(true);
    try { await set(ref(db, 'app_settings/supervisors'), supSettings); } finally { setIsSaving(false); }
  };

  const exportProfessionalReport = async () => {
    if (!reportData) return;
    setIsExporting(true);
    setShowExportModal(false);
    try {
      if (!reportRef.current) return;
      
      const element = reportRef.current;
      element.style.display = 'block';
      const sections = element.querySelectorAll('.pdf-section');
      if (sections.length === 0) return;

      // Fix: Determine first page orientation from first section and initialize jsPDF correctly.
      const firstSection = sections[0] as HTMLElement;
      const firstIsLandscape = firstSection.classList.contains('landscape');
      const pdf = new jsPDF(firstIsLandscape ? 'l' : 'p', 'mm', 'a4');
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        const isLandscape = section.classList.contains('landscape');
        
        await new Promise(r => setTimeout(r, 800)); // Let Recharts render

        const canvas = await html2canvas(section, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#ffffff',
          logging: false 
        });
        
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage('a4', isLandscape ? 'l' : 'p');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = Math.min((pageWidth - 10) / imgProps.width, (pageHeight - 10) / imgProps.height);
        
        pdf.addImage(imgData, 'PNG', 5, 5, imgProps.width * ratio, imgProps.height * ratio);
      }

      pdf.save(`Audit_Report_${MONTHS[exportMonth]}_${exportYear}.pdf`);
      element.style.display = 'none';
    } catch (err) { console.error(err); } finally { setIsExporting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 pb-24">
      <header><h1 className="text-3xl font-bold text-app-text">Preferences</h1><p className="text-app-text-muted mt-1">Workspace appearance and operational nodes</p></header>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-app-accent mb-4"><Users size={20} /><h2 className="text-lg font-bold">Supervisor Management</h2></div>
        <div className="bg-app-card p-6 rounded-2xl border border-app-border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div><label className="text-[10px] font-black uppercase text-app-text-muted mb-1 block">Primary Supervisor</label><input className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-2 text-sm font-bold text-app-text outline-none focus:ring-1 focus:ring-app-accent" value={supSettings.supervisorA} onChange={e => setSupSettings({...supSettings, supervisorA: e.target.value.toUpperCase()})} /></div>
            <div><label className="text-[10px] font-black uppercase text-app-text-muted mb-1 block">Secondary Supervisor</label><input className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-2 text-sm font-bold text-app-text outline-none focus:ring-1 focus:ring-app-accent" value={supSettings.supervisorB} onChange={e => setSupSettings({...supSettings, supervisorB: e.target.value.toUpperCase()})} /></div>
          </div>
          <div className="space-y-4">
            <div><label className="text-[10px] font-black uppercase text-app-text-muted mb-1 block">Active Shifts</label><input type="number" className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-2 text-sm font-bold text-app-text outline-none focus:ring-1 focus:ring-app-accent" value={supSettings.totalShifts} onChange={e => setSupSettings({...supSettings, totalShifts: parseInt(e.target.value) || 0})} /></div>
            <div><label className="text-[10px] font-black uppercase text-app-text-muted mb-1 block">Global Target (KG)</label><input type="number" className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-2 text-sm font-bold text-app-text outline-none focus:ring-1 focus:ring-app-accent" value={supSettings.dailyTarget} onChange={e => setSupSettings({...supSettings, dailyTarget: parseInt(e.target.value) || 0})} /></div>
          </div>
          <div className="md:col-span-2 pt-2"><button onClick={saveSupervisors} className="w-full md:w-auto px-10 py-2.5 bg-app-accent text-white rounded-lg text-xs font-black uppercase hover:bg-app-accent-hover transition-all flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Update Supervisors</button></div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 mb-4"><FileText size={20} /><h2 className="text-lg font-bold text-app-text">Enterprise Reporting</h2></div>
        <div className="bg-app-card p-6 rounded-2xl border border-app-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl"><ShieldCheck size={28} /></div><div><p className="text-sm font-bold text-app-text">Professional Executive PDF</p><p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest">Multi-Page Dashboard Audit Cycle Export</p></div></div>
           <button onClick={() => setShowExportModal(true)} disabled={isExporting} className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase hover:bg-emerald-700 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} {isExporting ? 'Generating...' : 'Professional Report Export'}
           </button>
        </div>
      </section>

      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="bg-app-card rounded-xl shadow-2xl p-6 w-full max-w-sm border border-app-border animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6"><h3 className="font-black text-app-text uppercase tracking-tight">Select Report Period</h3><button onClick={() => setShowExportModal(false)} className="text-app-text-muted hover:text-rose-500 transition-colors"><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className="text-[10px] font-black uppercase text-app-text-muted mb-2 block">Month</label><div className="grid grid-cols-3 gap-2">{MONTHS.map((m, i) => <button key={m} onClick={() => setExportMonth(i)} className={`px-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${exportMonth === i ? 'bg-app-accent text-white' : 'bg-app-bg text-app-text-muted hover:bg-app-border'}`}>{m.substring(0, 3)}</button>)}</div></div>
              <div><label className="text-[10px] font-black uppercase text-app-text-muted mb-2 block">Year</label><div className="flex flex-wrap gap-2">{YEARS.map(y => <button key={y} onClick={() => setExportYear(y)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${exportYear === y ? 'bg-app-accent text-white' : 'bg-app-bg text-app-text-muted hover:bg-app-border'}`}>{y}</button>)}</div></div>
              <button onClick={exportProfessionalReport} className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase hover:bg-emerald-700 transition-all shadow-md active:scale-95">Generate Professional PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PDF TEMPLATE */}
      <div ref={reportRef} className="hidden absolute left-0 top-0 w-[210mm] bg-white z-[-100] font-sans">
        {reportData && (
          <>
            {/* Page 1: Dashboard Summary */}
            <div className="pdf-section p-10 space-y-8 bg-white min-h-[297mm]">
               <div className="flex justify-between items-center border-b-[6px] border-emerald-500 pb-4 mb-4">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Factory size={36} /></div>
                     <div><h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">LANTABUR GROUP</h1><p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Operational Intelligence Dashboard Summary</p></div>
                  </div>
                  <div className="text-right"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Export Node Cycle</p><p className="text-2xl font-black text-slate-900">{reportData.monthName} {reportData.exportYear}</p></div>
               </div>

               <div className="grid grid-cols-3 gap-8">
                  <KPIDisplay label="THIS MONTH" value={reportData.monthTotal} sub={`Total for ${reportData.monthName}`} icon={CalendarDays} color="#3b82f6" />
                  <KPIDisplay label="THIS YEAR" value={reportData.yearTotal} sub={`Cumulative ${reportData.exportYear}`} icon={Target} color="#6366f1" />
                  <KPIDisplay label="TOTAL PRODUCTION" value={reportData.totalProductionAll} sub="All-time system aggregate" icon={Globe} color="#f59e0b" />
               </div>

               <div className="space-y-4">
                  <BrandRow name="Lantabur Group" stats={reportData.lantabur} color="#6366f1" />
                  <BrandRow name="Taqwa Textiles" stats={reportData.taqwa} color="#f43f5e" />
               </div>

               <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner">
                  {/* Fix: Use BarChart3 icon to avoid shadowing the Recharts BarChart component */}
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500" /> UNIT COMPARISON HISTORY</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.unitComparisonData} margin={{top: 20, right: 10, left: 10, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} dy={10} />
                        <YAxis hide />
                        <Bar name="Lantabur" dataKey="lantabur" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                        <Bar name="Taqwa" dataKey="taqwa" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
                        <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '20px', fontSize: '10px', fontWeight: 900}} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>

            {/* Page 2: Distribution Intelligence */}
            <div className="pdf-section p-10 space-y-12 bg-white min-h-[297mm]">
               <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4"><Layers size={32} className="text-emerald-600" /> Industrial Segment Distribution Intelligence</h2>
               
               <div className="space-y-14">
                  <SegmentBox brand="Lantabur" stats={reportData.lantabur} segments={reportData.lantaburSegments} color="#6366f1" />
                  <div className="w-full h-px bg-slate-100"></div>
                  <SegmentBox brand="Taqwa" stats={reportData.taqwa} segments={reportData.taqwaSegments} color="#f43f5e" />
               </div>
            </div>

            {/* Page 3: Shift Intelligence */}
            <div className="pdf-section p-10 space-y-10 bg-white min-h-[297mm]">
               <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4"><Timer size={32} className="text-indigo-600" /> Shift Production Velocity Analytics</h2>
               
               <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500" /> PRODUCTION VELOCITY // {reportData.monthName.toUpperCase()} {reportData.exportYear}</h3>
                  <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.tableRows} margin={{top: 30, right: 30, left: 20, bottom: 20}}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                           <XAxis dataKey="date" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '30px', fontSize: '10px', fontWeight: 900}} />
                           <Bar name="Yousuf" dataKey="yousuf.actual" fill="#6366f1" radius={[4,4,0,0]} barSize={20} />
                           <Bar name="Humayun" dataKey="humayun.actual" fill="#f59e0b" radius={[4,4,0,0]} barSize={20} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight border-b-4 border-slate-100 pb-3 mt-10">Shift Portfolio Breakdown</h3>
               <div className="space-y-10">
                  <PortfolioRow name="YOUSUF" stats={reportData.yousuf} color="#6366f1" />
                  <PortfolioRow name="HUMAYUN" stats={reportData.humayun} color="#f59e0b" />
               </div>
            </div>

            {/* Page 4: Full Production Table */}
            <div className="pdf-section landscape p-10 bg-[#fef9c3] min-h-[210mm] w-[297mm]">
               <div className="flex justify-between items-center bg-[#fde68a] p-6 rounded-t-2xl border-b-2 border-amber-500/20">
                  <h2 className="text-3xl font-black text-amber-900 uppercase tracking-widest italic flex items-center gap-4"><Sigma size={32} /> Shift Wise Production Report {reportData.monthName} {reportData.exportYear}</h2>
                  <div className="text-right font-black text-amber-800 text-sm uppercase tracking-widest">Enterprise Audit Archive</div>
               </div>
               <div className="bg-white border-x border-b border-amber-500/10 shadow-xl overflow-hidden rounded-b-2xl">
                  <table className="w-full text-center text-[10px] border-collapse">
                     <thead className="bg-[#e2e8f0] font-black uppercase">
                        <tr className="border-b border-slate-300">
                           <th rowSpan={2} className="p-3 border-r border-slate-300 bg-slate-200">Date</th>
                           <th colSpan={8} className="p-2 border-r border-slate-300 bg-indigo-50 text-indigo-900">Supervisor: YOUSUF</th>
                           <th colSpan={8} className="p-2 bg-amber-50 text-amber-900">Supervisor: HUMAYUN</th>
                        </tr>
                        <tr className="bg-slate-100 text-[8px]">
                           <th className="p-1 border-r border-slate-300">Total</th><th className="p-1 border-r border-slate-300">Color</th><th className="p-1 border-r border-slate-300">White</th><th className="p-1 border-r border-slate-300">Wash</th><th className="p-1 border-r border-slate-300 text-rose-600">Not OK</th><th className="p-1 border-r border-slate-300">Actual</th><th className="p-1 border-r border-slate-300">Eff%</th><th className="p-1 border-r border-slate-300">Note</th>
                           <th className="p-1 border-r border-slate-300">Total</th><th className="p-1 border-r border-slate-300">Color</th><th className="p-1 border-r border-slate-300">White</th><th className="p-1 border-r border-slate-300">Wash</th><th className="p-1 border-r border-slate-300 text-rose-600">Not OK</th><th className="p-1 border-r border-slate-300">Actual</th><th className="p-1 border-r border-slate-300">Eff%</th><th className="p-1">Note</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200">
                        {reportData.tableRows.map((r, i) => (
                           <tr key={i} className="hover:bg-slate-50 font-bold transition-colors">
                              <td className="p-2 border-r border-slate-300 bg-slate-50 text-slate-900">{r.date}-{reportData.monthName.substring(0,3).toUpperCase()}</td>
                              <td className="p-2 border-r border-slate-200">{r.yousuf.total.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-500">{r.yousuf.color.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-500">{r.yousuf.white.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-500">{r.yousuf.wash.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-rose-600 font-black">{r.yousuf.notOk.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-indigo-700">{r.yousuf.actual.toLocaleString()}</td><td className="p-2 border-r border-slate-200">{r.yousuf.eff.toFixed(1)}%</td><td className="p-2 border-r border-slate-300 text-[7px] italic text-slate-400 truncate max-w-[60px]">{r.yousuf.note}</td>
                              <td className="p-2 border-r border-slate-200">{r.humayun.total.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-500">{r.humayun.color.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-500">{r.humayun.white.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-slate-500">{r.humayun.wash.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-rose-600 font-black">{r.humayun.notOk.toLocaleString()}</td><td className="p-2 border-r border-slate-200 text-amber-700">{r.humayun.actual.toLocaleString()}</td><td className="p-2 border-r border-slate-200">{r.humayun.eff.toFixed(1)}%</td><td className="p-2 text-[7px] italic text-slate-400 truncate max-w-[60px]">{r.humayun.note}</td>
                           </tr>
                        ))}
                     </tbody>
                     <tfoot className="bg-slate-900 text-white font-black uppercase text-[10px]">
                        <tr>
                           <td className="p-3 border-r border-white/10">MONTHLY TOTAL</td>
                           <td colSpan={4} className="border-r border-white/10 opacity-60">Aggregate Performance</td>
                           <td className="p-3 border-r border-white/10 text-indigo-400">{reportData.yousuf.actual.toLocaleString()}</td>
                           <td className="p-3 border-r border-white/10">{(reportData.yousuf.actual / (reportData.tableRows.length * 12250) * 100).toFixed(1)}%</td>
                           <td className="border-r border-white/10"></td>
                           <td colSpan={4} className="border-r border-white/10 opacity-60">Aggregate Performance</td>
                           <td className="p-3 border-r border-white/10 text-amber-400">{reportData.humayun.actual.toLocaleString()}</td>
                           <td className="p-3">{(reportData.humayun.actual / (reportData.tableRows.length * 12250) * 100).toFixed(1)}%</td>
                           <td></td>
                        </tr>
                     </tfoot>
                  </table>
               </div>
            </div>
          </>
        )}
      </div>

      <PasskeyModal isOpen={passkeyContext.isOpen} onClose={() => setPasskeyContext(p => ({...p, isOpen: false}))} onSuccess={passkeyContext.action} actionLabel={passkeyContext.label} />
    </div>
  );
};

const KPIDisplay = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 flex flex-col items-center text-center shadow-sm">
     <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-xl" style={{ backgroundColor: color }}><Icon size={32} className="text-white" /></div>
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">{label}</p>
     <p className="text-4xl font-black text-slate-900 tracking-tighter">{value.toLocaleString()} <span className="text-sm font-bold opacity-30 italic uppercase">KG</span></p>
     <div className="w-10 h-1 bg-slate-200 rounded-full my-4"></div>
     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
  </div>
);

const BrandRow = ({ name, stats, color }: any) => (
  <div className="bg-white rounded-3xl border border-slate-200 p-8 flex items-center justify-between shadow-sm hover:border-indigo-100 transition-colors">
     <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: color }}><Factory size={28} /></div>
        <div>
           <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{name}</h4>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Activity size={14} className="text-emerald-500" /><span className="text-[11px] font-black text-slate-400 uppercase">Today: {(stats.today/1000).toFixed(1)}k</span></div>
              <div className="flex items-center gap-2"><Percent size={14} className="text-indigo-500" /><span className="text-[11px] font-black text-slate-400 uppercase">Avg/Day: {(stats.avg/1000).toFixed(1)}k</span></div>
           </div>
        </div>
     </div>
     <div className="text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Monthly Aggregate</p>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">{(stats.month/1000).toFixed(1)}k <span className="text-xs font-bold text-slate-300">KG</span></p>
     </div>
  </div>
);

const SegmentBox = ({ brand, stats, segments, color }: any) => (
  <div className="space-y-8">
     <div className="grid grid-cols-3 gap-8">
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 text-center"><p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{brand.toUpperCase()} TOTAL</p><p className="text-3xl font-black text-slate-900">{stats.month.toLocaleString()} <span className="text-xs">KG</span></p></div>
        <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 text-center"><p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">INHOUSE VOLUME</p><p className="text-3xl font-black text-emerald-900">{stats.inhouse.toLocaleString()} <span className="text-xs">KG</span></p></div>
        <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 text-center"><p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-widest">SUBCONTRACT VOLUME</p><p className="text-3xl font-black text-amber-900">{stats.subcon.toLocaleString()} <span className="text-xs">KG</span></p></div>
     </div>
     <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500" /> INDUSTRIAL SEGMENT MIX // {brand.toUpperCase()}</h3>
        <div className="grid grid-cols-4 gap-4">
           {segments.filter((s:any) => s.weight > 0).map((s:any) => (
              <div key={s.name} className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-2 truncate tracking-tight">{s.name}</p>
                 <p className="text-xl font-black text-slate-900 tracking-tighter">{s.weight.toLocaleString()} <span className="text-[9px] font-bold opacity-30 italic">KG</span></p>
                 <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-black" style={{color}}>{((s.weight/Math.max(1, stats.month))*100).toFixed(1)}%</span>
                    <div className="w-16 h-1 bg-slate-50 rounded-full overflow-hidden"><div className="h-full" style={{backgroundColor: color, width: `${(s.weight/Math.max(1, stats.month))*100}%`}}></div></div>
                 </div>
              </div>
           ))}
        </div>
     </div>
  </div>
);

const PortfolioRow = ({ name, stats, color }: any) => (
  <div className="grid grid-cols-12 gap-8 items-center bg-slate-50/50 p-8 rounded-[40px] border border-slate-100">
     <div className="col-span-3 flex flex-col items-center border-r border-slate-200 pr-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-xl border-[4px] border-white" style={{ backgroundColor: color }}><Users size={40} className="text-white" /></div>
        <h4 className="text-2xl font-black text-slate-900">{name}</h4>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Shift Supervisor</p>
     </div>
     <div className="col-span-9 grid grid-cols-3 gap-8">
        <StatItem label="KG LOADED" value={`${(stats.actual/1000).toFixed(1)}k`} icon={Zap} color={color} />
        <StatItem label="BATCH COUNT" value={stats.batches} icon={Hash} color="#64748b" />
        <StatItem label="EFFICIENCY" value={`${((stats.actual / (stats.batches * 1000 || 1)) * 100).toFixed(1)}%`} icon={Target} color="#10b981" />
        <div className="col-span-3 grid grid-cols-5 gap-4 mt-2">
           <MetricMini label="COLOR" value={stats.color} color="#8b5cf6" />
           <MetricMini label="WHITE" value={stats.white} color="#64748b" />
           <MetricMini label="N.WASH" value={stats.wash} color="#06b6d4" />
           <MetricMini label="RE-MATCH" value={stats.re} color="#f43f5e" />
           <MetricMini label="NOT OK" value={stats.notOk} color="#e11d48" />
        </div>
     </div>
  </div>
);

const StatItem = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
     <div className="p-2 rounded-lg mb-3" style={{backgroundColor: color + '15', color}}><Icon size={20} /></div>
     <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{label}</p>
     <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
  </div>
);

const MetricMini = ({ label, value, color }: any) => (
  <div className="p-4 bg-white rounded-2xl border border-slate-100 flex flex-col items-center">
     <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-tighter">{label}</p>
     <p className="text-base font-black text-slate-900">{(value/1000).toFixed(1)}k</p>
     <div className="w-6 h-0.5 mt-2 rounded-full" style={{backgroundColor: color}}></div>
  </div>
);
