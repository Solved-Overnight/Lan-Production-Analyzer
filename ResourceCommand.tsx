
import React from 'react';
import { Droplets, Wind, Zap, Waves, Leaf, BarChart3, TrendingUp, Info } from 'lucide-react';
import { ProductionRecord } from './types';
import { ProductionTrendChart } from './components/Charts';

export const ResourceCommand: React.FC<{ records: ProductionRecord[] }> = ({ records }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-black text-app-text tracking-tight uppercase">Resource Command</h1>
        <p className="text-sm text-app-text-muted">Utility Consumption & Carbon Footprint Monitoring</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UtilityDeepCard title="Process Water" value="2,450" unit="m³" icon={Droplets} color="blue" />
        <UtilityDeepCard title="Steam Recovery" value="84%" unit="" icon={Waves} color="cyan" />
        <UtilityDeepCard title="Electricity Load" value="12,500" unit="kWh" icon={Zap} color="yellow" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-app-card p-6 rounded-xl border border-app-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-app-text uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={16} className="text-app-accent" /> Utility Trend (30 Days)
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-black rounded uppercase">Water</span>
              <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[9px] font-black rounded uppercase">Energy</span>
            </div>
          </div>
          <div className="h-64">
            {/* Fix: ProductionTrendChart expects data in {date, lantabur, taqwa} format and does not support dataKey prop */}
            <ProductionTrendChart 
              data={records.slice(-30).map(r => ({
                date: r.date,
                lantabur: r.lantabur.total,
                taqwa: r.taqwa.total
              }))} 
            />
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
           <div className="bg-emerald-500 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12 transition-transform group-hover:scale-125 duration-700">
               <Leaf size={120} />
             </div>
             <div className="relative z-10">
               <h3 className="text-xs font-black uppercase tracking-widest mb-1">Carbon Reduction</h3>
               <p className="text-3xl font-black">-12.5%</p>
               <p className="text-[10px] font-bold mt-2 opacity-80 leading-tight">Achievement vs 2024 Sustainability Baseline</p>
             </div>
           </div>

           <div className="bg-app-card p-6 rounded-xl border border-app-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Info size={14} className="text-app-accent" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-app-text-muted">Efficiency Alert</h4>
              </div>
              <p className="text-xs font-bold text-app-text leading-relaxed">
                Peak electricity load detected between 14:00 - 16:00. 
                <span className="text-app-accent block mt-1 hover:underline cursor-pointer">View Load Optimization Suggestions →</span>
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

const UtilityDeepCard = ({ title, value, unit, icon: Icon, color }: any) => {
  const colorMap: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  };
  return (
    <div className="bg-app-card p-6 rounded-xl border border-app-border shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-app-text">{value}</span>
            <span className="text-xs font-bold text-app-text-muted uppercase">{unit}</span>
          </div>
        </div>
      </div>
      <div className="w-full h-1 bg-app-bg rounded-full overflow-hidden">
        <div className="h-full bg-app-accent transition-all duration-1000" style={{ width: '70%' }}></div>
      </div>
    </div>
  );
};
