
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ProductionRecord } from './types';
import { 
  ProductionTrendChart, 
  RadarPerformanceChart, MultiIndustryBarChart, IndustryColorComparisonChart,
  DownloadButton
} from './components/Charts';
import { 
  TrendingUp, Package, Calendar, Activity, ArrowUpRight, ArrowDownRight, 
  Factory, ShieldCheck, BarChart3, Target, Globe, Clock, CalendarDays, History, 
  Droplets, Leaf, Gauge, PieChart as PieChartIcon, AlertCircle, Percent, ChevronDown
} from 'lucide-react';
import { parseCustomDate } from './App';

interface DashboardProps {
  records: ProductionRecord[];
  onLoadFullHistory?: () => void;
  isHistoryLoaded?: boolean;
}

type TimeFrame = 'today' | 'month' | 'year' | 'total';

const RATES = {
  lantabur: 1.25,
  taqwa: 1.18,
  waterPerKg: 45, // Litres per KG
  co2PerKg: 2.3   // KG of CO2 per KG
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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

export const Dashboard: React.FC<DashboardProps> = ({ records, onLoadFullHistory, isHistoryLoaded }) => {
  const [viewMode, setViewMode] = useState<'weight' | 'revenue'>('weight');
  const [portfolioTimeframe, setPortfolioTimeframe] = useState<TimeFrame>('month');
  
  // Period Selection State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Refs for chart capturing
  const unitCompRef = useRef<HTMLDivElement>(null);
  const goalRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef<HTMLDivElement>(null);

  // Trigger lazy load if selected date is likely not in current records
  useEffect(() => {
    const today = new Date();
    if (selectedMonth !== today.getMonth() || selectedYear !== today.getFullYear()) {
      if (!isHistoryLoaded && onLoadFullHistory) {
        onLoadFullHistory();
      }
    }
  }, [selectedMonth, selectedYear, isHistoryLoaded, onLoadFullHistory]);

  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;

    const sorted = [...records].sort((a, b) => parseCustomDate(b.date).getTime() - parseCustomDate(a.date).getTime());
    
    const monthRecords = records.filter(r => {
      const d = parseCustomDate(r.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const latest = monthRecords.length > 0 ? [...monthRecords].sort((a, b) => parseCustomDate(b.date).getTime() - parseCustomDate(a.date).getTime())[0] : sorted[0];
    
    const refDate = parseCustomDate(latest.date);
    const refMonth = selectedMonth;
    const refYear = selectedYear;
    
    const startOfWeek = new Date(refDate);
    startOfWeek.setDate(refDate.getDate() - refDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const brandStats = {
      lantabur: { today: latest.lantabur.total, week: 0, month: 0, year: 0, avgDay: 0, monthCount: 0 },
      taqwa: { today: latest.taqwa.total, week: 0, month: 0, year: 0, avgDay: 0, monthCount: 0 }
    };

    const colorAggregator: Record<string, { lantabur: number, taqwa: number }> = {};
    let timeframeLantaburTotal = 0;
    let timeframeTaqwaTotal = 0;

    let totalWeight = 0;
    let monthWeight = 0;
    let yearWeight = 0;
    let totalWater = 0;
    let totalCO2 = 0;

    records.forEach(r => {
      const d = parseCustomDate(r.date);
      const isSameMonth = d.getMonth() === refMonth && d.getFullYear() === refYear;
      const isSameYear = d.getFullYear() === refYear;
      const isToday = d.getTime() === refDate.getTime();
      const isWithinWeek = d >= startOfWeek && d <= refDate;

      const weight = Number(r.totalProduction) || 0;
      totalWeight += weight;
      totalWater += weight * RATES.waterPerKg;
      totalCO2 += weight * RATES.co2PerKg;

      if (isWithinWeek) {
        brandStats.lantabur.week += (Number(r.lantabur.total) || 0);
        brandStats.taqwa.week += (Number(r.taqwa.total) || 0);
      }
      if (isSameMonth) {
        brandStats.lantabur.month += (Number(r.lantabur.total) || 0);
        brandStats.taqwa.month += (Number(r.taqwa.total) || 0);
        brandStats.lantabur.monthCount++;
        brandStats.taqwa.monthCount++;
        monthWeight += weight;
      }
      if (isSameYear) {
        brandStats.lantabur.year += (Number(r.lantabur.total) || 0);
        brandStats.taqwa.year += (Number(r.taqwa.total) || 0);
        yearWeight += weight;
      }

      let includeInPortfolio = false;
      if (portfolioTimeframe === 'today' && isToday) includeInPortfolio = true;
      else if (portfolioTimeframe === 'month' && isSameMonth) includeInPortfolio = true;
      else if (portfolioTimeframe === 'year' && isSameYear) includeInPortfolio = true;
      else if (portfolioTimeframe === 'total') includeInPortfolio = true;

      if (includeInPortfolio) {
        timeframeLantaburTotal += (Number(r.lantabur.total) || 0);
        timeframeTaqwaTotal += (Number(r.taqwa.total) || 0);

        const processGroup = (cg: any, targetIndustry: 'lantabur' | 'taqwa') => {
          let groupName = (cg.groupName || 'Misc').trim().toUpperCase();
          if (groupName.includes('DOUBLE PART')) {
            groupName = 'DOUBLE PART';
          }
          if (!colorAggregator[groupName]) {
            colorAggregator[groupName] = { lantabur: 0, taqwa: 0 };
          }
          colorAggregator[groupName][targetIndustry] += Number(cg.weight) || 0;
        };
        r.lantabur.colorGroups.forEach(cg => processGroup(cg, 'lantabur'));
        r.taqwa.colorGroups.forEach(cg => processGroup(cg, 'taqwa'));
      }
    });

    const portfolioData = Object.entries(colorAggregator)
      .map(([group, weights]) => ({
        group,
        ...weights,
        total: weights.lantabur + weights.taqwa
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);

    brandStats.lantabur.avgDay = brandStats.lantabur.monthCount > 0 ? brandStats.lantabur.month / brandStats.lantabur.monthCount : 0;
    brandStats.taqwa.avgDay = brandStats.taqwa.monthCount > 0 ? brandStats.taqwa.month / brandStats.taqwa.monthCount : 0;

    const latestRevenue = (latest.lantabur.total * RATES.lantabur) + (latest.taqwa.total * RATES.taqwa);
    const prev = sorted.find(s => parseCustomDate(s.date).getTime() < parseCustomDate(latest.date).getTime());
    const prevRev = prev ? (prev.lantabur.total * RATES.lantabur) + (prev.taqwa.total * RATES.taqwa) : 0;
    const growthWeight = prev ? ((latest.totalProduction - prev.totalProduction) / Math.max(1, prev.totalProduction)) * 100 : 0;
    const growthRev = prev ? ((latestRevenue - prevRev) / Math.max(1, prevRev)) * 100 : 0;
    const monthName = MONTHS[refMonth];

    let chartLabel = '';
    switch(portfolioTimeframe) {
      case 'today': chartLabel = `${formatRFTDate(latest.date)} Production Comparison`; break;
      case 'month': chartLabel = `${monthName.toUpperCase()} ${refYear} Production Comparison`; break;
      case 'year': chartLabel = `Year ${refYear} Production Comparison`; break;
      case 'total': chartLabel = `Total Production Comparison`; break;
    }

    return { 
      latest, latestRevenue, totalWeight, monthWeight, yearWeight, 
      growthWeight, growthRev, brandStats, totalWater, totalCO2, 
      monthName, refYear, portfolioData, chartLabel,
      timeframeLantaburTotal, timeframeTaqwaTotal
    };
  }, [records, portfolioTimeframe, selectedMonth, selectedYear]);

  if (!stats) return <div className="p-12 text-center text-app-text-muted font-bold uppercase tracking-[0.2em] opacity-30">No intelligence synced.</div>;

  const { latest, latestRevenue, totalWeight, monthWeight, yearWeight, growthWeight, growthRev, brandStats, totalWater, totalCO2, monthName, refYear, portfolioData, chartLabel, timeframeLantaburTotal, timeframeTaqwaTotal } = stats;

  const DAILY_TARGET = 60000;
  const progressPercent = Math.min(100, (latest.totalProduction / DAILY_TARGET) * 100);
  const shortfall = Math.max(0, DAILY_TARGET - latest.totalProduction);
  const lantaburShare = (latest.lantabur.total / latest.totalProduction) * 100;
  const taqwaShare = (latest.taqwa.total / latest.totalProduction) * 100;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-sm border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={10} /> Live Command V3.4
            </span>
          </div>
          <h1 className="text-3xl font-black text-app-text tracking-tight uppercase">Operational Command</h1>
          <p className="text-app-text-muted font-medium text-sm">Industrial intelligence summary for Lantabur & Taqwa</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex bg-app-card border border-app-border rounded-lg p-1 shadow-sm items-center">
            <div className="px-2 text-app-accent">
              <Calendar size={14} />
            </div>
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(Number(e.target.value))} 
              className="bg-transparent text-[10px] font-black uppercase focus:outline-none cursor-pointer border-r border-app-border px-4 py-1.5"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))} 
              className="bg-transparent text-[10px] font-black uppercase focus:outline-none cursor-pointer px-4 py-1.5"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex bg-app-card p-1 rounded-lg border border-app-border shadow-sm">
            <button onClick={() => setViewMode('weight')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'weight' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Weight</button>
            <button onClick={() => setViewMode('revenue')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'revenue' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Revenue</button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Today's Production" value={viewMode === 'weight' ? latest.totalProduction.toLocaleString() : `$${latestRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} unit={viewMode === 'weight' ? "kg" : "usd"} subtitle={`Report: ${latest.date}`} icon={Activity} trend={viewMode === 'weight' ? growthWeight : growthRev} color="accent" />
        <KPICard title="This Month" value={monthWeight.toLocaleString()} unit="kg" subtitle={`Total for ${monthName}`} icon={Calendar} color="blue" />
        <KPICard title="This Year" value={yearWeight.toLocaleString()} unit="kg" subtitle={`Total for ${refYear}`} icon={Target} color="violet" />
        <KPICard title="Total Production" value={totalWeight.toLocaleString()} unit="kg" subtitle="All-time cumulative" icon={Globe} color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <BrandSummaryCard name="Lantabur Group" stats={brandStats.lantabur} color="accent" />
        <BrandSummaryCard name="Taqwa Textiles" stats={brandStats.taqwa} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div ref={unitCompRef} className="relative group lg:col-span-2 bg-app-card p-6 rounded-lg shadow-sm border border-app-border">
          <DownloadButton targetRef={unitCompRef} title="Unit_Comparison" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-app-border pb-4">
            <div>
              <h3 className="text-lg font-black text-app-text uppercase tracking-tight flex items-center gap-2">
                <BarChart3 className="text-app-accent" size={20} /> Unit Comparison
              </h3>
              <p className="text-xs text-app-text-muted font-medium">Daily output comparison history</p>
            </div>
          </div>
          <MultiIndustryBarChart data={records.filter(r => {
            const d = parseCustomDate(r.date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
          }).slice(-15)} />
        </div>

        <div ref={goalRef} className="relative group bg-app-card p-6 rounded-lg shadow-sm border border-app-border flex flex-col">
          <DownloadButton targetRef={goalRef} title="Goal_Accuracy" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-app-text uppercase tracking-tight mb-1 flex items-center gap-2">
                <Gauge className="text-amber-500" size={20} /> Goal Accuracy
              </h3>
              <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest">Efficiency Threshold</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-app-bg" />
                <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={534} strokeDashoffset={534 - (534 * progressPercent) / 100} strokeLinecap="round" className="text-app-accent transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-app-text tracking-tighter">{progressPercent.toFixed(0)}%</span>
                <span className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.2em] mt-1">Quota</span>
              </div>
            </div>
            <div className="w-full space-y-4 px-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <div className="flex flex-col"><span className="text-app-text-muted">Achieved</span><span className="text-app-text text-sm">{latest.totalProduction.toLocaleString()} kg</span></div>
                <div className="flex flex-col text-right"><span className="text-app-text-muted">Target</span><span className="text-app-text text-sm">{DAILY_TARGET.toLocaleString()} kg</span></div>
              </div>
              <div className="bg-app-bg rounded-lg p-3 border border-app-border space-y-3">
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-app-text-muted uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10} className="text-amber-500" /> Remaining</span>
                  <span className="text-amber-600 uppercase font-black">{shortfall.toLocaleString()} KG TO GO</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter mb-1">
                    <span className="text-app-accent">Lantabur ({lantaburShare.toFixed(0)}%)</span>
                    <span className="text-rose-500">Taqwa ({taqwaShare.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-app-card rounded-sm overflow-hidden flex border border-app-border/30">
                    <div className="h-full bg-app-accent transition-all duration-1000" style={{ width: `${lantaburShare}%` }}></div>
                    <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${taqwaShare}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div ref={techRef} className="relative group lg:col-span-4 bg-app-card p-6 rounded-lg shadow-sm border border-app-border">
          <DownloadButton targetRef={techRef} title="Tech_Balance" />
          <h3 className="text-sm font-black text-app-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <PieChartIcon size={18} className="text-app-accent" /> Tech Balance
          </h3>
          <RadarPerformanceChart lantabur={latest.lantabur} taqwa={latest.taqwa} />
        </div>
        <div ref={portfolioRef} className="relative group lg:col-span-8 bg-app-card p-6 rounded-lg shadow-sm border border-app-border">
          <DownloadButton targetRef={portfolioRef} title="Portfolio_Comparison" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-black text-app-text uppercase tracking-widest flex items-center gap-2">
              <Target size={18} className="text-app-accent" /> {chartLabel}
            </h3>
            <div className="flex bg-app-bg p-1 rounded-lg border border-app-border shadow-sm">
              <button onClick={() => setPortfolioTimeframe('today')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${portfolioTimeframe === 'today' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Today</button>
              <button onClick={() => setPortfolioTimeframe('month')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${portfolioTimeframe === 'month' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Month</button>
              <button onClick={() => setPortfolioTimeframe('year')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${portfolioTimeframe === 'year' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Year</button>
              <button onClick={() => setPortfolioTimeframe('total')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${portfolioTimeframe === 'total' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Total</button>
            </div>
          </div>
          <div className="h-[300px] animate-in fade-in duration-700">
            <IndustryColorComparisonChart 
                data={portfolioData} 
                lantaburTotal={timeframeLantaburTotal} 
                taqwaTotal={timeframeTaqwaTotal} 
            />
          </div>
        </div>
      </div>

      <div ref={velocityRef} className="relative group bg-app-card p-6 rounded-lg shadow-sm border border-app-border">
        <DownloadButton targetRef={velocityRef} title="Production_Velocity" />
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-black text-app-text uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="text-app-accent" size={20} /> Production Velocity
          </h3>
        </div>
        <ProductionTrendChart data={records.filter(r => {
          const d = parseCustomDate(r.date);
          return d.getFullYear() === selectedYear;
        }).slice(-20).map(r => ({ date: r.date, lantabur: r.lantabur.total, taqwa: r.taqwa.total }))} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-600 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12 transition-transform group-hover:scale-125 duration-700"><Droplets size={120} /></div>
          <div className="relative z-10 text-center">
            <h3 className="text-xs font-black uppercase tracking-widest mb-1">Process Water Footprint</h3>
            <p className="text-3xl font-black">{((latest.totalProduction * RATES.waterPerKg) / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k m³</p>
          </div>
        </div>
        <div className="bg-emerald-600 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12 transition-transform group-hover:scale-125 duration-700"><Leaf size={120} /></div>
          <div className="relative z-10 text-center">
            <h3 className="text-xs font-black uppercase tracking-widest mb-1">Carbon Output</h3>
            <p className="text-3xl font-black">{((latest.totalProduction * RATES.co2PerKg) / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k tons</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{ title: string; value: string; unit: string; subtitle: string; icon: any; trend?: number; color: string }> = ({ title, value, unit, subtitle, icon: Icon, trend, color }) => {
  const colorMap: Record<string, string> = { accent: 'text-app-accent bg-app-accent/10 border-app-accent/20', blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20', amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20', violet: 'text-violet-500 bg-violet-500/10 border-violet-500/20' };
  return (
    <div className="bg-app-card p-5 rounded-lg shadow-sm border border-app-border transition-all hover:border-app-accent duration-300 text-center flex flex-col items-center">
      <div className="flex items-start justify-between mb-4 w-full">
        <div className={`p-2.5 rounded-md border ${colorMap[color] || colorMap.accent}`}><Icon size={18} /></div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="w-full">
        <h4 className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1">{title}</h4>
        <div className="flex items-baseline justify-center gap-1.5"><p className="text-2xl font-black text-app-text tracking-tighter">{value}</p><span className="text-[10px] font-bold text-app-text-muted uppercase">{unit}</span></div>
        <p className="text-[9px] font-bold text-app-text-muted mt-2 uppercase tracking-tighter italic opacity-60">{subtitle}</p>
      </div>
    </div>
  );
};

const BrandSummaryCard: React.FC<{ name: string; stats: any; color: string }> = ({ name, stats, color }) => {
  const accentColor = color === 'rose' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-app-accent border-app-accent/20 bg-app-accent/5';
  return (
    <div className="bg-app-card rounded-lg border border-app-border shadow-sm p-4 overflow-hidden relative group hover:border-app-accent duration-300 transition-colors">
      <div className="flex items-center justify-between mb-4 border-b border-app-border pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${accentColor}`}><Factory size={16} /></div>
          <h4 className="text-sm font-black text-app-text uppercase tracking-tight">{name}</h4>
        </div>
        <div className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> Live Source</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <SummaryStat label="Today" value={stats.today} icon={Activity} />
        <SummaryStat label="This Week" value={stats.week} icon={CalendarDays} />
        <SummaryStat label="This Month" value={stats.month} icon={Calendar} />
        <SummaryStat label="Avg/Day" value={stats.avgDay} icon={Percent} />
        <SummaryStat label="This Year" value={stats.year} icon={History} />
      </div>
    </div>
  );
};

const SummaryStat: React.FC<{ label: string; value: number; icon: any; subLabel?: string }> = ({ label, value, icon: Icon, subLabel }) => (
  <div className="p-2.5 bg-app-bg rounded-md border border-app-border/50 text-center hover:bg-app-accent/5 transition-colors">
    <div className="flex items-center justify-center gap-1 mb-1 opacity-60"><Icon size={10} className="text-app-text-muted" /><span className="text-[8px] font-black text-app-text-muted uppercase tracking-tight">{label}{subLabel}</span></div>
    <p className="text-xl font-black text-app-text">{(value/1000).toFixed(1)}k <span className="text-[8px] font-normal opacity-50">kg</span></p>
  </div>
);
