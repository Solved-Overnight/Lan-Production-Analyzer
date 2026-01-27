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

export const DyeingProgram: React.FC<DyeingProgramProps> = ({ records, onSave, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'lantabur' | 'taqwa'>('lantabur');
  const [viewMode, setViewMode] = useState<'browse' | 'create' | 'view' | 'edit'>('browse');
  const [selectedRecord, setSelectedRecord] = useState<DyeingProgramRecord | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [isRetrieving, setIsRetrieving] = useState(false);

  // Manual Form State
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

  // Added handleRetrieve function to fix "Cannot find name 'handleRetrieve'" error
  const handleRetrieve = () => {
    setIsRetrieving(true);
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
      unit: 'Unit-02',
      inhouseTotal: 0,
      subcontTotal: 0,
      grandTotal: 0,
      entries: [{ ...EMPTY_ENTRY, sl: '1' }],
      createdAt: new Date().toISOString()
    });
    setViewMode('create');
  };

  const handleEditExisting = (record: DyeingProgramRecord) => {
    setEditingRecord({ ...record });
    setViewMode('edit');
  };

  const handleAddRow = () => {
    setEditingRecord(prev => ({
      ...prev,
      entries: [...prev.entries, { ...EMPTY_ENTRY, sl: (prev.entries.length + 1).toString() }]
    }));
  };

  const handleUpdateRow = (idx: number, field: keyof DyeingEntry, val: any) => {
    setEditingRecord(prev => {
      const newEntries = [...prev.entries];
      newEntries[idx] = { ...newEntries[idx], [field]: val };
      
      // Auto-calculate totals
      const inhouseTotal = newEntries.reduce((sum, e) => sum + (Number(e.inhouse) || 0), 0);
      const subcontTotal = newEntries.reduce((sum, e) => sum + (Number(e.subcontact) || 0), 0);
      
      return {
        ...prev,
        entries: newEntries,
        inhouseTotal,
        subcontTotal,
        grandTotal: inhouseTotal + subcontTotal
      };
    });
  };

  const handleSaveManual = () => {
    onSave(editingRecord, viewMode === 'edit' ? editingRecord.id : undefined);
    setViewMode('browse');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        try {
          const extracted = await extractDyeingProgramData(base64, file.type);
          // If AI extracted a different industry, switch tab or respect its extraction
          const industry = extracted.industry || activeTab;
          const newRecord: DyeingProgramRecord = {
            ...extracted,
            id: crypto.randomUUID(),
            industry,
            createdAt: new Date().toISOString()
          };
          onSave(newRecord);
          setActiveTab(industry);
          setViewMode('browse');
        } catch (err: any) {
          setError(err.message || "AI extraction failed.");
        } finally {
          setIsExtracting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsExtracting(false);
      setError("Failed to read file.");
    }
  };

  if ((viewMode === 'create' || viewMode === 'edit') && editingRecord) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
        <header className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <button onClick={() => setViewMode('browse')} className="p-2 bg-app-card border border-app-border rounded-lg hover:bg-app-bg transition-all active:scale-95"><ChevronLeft size={20} /></button>
              <div>
                 <h1 className="text-xl font-black text-app-text tracking-tight uppercase">Manual Program Registry</h1>
                 <p className="text-[10px] font-bold text-app-accent uppercase tracking-widest">Industry: {editingRecord.industry}</p>
              </div>
           </div>
           <button onClick={() => requestAdmin("Save Manual Entry", handleSaveManual)} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg active:scale-95">
              <Save size={16} /> Commit Registry
           </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-app-card p-4 rounded-xl border border-app-border">
              <label className="text-[9px] font-black uppercase text-app-text-muted mb-1 block">Plan Date</label>
              <input type="text" className="w-full bg-app-bg border border-app-border rounded p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-app-accent" value={editingRecord.date} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} placeholder="e.g. 16-Jan-26" />
           </div>
           <div className="bg-app-card p-4 rounded-xl border border-app-border">
              <label className="text-[9px] font-black uppercase text-app-text-muted mb-1 block">Inhouse Total (KG)</label>
              <p className="text-2xl font-black text-indigo-600">{editingRecord.inhouseTotal.toLocaleString()}</p>
           </div>
           <div className="bg-app-card p-4 rounded-xl border border-app-border">
              <label className="text-[9px] font-black uppercase text-app-text-muted mb-1 block">Subcont Total (KG)</label>
              <p className="text-2xl font-black text-amber-600">{editingRecord.subcontTotal.toLocaleString()}</p>
           </div>
           <div className="bg-app-card p-4 rounded-xl border border-app-border">
              <label className="text-[9px] font-black uppercase text-app-text-muted mb-1 block">Grand Total Program</label>
              <p className="text-2xl font-black text-app-text">{editingRecord.grandTotal.toLocaleString()}</p>
           </div>
        </div>

        <div className="bg-app-card rounded-xl border border-app-border shadow-sm overflow-hidden">
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-[10px] border-collapse min-w-[1800px]">
                 <thead className="bg-[#1e293b] text-white uppercase font-bold sticky top-0 z-20">
                    <tr>
                       <th className="p-2 border-r border-white/10 w-12">S/L</th>
                       <th className="p-2 border-r border-white/10 w-32">Buyer</th>
                       <th className="p-2 border-r border-white/10 w-24">Priority</th>
                       <th className="p-2 border-r border-white/10 w-44">Fabric Position</th>
                       <th className="p-2 border-r border-white/10 w-32">Order NO</th>
                       <th className="p-2 border-r border-white/10 w-44">Style</th>
                       <th className="p-2 border-r border-white/10 w-32">Colour</th>
                       <th className="p-2 border-r border-white/10 w-24">LD NO</th>
                       <th className="p-2 border-r border-white/10 w-20">F/Type</th>
                       <th className="p-2 border-r border-white/10 w-16">Inhouse</th>
                       <th className="p-2 border-r border-white/10 w-16">Sub</th>
                       <th className="p-2 border-r border-white/10 w-32">Matching</th>
                       <th className="p-2">Remarks</th>
                       <th className="p-2 w-10"></th>
                    </tr>
                 </thead>
                 <tbody className="bg-white">
                    {editingRecord.entries.map((entry, idx) => (
                      <tr key={idx} className="border-b border-app-border hover:bg-app-accent/5">
                         <td className="p-1 border-r border-app-border"><input className="w-full text-center focus:outline-none" value={entry.sl} onChange={e => handleUpdateRow(idx, 'sl', e.target.value)} /></td>
                         <td className="p-1 border-r border-app-border"><input className="w-full focus:outline-none font-bold" value={entry.buyer} onChange={e => handleUpdateRow(idx, 'buyer', e.target.value)} /></td>
                         <td className="p-1 border-r border-app-border"><input className="w-full text-center focus:outline-none font-black text-rose-500" value={entry.priority} onChange={e => handleUpdateRow(idx, 'priority', e.target.value)} /></td>
                         <td className="p-1 border-r border-app-border"><input className="w-full focus:outline-none italic" value={entry.positionOfFabrics} onChange={e => handleUpdateRow(idx, 'positionOfFabrics', e.target.value)} /></td>
                         <td className="p-1 border-r border-app-border"><input className="w-full focus:outline-none font-mono" value={entry.orderNo} onChange={e => handleUpdateRow(idx, 'orderNo', e.target.value)} /></td>
                         <td className="p-1 border-r border-app-border"><input className="w-full focus:outline-none" value={entry.styleName} onChange={e => handleUpdateRow(idx, 'styleName', e.target.value)} /></td>
                         <td className="p-1 border-r border-app-border"><input className="w-full focus:outline-none font-bold text-app-accent" value={entry.colour} onChange={e => handleUpdateRow(idx, 'colour', e.target.value)} /></td>
                         <td className="p-1 border-r border-app-border"><input className="w-full focus:outline-none" value={entry.ldNo} onChange={e => handleUpdateRow(idx, 'ldNo', e.target.value)} /></td>
                         <td className="p-1 border-r border-app-border"><input className="w-full text-center focus:outline-none font-bold" value={entry.fType} onChange={e => handleUpdateRow(idx, 'fType', e.target.value)} /></td>
                         <td className="p-1 border-r border-app-border"><input type="number" className="w-full text-right focus:outline-none font-black text-emerald-600" value={entry.inhouse} onChange={e => handleUpdateRow(idx, 'inhouse', parseFloat(e.target.value) || 0)} /></td>
                         <td className="p-1 border-r border-app-border"><input type="number" className="w-full text-right focus:outline-none font-black text-amber-600" value={entry.subcontact} onChange={e => handleUpdateRow(idx, 'subcontact', parseFloat(e.target.value) || 0)} /></td>
                         <td className="p-1 border-r border-app-border"><input className="w-full focus:outline-none" value={entry.matching} onChange={e => handleUpdateRow(idx, 'matching', e.target.value)} /></td>
                         <td className="p-1 border-r border-app-border"><input className="w-full focus:outline-none" value={entry.remarks} onChange={e => handleUpdateRow(idx, 'remarks', e.target.value)} /></td>
                         <td className="p-1 text-center"><button onClick={() => setEditingRecord({...editingRecord, entries: editingRecord.entries.filter((_, i) => i !== idx)})} className="p-1 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           <div className="p-4 bg-app-bg/10 flex justify-center border-t border-app-border">
              <button onClick={handleAddRow} className="flex items-center gap-2 px-8 py-2 bg-app-card border border-app-border rounded-lg text-xs font-black uppercase hover:bg-app-accent hover:text-white transition-all shadow-sm">
                 <Plus size={16} /> Append Fabrication Row
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'view' && selectedRecord) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('browse')} className="p-2 bg-app-card border border-app-border rounded-lg hover:bg-app-bg transition-all active:scale-95"><ChevronLeft size={20} /></button>
            <div>
              <h1 className="text-xl font-black text-app-text tracking-tight uppercase">Dyeing Program Insight</h1>
              <p className="text-xs text-app-text-muted font-bold uppercase tracking-widest">{selectedRecord.date} • {selectedRecord.unit} • {selectedRecord.industry.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleEditExisting(selectedRecord)} className="flex items-center gap-2 px-4 py-2 bg-app-accent text-white rounded-lg text-xs font-black uppercase transition-all shadow-md active:scale-95"><Edit size={16} /> Edit Record</button>
            <button onClick={() => requestAdmin("Delete Program Record", () => { onDelete(selectedRecord.id); setViewMode('browse'); })} className="p-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={20} /></button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <ProgramStatsCard label="Inhouse Program" value={selectedRecord.inhouseTotal.toLocaleString()} color="indigo" />
           <ProgramStatsCard label="Subcontact Program" value={selectedRecord.subcontTotal.toLocaleString()} color="amber" />
           <ProgramStatsCard label="Grand Total Program" value={selectedRecord.grandTotal.toLocaleString()} color="emerald" />
        </div>

        <div className="bg-app-card rounded-lg border border-app-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-[10px] border-collapse min-w-[1500px]">
               <thead className="bg-[#1e293b] text-white uppercase font-bold sticky top-0 z-20 shadow-md">
                 <tr>
                    <th className="p-2 border-r border-white/10 w-12">S/L</th>
                    <th className="p-2 border-r border-white/10 w-32">Buyer</th>
                    <th className="p-2 border-r border-white/10 w-20">Priority</th>
                    <th className="p-2 border-r border-white/10 w-44">Fabric Position</th>
                    <th className="p-2 border-r border-white/10 w-32">Order NO</th>
                    <th className="p-2 border-r border-white/10 w-44">Style</th>
                    <th className="p-2 border-r border-white/10 w-32 text-cyan-400">Colour</th>
                    <th className="p-2 border-r border-white/10 w-24">LD NO</th>
                    <th className="p-2 border-r border-white/10 w-20">F/Type</th>
                    <th className="p-2 border-r border-white/10 w-16 text-emerald-400">Inhouse</th>
                    <th className="p-2 border-r border-white/10 w-16 text-amber-400">Sub</th>
                    <th className="p-2 border-r border-white/10 w-20 font-black">Total</th>
                    <th className="p-2 border-r border-white/10 w-32">Matching</th>
                    <th className="p-2 text-center">Remarks</th>
                 </tr>
               </thead>
               <tbody>
                  {selectedRecord.entries.map((entry, idx) => (
                    <tr key={idx} className="border-b border-app-border hover:bg-app-accent/5 transition-colors">
                      <td className="p-2 border-r border-app-border text-center font-bold text-app-text-muted">{entry.sl}</td>
                      <td className="p-2 border-r border-app-border font-bold">{entry.buyer}</td>
                      <td className="p-2 border-r border-app-border text-center font-black text-rose-500 uppercase">{entry.priority}</td>
                      <td className="p-2 border-r border-app-border italic">{entry.positionOfFabrics}</td>
                      <td className="p-2 border-r border-app-border font-mono">{entry.orderNo}</td>
                      <td className="p-2 border-r border-app-border uppercase tracking-tighter">{entry.styleName}</td>
                      <td className="p-2 border-r border-app-border font-bold text-app-accent">{entry.colour}</td>
                      <td className="p-2 border-r border-app-border">{entry.ldNo}</td>
                      <td className="p-2 border-r border-app-border font-bold uppercase">{entry.fType}</td>
                      <td className="p-2 border-r border-app-border text-right font-black text-emerald-600">{entry.inhouse?.toLocaleString() || '-'}</td>
                      <td className="p-2 border-r border-app-border text-right font-black text-amber-600">{entry.subcontact?.toLocaleString() || '-'}</td>
                      <td className="p-2 border-r border-app-border text-right font-black text-app-text">{(entry.totalQty || (entry.inhouse + entry.subcontact)).toLocaleString()}</td>
                      <td className="p-2 border-r border-app-border font-bold uppercase tracking-widest">{entry.matching}</td>
                      <td className="p-2 italic opacity-60 truncate">{entry.remarks}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <FileText size={22} />
             </div>
             <div>
                <h1 className="text-2xl font-black text-app-text tracking-tight uppercase leading-none">Dyeing Program</h1>
                <p className="text-app-text-muted font-bold text-[10px] uppercase tracking-widest mt-1 opacity-60">Plan & Capacity Registry Hub</p>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-app-card p-1 rounded-lg border border-app-border shadow-sm flex">
              <button onClick={() => setActiveTab('lantabur')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'lantabur' ? 'bg-indigo-600 text-white shadow-md' : 'text-app-text-muted hover:text-app-text'}`}>Lantabur</button>
              <button onClick={() => setActiveTab('taqwa')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'taqwa' ? 'bg-indigo-600 text-white shadow-md' : 'text-app-text-muted hover:text-app-text'}`}>Taqwa</button>
           </div>
           <button onClick={handleCreateNew} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg active:scale-95 transition-all">
             <Plus size={16} /> Manual Registry
           </button>
           <button onClick={() => requestAdmin("Upload Dyeing Program", () => fileInputRef.current?.click())} disabled={isExtracting} className="flex items-center gap-2 px-6 py-2.5 bg-app-accent text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-app-accent-hover transition-all shadow-lg active:scale-95 disabled:opacity-50">
             {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} AI Sync
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
        </div>
      </header>

      {error && (
        <div className="bg-rose-500/10 text-rose-500 p-4 rounded-xl border border-rose-500/20 text-xs font-bold flex items-center gap-3 shadow-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Period Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <DetailedProgramStatCard label="Today's Program" records={records} period="today" industry={activeTab} icon={Target} color="emerald" />
         <DetailedProgramStatCard label="This Month" records={records} period="month" industry={activeTab} icon={Calendar} color="indigo" />
         <DetailedProgramStatCard label="This Year" records={records} period="year" industry={activeTab} icon={Globe} color="violet" />
         <DetailedProgramStatCard label="Industry Total" records={records} period="total" industry={activeTab} icon={Sigma} color="amber" />
      </div>

      <div className="bg-app-card p-2 rounded-xl border border-app-border shadow-sm flex flex-col md:flex-row items-center gap-2">
         <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
            <select value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))} className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-widest focus:outline-none hover:border-app-accent/30 transition-all cursor-pointer">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))} className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-widest focus:outline-none hover:border-app-accent/30 transition-all cursor-pointer">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={14} />
              <input type="text" placeholder="Filter registry..." className="w-full pl-9 pr-4 py-2 bg-app-bg border border-app-border rounded-lg text-[11px] font-bold focus:outline-none hover:border-app-accent/30 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
         </div>
         <button onClick={handleRetrieve} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md transition-all">
            {isRetrieving ? <Loader2 size={14} className="animate-spin" /> : <MousePointer2 size={14} />}
         </button>
      </div>

      <div className="bg-app-card rounded-xl border border-app-border shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b border-app-border bg-app-bg/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <ShieldCheck size={18} className="text-app-accent" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text">{activeTab.toUpperCase()} Registry Node</h3>
            </div>
            <span className="text-[9px] font-black text-app-text-muted px-2 py-0.5 bg-app-bg rounded border border-app-border">{filteredRecords.length} Nodes Online</span>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
               <thead className="bg-app-bg text-[9px] font-black text-app-text-muted uppercase tracking-widest border-b border-app-border">
                  <tr>
                    <th className="px-6 py-3">Program Date</th>
                    <th className="px-6 py-3">Unit Registry</th>
                    <th className="px-6 py-3">Inhouse (KG)</th>
                    <th className="px-6 py-3">Subcont (KG)</th>
                    <th className="px-6 py-3 font-black text-app-accent">Net weight</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-app-border">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-app-accent/5 transition-all group cursor-pointer" onClick={() => { setSelectedRecord(r); setViewMode('view'); }}>
                      <td className="px-6 py-4 font-bold text-app-text">{r.date}</td>
                      <td className="px-6 py-4 uppercase font-black opacity-60 text-[9px] tracking-widest">{r.unit}</td>
                      <td className="px-6 py-4 font-mono">{r.inhouseTotal.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono">{r.subcontTotal.toLocaleString()}</td>
                      <td className="px-6 py-4 font-black text-app-accent">{r.grandTotal.toLocaleString()} kg</td>
                      <td className="px-6 py-4 text-center">
                         <div className="flex items-center justify-center gap-2">
                           <button className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-app-accent/10 text-app-accent border border-app-accent/20 rounded hover:bg-app-accent hover:text-white transition-all shadow-sm">Inspect</button>
                           <button onClick={(e) => { e.stopPropagation(); requestAdmin("Purge Registry Node", () => onDelete(r.id)); }} className="p-1 text-app-text-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center opacity-30">
                        <div className="flex flex-col items-center gap-3">
                           <Activity size={40} />
                           <p className="text-xs font-black uppercase tracking-[0.2em]">Node stand-by: No records detected for {activeTab}</p>
                        </div>
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      <PasskeyModal 
        isOpen={passkeyContext.isOpen}
        onClose={() => setPasskeyContext(prev => ({ ...prev, isOpen: false }))}
        onSuccess={passkeyContext.action}
        actionLabel={passkeyContext.label}
      />
    </div>
  );
};

const ProgramStatsCard = ({ label, value, color }: any) => {
  const colorMap: any = {
    indigo: 'bg-indigo-600', amber: 'bg-amber-600', emerald: 'bg-emerald-600'
  };
  return (
    <div className="bg-app-card p-6 rounded-xl border border-app-border shadow-sm flex flex-col items-center justify-center text-center group hover:border-app-accent transition-all">
       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-app-text-muted mb-2">{label}</span>
       <div className="flex items-baseline gap-1">
         <span className="text-3xl font-black text-app-text tracking-tighter">{value}</span>
         <span className="text-xs font-bold text-app-text-muted uppercase">kg</span>
       </div>
       <div className={`w-12 h-1 rounded-full mt-4 ${colorMap[color]} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
    </div>
  );
};

const DetailedProgramStatCard = ({ label, records, period, industry, icon: Icon, color }: { label: string, records: DyeingProgramRecord[], period: string, industry: string, icon: any, color: string }) => {
  const stats = useMemo(() => {
    const today = new Date();
    const currMonth = today.getMonth();
    const currYear = today.getFullYear();
    
    let filtered = records.filter(r => r.industry === industry);
    if (period === 'today') {
      filtered = filtered.filter(r => {
        const d = parseCustomDate(r.date);
        return d.getDate() === today.getDate() && d.getMonth() === currMonth && d.getFullYear() === currYear;
      });
    } else if (period === 'month') {
      filtered = filtered.filter(r => {
        const d = parseCustomDate(r.date);
        return d.getMonth() === currMonth && d.getFullYear() === currYear;
      });
    } else if (period === 'year') {
      filtered = filtered.filter(r => {
        const d = parseCustomDate(r.date);
        return d.getFullYear() === currYear;
      });
    }
    
    const totalWeight = filtered.reduce((acc, r) => acc + (r.grandTotal || 0), 0);
    return { total: totalWeight, count: filtered.length };
  }, [records, period, industry]);

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10',
    indigo: 'bg-indigo-500/5 text-indigo-600 border-indigo-500/10',
    violet: 'bg-violet-500/5 text-violet-600 border-violet-500/10',
    amber: 'bg-amber-500/5 text-amber-600 border-amber-500/10'
  };

  return (
    <div className={`p-5 rounded-xl border shadow-sm ${colorMap[color]} group hover:bg-app-card transition-all`}>
       <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-white rounded shadow-sm border border-app-border/10 group-hover:scale-110 transition-transform">
             <Icon size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">{period.toUpperCase()}</span>
       </div>
       <div>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
          <div className="flex items-baseline gap-1.5">
             <span className="text-2xl font-black tracking-tighter text-app-text">{(stats.total/1000).toFixed(1)}k</span>
             <span className="text-[10px] font-bold text-app-text-muted uppercase">KG</span>
          </div>
          <p className="text-[8px] font-bold mt-2 uppercase opacity-50">{stats.count} registries</p>
       </div>
    </div>
  );
};
