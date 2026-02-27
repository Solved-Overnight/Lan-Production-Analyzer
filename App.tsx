
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './Dashboard';
import { ProductionData } from './ProductionData';
import { Settings } from './Settings';
import { EquipmentMonitoring } from './EquipmentMonitoring';
import { LabIntelligence } from './LabIntelligence';
import { ResourceCommand } from './ResourceCommand';
import { ShiftPerformance } from './ShiftPerformance';
import { RFTReport } from './RFTReport';
import { DyeingProgram } from './DyeingProgram';
import { ProductionRecord, RFTReportRecord, DyeingProgramRecord, ThemeType, AccentType } from './types';
import { db, ref, onValue, set, remove, query, limitToLast } from './services/firebaseService';
import { Loader2, Factory, Zap, ShieldCheck, Cpu, Database, Activity } from 'lucide-react';

export const parseCustomDate = (dateStr: string): Date => {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  const parts = dateStr.split(/[- /]/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    let year = parseInt(parts[2], 10);
    if (parts[2].length === 2) {
      year += 2000;
    }
    
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, 
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      '01': 0, '02': 1, '03': 2, '04': 3, '05': 4, '06': 5,
      '07': 6, '08': 7, '09': 8, '10': 9, '11': 10, '12': 11
    };
    
    const month = months[monthStr.substring(0, 3)] ?? months[monthStr];
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }
  return new Date();
};

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  
  const statusMessages = [
    "Initializing Industrial Core...",
    "Connecting to Telemetry Node...",
    "Syncing Production Cluster...",
    "Calibrating Dye Load Analytics...",
    "Optimizing Dashboard Modules...",
    "Finalizing Command Interface..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + (Math.random() * 15) : prev));
    }, 400);

    const statusTimer = setInterval(() => {
      setStatusIdx(prev => (prev + 1) % statusMessages.length);
    }, 1200);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-[#f1f5f9] relative overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_#6366f1_0%,_transparent_70%)] opacity-30"></div>
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-[#334155] h-full w-full"></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mb-12 flex flex-col items-center">
        <div className="relative p-6 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] rounded-xl text-white shadow-[0_20px_50px_rgba(99,102,241,0.3)] animate-pulse mb-6">
          <Factory size={48} strokeWidth={2.5} />
          <div className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-lg">
            <Zap size={16} className="text-[#6366f1] fill-[#6366f1]" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter mb-1">LANTABUR <span className="text-[#6366f1]">OS</span></h1>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-[#10b981]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#94a3b8]">Industrial Intelligence</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-xs space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] font-black text-[#6366f1] uppercase tracking-widest animate-pulse">
              System Syncing
            </span>
            <span className="text-xs font-black tabular-nums">{Math.floor(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#1e293b] rounded-full overflow-hidden border border-[#334155] p-0.5">
            <div 
              className="h-full bg-[#6366f1] rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-[#1e293b]/50 border border-[#334155] p-4 rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-3 text-[#94a3b8]">
            <Loader2 size={14} className="animate-spin text-[#6366f1]" />
            <span className="text-[11px] font-bold uppercase tracking-tight truncate">
              {statusMessages[statusIdx]}
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-1 bg-[#334155] rounded-full overflow-hidden">
               <div className="h-full bg-[#10b981] w-1/2 animate-infinite-scroll"></div>
            </div>
            <div className="flex-1 h-1 bg-[#334155] rounded-full overflow-hidden">
               <div className="h-full bg-[#6366f1] w-1/3 animate-infinite-scroll-delayed"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 w-full text-center opacity-30">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em]">Build Core Node v3.4.12 // Central Command Hub</p>
      </div>

      <style>{`
        @keyframes infinite-scroll {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll 2s linear infinite;
        }
        .animate-infinite-scroll-delayed {
          animation: infinite-scroll 3s linear infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [rftRecords, setRftRecords] = useState<RFTReportRecord[]>([]);
  const [dyeingPrograms, setDyeingPrograms] = useState<DyeingProgramRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullHistoryLoaded, setIsFullHistoryLoaded] = useState(false);
  const [theme, setTheme] = useState<ThemeType>(() => (localStorage.getItem('app-theme') as ThemeType) || 'light');
  const [accent, setAccent] = useState<AccentType>(() => (localStorage.getItem('app-accent') as AccentType) || 'indigo');

  const accentColors: Record<AccentType, { main: string; hover: string }> = {
    indigo: { main: '#6366f1', hover: '#4f46e5' },
    blue: { main: '#3b82f6', hover: '#2563eb' },
    emerald: { main: '#10b981', hover: '#059669' },
    rose: { main: '#f43f5e', hover: '#e11d48' },
    amber: { main: '#f59e0b', hover: '#d97706' },
    violet: { main: '#8b5cf6', hover: '#7c3aed' },
    cyan: { main: '#06b6d4', hover: '#0891b2' },
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    const colors = accentColors[accent];
    document.documentElement.style.setProperty('--app-accent', colors.main);
    document.documentElement.style.setProperty('--app-accent-hover', colors.hover);
    localStorage.setItem('app-accent', accent);
  }, [accent]);

  const loadFullHistory = useCallback(() => {
    if (isFullHistoryLoaded) return;
    setIsFullHistoryLoaded(true);
  }, [isFullHistoryLoaded]);

  useEffect(() => {
    // Initial data fetch - Limit to most recent 100 entries for performance
    const baseQuery = isFullHistoryLoaded ? (ref: any) => ref : (ref: any) => query(ref, limitToLast(100));

    // Production Records Sync
    const recordsRef = ref(db, 'production_records');
    const unsubscribeProduction = onValue(baseQuery(recordsRef), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const recordsList: ProductionRecord[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        const sorted = recordsList.sort((a, b) => 
          parseCustomDate(a.date).getTime() - parseCustomDate(b.date).getTime()
        );
        setRecords(sorted);
      } else {
        setRecords([]);
      }
    });

    // RFT Records Sync
    const rftRef = ref(db, 'rft_records');
    const unsubscribeRFT = onValue(baseQuery(rftRef), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const recordsList: RFTReportRecord[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setRftRecords(recordsList);
      } else {
        setRftRecords([]);
      }
    });

    // Dyeing Program Sync
    const dyeingRef = ref(db, 'dyeing_programs');
    const unsubscribeDyeing = onValue(baseQuery(dyeingRef), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const recordsList: DyeingProgramRecord[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setDyeingPrograms(recordsList);
      } else {
        setDyeingPrograms([]);
      }
    });

    setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      unsubscribeProduction();
      unsubscribeRFT();
      unsubscribeDyeing();
    };
  }, [isFullHistoryLoaded]);

  const handleAddRecord = async (record: ProductionRecord, replaceId?: string) => {
    try {
      const recordId = replaceId || record.id || crypto.randomUUID();
      const existingRecord = records.find(r => r.date === record.date);
      const finalId = replaceId || (existingRecord ? existingRecord.id : recordId);
      const recordToSave = { ...record, id: finalId };
      await set(ref(db, `production_records/${finalId}`), recordToSave);
    } catch (error) {
      console.error("Error saving record:", error);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!id) return;
    try {
      await remove(ref(db, `production_records/${id}`));
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const handleAddRftRecord = async (record: RFTReportRecord, replaceId?: string) => {
    try {
      const recordId = replaceId || record.id || crypto.randomUUID();
      const existingRecord = rftRecords.find(r => r.date === record.date);
      const finalId = replaceId || (existingRecord ? existingRecord.id : recordId);
      const recordToSave = { ...record, id: finalId };
      await set(ref(db, `rft_records/${finalId}`), recordToSave);
    } catch (error) {
      console.error("Error saving RFT record:", error);
    }
  };

  const handleDeleteRftRecord = async (id: string) => {
    try {
      await remove(ref(db, `rft_records/${id}`));
    } catch (error) {
      console.error("Error deleting RFT record:", error);
    }
  };

  const handleAddDyeingProgram = async (record: DyeingProgramRecord, replaceId?: string) => {
    try {
      const finalId = replaceId || record.id || crypto.randomUUID();
      await set(ref(db, `dyeing_programs/${finalId}`), { ...record, id: finalId });
    } catch (error) {
      console.error("Error saving Dyeing Program:", error);
    }
  };

  const handleDeleteDyeingProgram = async (id: string) => {
    try {
      await remove(ref(db, `dyeing_programs/${id}`));
    } catch (error) {
      console.error("Error deleting Dyeing Program:", error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard records={records} onLoadFullHistory={loadFullHistory} isHistoryLoaded={isFullHistoryLoaded} />} />
          <Route 
            path="/data" 
            element={
              <ProductionData 
                records={records} 
                onAddRecord={handleAddRecord} 
                onDeleteRecord={handleDeleteRecord} 
                onLoadFullHistory={loadFullHistory}
              />
            } 
          />
          <Route 
            path="/rft" 
            element={
              <RFTReport 
                records={rftRecords} 
                onSave={handleAddRftRecord} 
                onDelete={handleDeleteRftRecord}
                onLoadFullHistory={loadFullHistory}
              />
            } 
          />
          <Route 
            path="/dyeing-program" 
            element={
              <DyeingProgram 
                records={dyeingPrograms} 
                onSave={handleAddDyeingProgram} 
                onDelete={handleDeleteDyeingProgram} 
                onLoadFullHistory={loadFullHistory}
              />
            } 
          />
          <Route path="/shifts" element={<ShiftPerformance records={rftRecords} onUpdateRecord={handleAddRftRecord} onLoadFullHistory={loadFullHistory} />} />
          <Route path="/equipment" element={<EquipmentMonitoring />} />
          <Route path="/lab" element={<LabIntelligence records={records} />} />
          <Route path="/resources" element={<ResourceCommand records={records} />} />
          <Route 
            path="/settings" 
            element={
              <Settings 
                theme={theme} 
                setTheme={setTheme} 
                accent={accent} 
                setAccent={setAccent} 
              />
            } 
          />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
