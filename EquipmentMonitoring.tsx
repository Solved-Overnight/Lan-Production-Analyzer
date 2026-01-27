
import React from 'react';
import { Cpu, Activity, Clock, AlertTriangle, CheckCircle2, Factory } from 'lucide-react';

export const EquipmentMonitoring: React.FC = () => {
  const machines = [
    { id: 'M-101', name: 'High Temp Dyeing Jigger', status: 'running', load: 85, temp: 130 },
    { id: 'M-102', name: 'Atmospheric Soft Flow', status: 'idle', load: 0, temp: 45 },
    { id: 'M-103', name: 'Continuous Bleaching Range', status: 'running', load: 92, temp: 95 },
    { id: 'M-104', name: 'Stenter Frame 01', status: 'maintenance', load: 0, temp: 20 },
    { id: 'M-105', name: 'Yarn Dyeing Unit A', status: 'running', load: 78, temp: 110 },
    { id: 'M-106', name: 'Jet Dyeing Unit 04', status: 'running', load: 88, temp: 125 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-black text-app-text tracking-tight uppercase">Equipment Monitoring</h1>
        <p className="text-sm text-app-text-muted">Real-time telemetry from Dyeing Floor assets</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map((m) => (
          <div key={m.id} className="bg-app-card p-5 rounded-lg border border-app-border shadow-sm group hover:border-app-accent transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${m.status === 'running' ? 'bg-emerald-500/10 text-emerald-500' : m.status === 'idle' ? 'bg-app-text-muted/10 text-app-text-muted' : 'bg-rose-500/10 text-rose-500'}`}>
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="font-black text-app-text text-sm uppercase tracking-tight">{m.name}</h3>
                  <p className="text-[10px] font-bold text-app-text-muted">{m.id}</p>
                </div>
              </div>
              <StatusBadge status={m.status} />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                  <span className="text-app-text-muted">Current Load</span>
                  <span className="text-app-text">{m.load}%</span>
                </div>
                <div className="w-full h-1.5 bg-app-bg rounded-sm overflow-hidden border border-app-border p-0.5">
                  <div 
                    className={`h-full transition-all duration-1000 ${m.load > 90 ? 'bg-rose-500' : 'bg-app-accent'}`} 
                    style={{ width: `${m.load}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-app-bg p-2 rounded-md border border-app-border flex items-center justify-between">
                  <Activity size={12} className="text-app-text-muted" />
                  <span className="text-xs font-black">{m.temp}°C</span>
                </div>
                <div className="bg-app-bg p-2 rounded-md border border-app-border flex items-center justify-between">
                  <Clock size={12} className="text-app-text-muted" />
                  <span className="text-xs font-black">12h 4m</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: any = {
    running: 'bg-emerald-500 text-white shadow-sm',
    idle: 'bg-slate-400 text-white',
    maintenance: 'bg-rose-500 text-white animate-pulse',
  };
  return (
    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${styles[status]}`}>
      {status}
    </span>
  );
};
