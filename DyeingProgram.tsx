import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { DyeingProgramRecord, DyeingEntry } from './types';
import { extractDyeingProgramData } from './services/geminiService';
import { parseCustomDate } from './App';
import { PasskeyModal } from './components/PasskeyModal';
import { 
  Plus, Upload, Save, Trash2, Search, FileText, 
  ChevronLeft, ChevronRight, Activity, Calendar, FilterX,
  Factory, CheckCircle2, AlertCircle, Loader2, X, Edit,
  BarChart3, Layers, Info, Hash, RefreshCw, Download, FileSpreadsheet,
  Sigma, Target, Globe, Trophy, ShieldCheck, ArrowRight, User, MousePointer2
} from 'lucide-react';

interface DyeingProgramProps {
  records: DyeingProgramRecord[];
  onSave: (record: DyeingProgramRecord, replaceId?: string) => void;
  onDelete: (id: string) => void;
  onLoadFullHistory?: () => void;
}

const EMPTY_ENTRY: DyeingEntry = {
  sl: '', buyer: '', priority: '', positionOfFabrics: '', orderNo: '', styleName: '',
  colour: '', ldNo: '', labPosition: '', yarnLot: '', fType: '', gsm: '',
  dyeingCloss: '', unitNo: '', inhouse: 0, subcontact: 0, totalQty: 0,
  anticrease: '', enzyme: '', softner: '', matching: '', noOfShipment: '',
  shipmentDate: '', remarks: ''
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export const DyeingProgram: React.FC<DyeingProgramProps> = ({ records, onSave, onDelete, onLoadFullHistory }) => {
  const [activeTab, setActiveTab] = useState<'lantabur' | 'taqwa'>('lantabur');
  const [viewMode, setViewMode] = useState<'browse' | 'create' | 'view' | 'edit'>('browse');
  const [selectedRecord, setSelectedRecord] = useState<DyeingProgramRecord | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [isRetrieving, setIsRetrieving] = useState(false);

  useEffect(() => {
    const today = new Date();
    if (filterMonth !== today.getMonth() || filterYear !== today.getFullYear()) {
      if (onLoadFullHistory) onLoadFullHistory();
    }
  }, [filterMonth, filterYear, onLoadFullHistory]);

  const [editingRecord, setEditingRecord] = useState<DyeingProgramRecord>({
    id: '', industry: 'lantabur', date: '', unit: 'Unit-02',
    inhouseTotal: 0, subcontTotal: 0, grandTotal: 0, entries: [], createdAt: ''
  });

  const [passkeyContext, setPasskeyContext] = useState<{ isOpen: boolean; action: () => void; label: string }>({
    isOpen: false, action: () => {}, label: ''
  });

  const requestAdmin = (label: string, action: () => void) => {
    setPasskeyContext({ isOpen: true, action, label });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRetrieve = () => {
    setIsRetrieving(true);
    if (onLoadFullHistory) onLoadFullHistory();
    setTimeout(() => setIsRetrieving(false), 800);
  };

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        const d = parseCustomDate(r.date);
        const matchesTab = r.industry === activeTab;
        const matchesDate = d.getMonth() === filterMonth && d.getFullYear() === filterYear;
        const matchesSearch = r.date.includes(searchQuery) || r.unit.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesDate && matchesSearch;
      })
      .sort((a, b) => parseCustomDate(b.date).getTime() - parseCustomDate(a.date).getTime());
  }, [records, activeTab, filterMonth, filterYear, searchQuery]);

  const handleCreateNew = () => {
    setEditingRecord({
      id: crypto.randomUUID(),
      industry: activeTab,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-'),
      unit: 'Unit-02', inhouseTotal: 0, subcontTotal: 0, grandTotal: 0,
      entries: [{ ...EMPTY_ENTRY, sl: '1' }], createdAt: new Date().toISOString()
    });
    setViewMode('create');
  };

  const handleSaveManual = () => {
    onSave(editingRecord, viewMode === 'edit' ? editingRecord.id : undefined);
    setViewMode('browse');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsExtracting(true); setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        try {
          const extracted = await extractDyeingProgramData(base64, file.type);
          const industry = extracted.industry || activeTab;
          onSave({ ...extracted, id: crypto.randomUUID(), industry, createdAt: new Date().toISOString() });
          setActiveTab(industry); setViewMode('browse');
        } catch (err: any) { setError(err.message || "AI extraction failed."); }
        finally { setIsExtracting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
      };
      reader.readAsDataURL(file);
    } catch (err) { setIsExtracting(false); setError("Failed to read file."); }
  };

  if ((viewMode === 'create' || viewMode === 'edit' || viewMode === 'view')) {
    const isReadOnly = viewMode === 'view';
    const data = isReadOnly ? selectedRecord! : editingRecord;
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('browse')} className="p-1.5 bg-app-card border border-app-border rounded-md hover:bg-app-bg transition-all active:scale-95"><ArrowLeft size={16} /></button>
            <h1 className="text-lg font-black text-app-text tracking-tight uppercase">{viewMode === 'view' ? 'Program Insight' : 'Dyeing Program Entry'}</h1>
          </div>
          {!isReadOnly && (
            <div className="flex gap-2">
              <button onClick={() => requestAdmin("AI Sync Program", () => fileInputRef.current?.click())} className="flex items-center gap-1.5 px-3 py-1.5 bg-app-card border border-app-border rounded-md text-[10px] font-bold uppercase hover:bg-app-bg transition-all">
                {isExtracting ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} AI Sync
              </button>
              <button onClick={() => requestAdmin("Save Program", handleSaveManual)} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-md text-[10px] font-bold uppercase hover:bg-emerald-700 transition-all"><Save size={12} /> Save</button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
        </header>
        <div className="bg-app-card rounded-lg border border-app-border shadow-sm p-4 overflow-hidden overflow-x-auto">
          <table className="w-full text-[9px] border-collapse min-w-[1500px]">
            <thead className="bg-[#1e293b] text-white uppercase font-bold tracking-wider">
              <tr><th className="p-2 border-r border-white/10">SL</th><th className="p-2 border-r border-white/10">Buyer</th><th className="p-2 border-r border-white/10">Order</th><th className="p-2 border-r border-white/10">Colour</th><th className="p-2 border-r border-white/10">F/Type</th><th className="p-2 border-r border-white/10">GSM</th><th className="p-2 border-r border-white/10">Inhouse</th><th className="p-2 border-r border-white/10">Subcon</th><th className="p-2 border-r border-white/10">Total</th><th className="p-2">Shipment</th></tr>
            </thead>
            <tbody>
              {data.entries.map((entry, idx) => (
                <tr key={idx} className="border-b border-app-border group hover:bg-app-accent/5">
                  <td className="p-1 border-r border-app-border text-center">{entry.sl}</td>
                  <td className="p-1 border-r border-app-border">{entry.buyer}</td>
                  <td className="p-1 border-r border-app-border">{entry.orderNo}</td>
                  <td className="p-1 border-r border-app-border">{entry.colour}</td>
                  <td className="p-1 border-r border-app-border">{entry.fType}</td>
                  <td className="p-1 border-r border-app-border">{entry.gsm}</td>
                  <td className="p-1 border-r border-app-border text-center">{entry.inhouse}</td>
                  <td className="p-1 border-r border-app-border text-center">{entry.subcontact}</td>
                  <td className="p-1 border-r border-app-border text-center font-bold text-app-accent">{entry.totalQty}</td>
                  <td className="p-1 text-center italic">{entry.shipmentDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PasskeyModal isOpen={passkeyContext.isOpen} onClose={() => setPasskeyContext(p => ({...p, isOpen: false}))} onSuccess={passkeyContext.action} actionLabel={passkeyContext.label} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5"><div className="w-9 h-9 bg-emerald-600 rounded flex items-center justify-center text-white"><FileText size={18} /></div><h1 className="text-xl font-black text-app-text tracking-tight uppercase leading-none">Dyeing Program Registry</h1></div>
        </div>
        <div className="flex items-center gap-3">
          {/* Dashboard-style Month/Year Selector */}
          <div className="flex bg-app-card border border-app-border rounded-lg p-1 shadow-sm items-center">
            <div className="px-2 text-app-accent">
              <Calendar size={14} />
            </div>
            <select 
              value={filterMonth} 
              onChange={e => setFilterMonth(Number(e.target.value))} 
              className="bg-transparent text-[10px] font-black uppercase focus:outline-none cursor-pointer border-r border-app-border px-4 py-1.5"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select 
              value={filterYear} 
              onChange={e => setFilterYear(Number(e.target.value))} 
              className="bg-transparent text-[10px] font-black uppercase focus:outline-none cursor-pointer px-4 py-1.5"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex bg-app-card p-1 rounded-lg border border-app-border shadow-sm">
               <button onClick={() => setActiveTab('lantabur')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'lantabur' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Lantabur</button>
               <button onClick={() => setActiveTab('taqwa')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'taqwa' ? 'bg-app-accent text-white shadow-sm' : 'text-app-text-muted hover:text-app-text'}`}>Taqwa</button>
             </div>
             <button onClick={handleCreateNew} className="flex items-center gap-1.5 px-5 py-2 bg-app-accent text-white rounded-md text-[10px] font-bold uppercase hover:bg-app-accent-hover transition-all shadow-md active:scale-95 group">
               <Plus size={14} /> New Program
             </button>
          </div>
        </div>
      </header>

      <div className="bg-app-card p-1.5 rounded-md border border-app-border shadow-sm flex flex-col lg:flex-row items-center gap-1.5">
        <div className="flex-1 flex items-center gap-1.5 w-full">
           <div className="relative group flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={14} />
             <input type="text" placeholder="Registry search..." className="w-full h-[38px] pl-9 pr-3 bg-app-bg border border-app-border rounded-lg text-[10px] font-bold text-app-text focus:outline-none placeholder:text-app-text-muted/40 transition-colors" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
           </div>
        </div>
        <button onClick={handleRetrieve} disabled={isRetrieving} className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-6 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-700 shadow-md active:scale-95 disabled:opacity-50 h-[38px]">
          {isRetrieving ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Fetch Registry
        </button>
      </div>

      <div className="bg-app-card rounded-xl border border-app-border shadow-sm overflow-hidden">
         {filteredRecords.length > 0 ? (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-[11px] border-collapse min-w-[800px]">
               <thead className="bg-app-bg text-[9px] font-black text-app-text-muted uppercase tracking-widest border-b border-app-border">
                 <tr><th className="px-5 py-3 border-r border-app-border text-center">Plan Date</th><th className="px-5 py-3 border-r border-app-border text-center">Unit</th><th className="px-5 py-3 border-r border-app-border text-center">Entries</th><th className="px-5 py-3 border-r border-app-border text-center">Inhouse Total</th><th className="px-5 py-3 border-r border-app-border text-center">Grand Total</th><th className="px-5 py-3 text-center">Action</th></tr>
               </thead>
               <tbody className="divide-y divide-app-border">
                 {filteredRecords.map(r => (
                   <tr key={r.id} className="hover:bg-app-bg/20 transition-colors group cursor-pointer" onClick={() => { setSelectedRecord(r); setViewMode('view'); }}>
                     <td className="px-5 py-3 font-bold text-app-text text-center border-r border-app-border">{r.date}</td>
                     <td className="px-5 py-3 text-center border-r border-app-border uppercase">{r.unit}</td>
                     <td className="px-5 py-3 text-center border-r border-app-border"><span className="px-2 py-0.5 bg-app-accent/10 text-app-accent rounded font-black text-[9px]">{r.entries.length}</span></td>
                     <td className="px-5 py-3 text-center border-r border-app-border text-emerald-600 font-black">{r.inhouseTotal.toLocaleString()} kg</td>
                     <td className="px-5 py-3 text-center border-r border-app-border font-black text-app-text">{r.grandTotal.toLocaleString()} kg</td>
                     <td className="px-5 py-3 text-center"><div className="flex items-center justify-center gap-2"><button className="text-[9px] font-black uppercase text-app-accent hover:underline">Open</button><button onClick={(e) => { e.stopPropagation(); requestAdmin("Delete Program Record", () => onDelete(r.id)); }} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button></div></td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         ) : !isRetrieving && (
            <div className="py-20 text-center opacity-30">
              <Activity size={40} className="mx-auto mb-3" />
              <p className="text-xs font-black uppercase">No records detected for current filter.</p>
              <button onClick={handleRetrieve} className="mt-2 text-[10px] font-black uppercase text-app-accent border-b border-app-accent/30 hover:border-app-accent">Search Registry History</button>
            </div>
         )}
         {isRetrieving && (
            <div className="flex flex-col items-center justify-center py-20"><Loader2 size={24} className="text-app-accent animate-spin mb-3" /><p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest animate-pulse">Syncing Plans...</p></div>
         )}
      </div>
      <PasskeyModal isOpen={passkeyContext.isOpen} onClose={() => setPasskeyContext(p => ({...p, isOpen: false}))} onSuccess={passkeyContext.action} actionLabel={passkeyContext.label} />
    </div>
  );
};

const ArrowLeft = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
