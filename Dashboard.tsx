
import React, { useMemo, useState } from 'react';
import { ProductionRecord } from './types';
import { 
  ProductionTrendChart, IndustryComparisonChart, 
  RadarPerformanceChart, MultiIndustryBarChart
} from './components/Charts';
import { 
  TrendingUp, Package, Calendar, Activity, Sigma, ArrowUpRight, ArrowDownRight, 
  Factory, Zap, ShieldCheck, BarChart3, Target, Globe, Clock, CalendarDays, History, 
  ArrowRight, Droplets, Leaf, Gauge, PieChart as PieChartIcon, AlertCircle, Percent
} from 'lucide-react';
import { parseCustomDate } from './App';

interface DashboardProps {
  records: ProductionRecord[];
}

const RATES = {
  lantabur: 1.25,
  taqwa: 1.18,
  waterPerKg: 45, // Litres per KG
  co2PerKg: 2.3   // KG of CO2 per KG
};

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const [viewMode, setViewMode] = useState<'weight' | 'revenue'>('weight');

  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;

    // Sort records by date descending (latest first)
    const sorted = [...records].sort((a, b) => parseCustomDate(b.date).getTime() - parseCustomDate(a.date).getTime());
    const latest = sorted[0];
    
    // Use the latest record's date as the reference for "This Month" and "This Year"
    const refDate = parseCustomDate(latest.date);
    const refMonth = refDate.getMonth();
    const refYear = refDate.getFullYear();
    
    // Get start of week relative to the latest record
    const startOfWeek = new Date(refDate);
    startOfWeek.setDate(refDate.getDate() - refDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const brandStats = {
      lantabur: { today: latest.lantabur.total, week: 0, month: 0, year: 0, avgDay: 0, monthCount: 0 },
      taqwa: { today: latest.taqwa.total, week: 0, month: 0, year: 0, avgDay: 0, monthCount: 0 }
    };

    let totalWeight = 0;
    let monthWeight = 0;
    let yearWeight = 0;
    let totalWater = 0;
    let totalCO2 = 0;

    records.forEach(r => {
      const d = parseCustomDate(r.date);
      const isSameMonth = d.getMonth() === refMonth && d.getFullYear() === refYear;
      const isSameYear = d.getFullYear() === refYear;
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
    });

    // Calculate averages
    brandStats.lantabur.avgDay = brandStats.lantabur.monthCount > 0 
      ? brandStats.lantabur.month / brandStats.lantabur.monthCount 
      : 0;
    brandStats.taqwa.avgDay = brandStats.taqwa.monthCount > 0 
      ? brandStats.taqwa.month / brandStats.taqwa.monthCount 
      : 0;

    const latestRevenue = (latest.lantabur.total * RATES.lantabur) + (latest.taqwa.total * RATES.taqwa);
    const prev = sorted[1];
    const prevRev = prev ? (prev.lantabur.total * RATES.lantabur) + (prev.taqwa.total * RATES.taqwa) : 0;
    
    const growthWeight = prev ? ((latest.totalProduction - prev.totalProduction) / Math.max(1, prev.totalProduction)) * 100 : 0;
    const growthRev = prev ? ((latestRevenue - prevRev) / Math.max(1, prevRev)) * 100 : 0;

    // Formatting month name for subtitle
    const monthName = refDate.toLocaleString('default', { month: 'long' });

    return { 
      latest, 
      latestRevenue, 
      totalWeight, 
      monthWeight, 
      yearWeight, 
      growthWeight, 
      growthRev, 
      brandStats,
      totalWater,
      totalCO2,
      monthName,
      refYear
    };
  }, [records]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-app-text-muted animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-6 bg-app-accent/5 rounded-full mb-6">
          <Package size={64} className="opacity-20 text-app-accent" />
        </div>
        <h2 className="text-2xl font-bold text-app-text">No Production Data Synced</h2>
        <p className="mt-2 text-center max-w-sm">Connect your database or upload daily reports to unlock production analytics and business intelligence.</p>
      </div>
    );
  }

  const { 
    latest, 
    latestRevenue, 
    totalWeight, 
    monthWeight, 
    yearWeight, 
    growthWeight, 
    growthRev, 
    brandStats,
    totalWater,
    totalCO2,
    monthName,
    refYear
  } = stats;

  const DAILY_TARGET = 60000;
  const progressPercent = Math.min(100, (latest.totalProduction / DAILY_TARGET) * 100);
  const shortfall = Math.max(0, DAILY_TARGET - latest.totalProduction);
  
  const lantaburShare = (latest.lantabur.total / latest.totalProduction) * 100;
  const taqwaShare = (latest.taqwa.total / latest.totalProduction) * 100;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
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
        <div className="flex bg-app-card p-1 rounded-md border border-app-border shadow-sm mx-auto md:mx-0">
          <button onClick={() => setViewMode('weight')} className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'weight' ? 'bg-app-accent text-white' : 'text-app-text-muted hover:text-app-text'}`}>Weight</button>
          <button onClick={() => setViewMode('revenue')} className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'revenue' ? 'bg-app-accent text-white' : 'text-app-text-muted hover:text-app-text'}`}>Revenue</button>
        </div>
      </header>

      {/* 1. Main KPI Stats Row: Today, Month, Year, Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Today's Production" 
          value={viewMode === 'weight' ? latest.totalProduction.toLocaleString() : `$${latestRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
          unit={viewMode === 'weight' ? "kg" : "usd"}
          subtitle={`Report: ${latest.date}`} 
          icon={Activity} 
          trend={viewMode === 'weight' ? growthWeight : growthRev}
          color="accent"
        />
        <KPICard 
          title="This Month" 
          value={monthWeight.toLocaleString()} 
          unit="kg" 
          subtitle={`Total for ${monthName}`} 
          icon={Calendar} 
          color="blue" 
        />
        <KPICard 
          title="This Year" 
          value={yearWeight.toLocaleString()} 
          unit="kg" 
          subtitle={`Total for ${refYear}`} 
          icon={Target} 
          color="violet" 
        />
        <KPICard 
          title="Total Production" 
          value={totalWeight.toLocaleString()} 
          unit="kg" 
          subtitle="All-time cumulative" 
          icon={Globe} 
          color="amber" 
        />
      </div>

      {/* 2. Brand Specific Summaries */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <BrandSummaryCard name="Lantabur Group" stats={brandStats.lantabur} color="accent" />
        <BrandSummaryCard name="Taqwa Textiles" stats={brandStats.taqwa} color="rose" />
      </div>

      {/* 3. Multi-Unit Production Analysis & Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-app-card p-6 rounded-lg shadow-sm border border-app-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-app-border pb-4">
            <div>
              <h3 className="text-lg font-black text-app-text uppercase tracking-tight flex items-center gap-2">
                <BarChart3 className="text-app-accent" size={20} /> Unit Comparison
              </h3>
              <p className="text-xs text-app-text-muted font-medium">Daily output comparison history</p>
            </div>
          </div>
          <MultiIndustryBarChart data={records.slice(-15)} />
        </div>

        <div className="bg-app-card p-6 rounded-lg shadow-sm border border-app-border flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-app-text uppercase tracking-tight mb-1 flex items-center gap-2">
                <Gauge className="text-amber-500" size={20} /> Goal Accuracy
              </h3>
              <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest">Efficiency Threshold</p>
            </div>
            <div className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-tighter ${progressPercent > 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {progressPercent > 80 ? 'Optimal' : 'Standard'}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-app-bg" />
                <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="16" fill="transparent" 
                        strokeDasharray={534} strokeDashoffset={534 - (534 * progressPercent) / 100}
                        strokeLinecap="round"
                        className="text-app-accent transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-app-text tracking-tighter">{progressPercent.toFixed(0)}%</span>
                <span className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.2em] mt-1">Quota</span>
              </div>
            </div>

            <div className="w-full space-y-4 px-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <div className="flex flex-col">
                  <span className="text-app-text-muted">Achieved</span>
                  <span className="text-app-text text-sm">{latest.totalProduction.toLocaleString()} kg</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-app-text-muted">Target</span>
                  <span className="text-app-text text-sm">{DAILY_TARGET.toLocaleString()} kg</span>
                </div>
              </div>

              <div className="bg-app-bg rounded-lg p-3 border border-app-border space-y-3">
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-app-text-muted uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle size={10} className="text-amber-500" /> Remaining
                  </span>
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

      {/* 4. Radar Performance & Industry Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-app-card p-6 rounded-lg shadow-sm border border-app-border">
          <h3 className="text-sm font-black text-app-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <PieChartIcon size={18} className="text-app-accent" /> Tech-Operational Balance
          </h3>
          <RadarPerformanceChart lantabur={latest.lantabur} taqwa={latest.taqwa} />
        </div>

        <div className="lg:col-span-7 bg-app-card p-6 rounded-lg shadow-sm border border-app-border">
          <h3 className="text-sm font-black text-app-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <Target size={18} className="text-app-accent" /> Cumulative Industry Volume
          </h3>
          <IndustryComparisonChart 
            data={[
              { name: 'Lantabur', value: stats.brandStats.lantabur.year, color: 'var(--app-accent)' },
              { name: 'Taqwa', value: stats.brandStats.taqwa.year, color: '#f43f5e' }
            ]} 
          />
        </div>
      </div>

      {/* 5. Production Velocity Full Width - UPDATED TO DUAL SERIES LINE */}
      <div className="bg-app-card p-6 rounded-lg shadow-sm border border-app-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-black text-app-text uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="text-app-accent" size={20} /> Production Velocity
            </h3>
            <p className="text-xs text-app-text-muted font-medium">Unit performance comparison over time</p>
          </div>
        </div>
        <ProductionTrendChart 
          data={records.slice(-20).map(r => ({
            date: r.date,
            lantabur: r.lantabur.total,
            taqwa: r.taqwa.total
          }))} 
        />
      </div>

      {/* 6. Environmental Footprint (Sustainability) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-600 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12 transition-transform group-hover:scale-125 duration-700">
            <Droplets size={120} />
          </div>
          <div className="relative z-10 text-center">
            <h3 className="text-xs font-black uppercase tracking-widest mb-1">Process Water Footprint</h3>
            <p className="text-3xl font-black">{(totalWater / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k m³</p>
            <p className="text-[10px] font-bold mt-2 opacity-80 leading-tight">Total lifetime consumption for dyeing operations</p>
          </div>
        </div>

        <div className="bg-emerald-600 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12 transition-transform group-hover:scale-125 duration-700">
            <Leaf size={120} />
          </div>
          <div className="relative z-10 text-center">
            <h3 className="text-xs font-black uppercase tracking-widest mb-1">Carbon Output</h3>
            <p className="text-3xl font-black">{(totalCO2 / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k tons</p>
            <p className="text-[10px] font-bold mt-2 opacity-80 leading-tight">Estimated CO2 emission from cumulative production</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{ 
  title: string; value: string; unit: string; subtitle: string; icon: any; 
  trend?: number; color: string 
}> = ({ title, value, unit, subtitle, icon: Icon, trend, color }) => {
  const colorMap: Record<string, string> = {
    accent: 'text-app-accent bg-app-accent/10 border-app-accent/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    violet: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  };

  return (
    <div className="bg-app-card p-5 rounded-lg shadow-sm border border-app-border transition-all hover:border-app-accent duration-300 text-center flex flex-col items-center">
      <div className="flex items-start justify-between mb-4 w-full">
        <div className={`p-2.5 rounded-md border ${colorMap[color] || colorMap.accent}`}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="w-full">
        <h4 className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1">{title}</h4>
        <div className="flex items-baseline justify-center gap-1.5">
          <p className="text-2xl font-black text-app-text tracking-tighter">{value}</p>
          <span className="text-[10px] font-bold text-app-text-muted uppercase">{unit}</span>
        </div>
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
          <div className={`p-1.5 rounded-md ${accentColor}`}>
            <Factory size={16} />
          </div>
          <h4 className="text-sm font-black text-app-text uppercase tracking-tight">{name}</h4>
        </div>
        <div className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest flex items-center gap-1">
          <Clock size={12} /> Live Source
        </div>
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
    <div className="flex items-center justify-center gap-1 mb-1 opacity-60">
      <Icon size={10} className="text-app-text-muted" />
      <span className="text-[8px] font-black text-app-text-muted uppercase tracking-tight">{label}{subLabel}</span>
    </div>
    <p className="text-xl font-black text-app-text">{(value/1000).toFixed(1)}k <span className="text-[8px] font-normal opacity-50">kg</span></p>
  </div>
);
