
import React from 'react';
import { FlaskConical, CheckCircle2, AlertCircle, Percent, FlaskRound, Beaker } from 'lucide-react';
import { ProductionRecord } from './types';

export const LabIntelligence: React.FC<{ records: ProductionRecord[] }> = ({ records }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-black text-app-text tracking-tight uppercase">Lab Intelligence</h1>
        <p className="text-sm text-app-text-muted">Dyeing Right-First-Time (RFT) & Recipe Analytics</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <LabStatCard title="RFT Percentage" value="94.2%" subtitle="Monthly Target: 95%" icon={CheckCircle2} color="emerald" />
        <LabStatCard title="Re-dye Rate" value="3.8%" subtitle="Global Avg: 5.2%" icon={AlertCircle} color="rose" />
        <LabStatCard title="Avg Recipe Cost" value="$0.12" subtitle="per KG of fabric" icon={Beaker} color="app-accent" />
        <LabStatCard title="Shade Approvals" value="88%" subtitle="Today's Batch Total" icon={FlaskRound} color="violet" />
      </div>

      <div className="bg-app-card p-6 rounded-xl border border-app-border shadow-sm">
        <h3 className="text-sm font-black text-app-text uppercase tracking-widest mb-6 flex items-center gap-2">
          <FlaskConical size={16} className="text-app-accent" /> Recipe Distribution Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-app-text-muted uppercase italic mb-4">Top Chemical Usage (m/t)</h4>
            <RecipeProgress label="Dye Stuffs (Reactive)" value={82} color="var(--app-accent)" />
            <RecipeProgress label="Sodium Carbonate" value={65} color="#10b981" />
            <RecipeProgress label="Common Salt" value={92} color="#f59e0b" />
            <RecipeProgress label="Acetic Acid" value={45} color="#06b6d4" />
          </div>
          <div className="bg-app-bg p-6 rounded-xl border border-app-border flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-app-accent/10 rounded-full flex items-center justify-center text-app-accent">
                 <Percent size={24} />
               </div>
               <div>
                 <p className="text-xs font-bold text-app-text-muted uppercase">Lab Efficiency Score</p>
                 <p className="text-3xl font-black text-app-text">98.4</p>
               </div>
            </div>
            <p className="text-[11px] text-app-text-muted leading-relaxed italic">The laboratory team is achieving near-optimal shade matching across Dark and Extra Dark categories this month.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LabStatCard = ({ title, value, subtitle, icon: Icon, color }: any) => {
  const colorMap: any = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    'app-accent': 'bg-app-accent/10 text-app-accent border-app-accent/20',
  };
  return (
    <div className="bg-app-card p-5 rounded-xl border border-app-border shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border mb-4 ${colorMap[color] || colorMap['app-accent']}`}>
        <Icon size={20} />
      </div>
      <p className="text-[10px] font-black text-app-text-muted uppercase mb-1">{title}</p>
      <p className="text-2xl font-black text-app-text">{value}</p>
      <p className="text-[9px] font-bold text-app-text-muted mt-1 uppercase italic">{subtitle}</p>
    </div>
  );
};

const RecipeProgress = ({ label, value, color }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-bold uppercase">
      <span className="text-app-text-muted">{label}</span>
      <span className="text-app-text">{value}%</span>
    </div>
    <div className="w-full h-1.5 bg-app-bg rounded-full overflow-hidden border border-app-border p-0.5">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }}></div>
    </div>
  </div>
);
