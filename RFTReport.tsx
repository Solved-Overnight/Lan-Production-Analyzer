
import React, { useState, useRef, useMemo } from 'react';
import { RFTReportRecord, RFTBatchEntry } from './types';
import { 
  Plus, Upload, Save, Trash2, Search, FileText, ChevronLeft, ChevronRight,
  ClipboardCheck, Clock, CheckCircle2, AlertCircle, Loader2, X, Factory, User,
  LayoutGrid, Download, Edit3, ArrowLeft, ArrowRight, Users, Percent, Filter, Activity
} from 'lucide-react';
import { parseCustomDate } from './App';
import { extractRFTData } from './services/geminiService';

interface RFTReportProps {
  records: RFTReportRecord[];
  onSave: (record: RFTReportRecord) => void;
  onDelete: (id: string) => void;
}

const EMPTY_ENTRY: RFTBatchEntry = {
  mc: '',
  batchNo: '',
  buyer: '',
  order: '',
  colour: '',
  fType: '',
  fQty: 0,
  loadCapPercent: 0,
  shadeOk: true,
  shadeNotOk: false,
  dyeingType: 'B/D CARD',
  shiftUnload: 'DAY',
  remarks: ''
};

export const RFTReport: React.FC<RFTReportProps> = ({ records, onSave, onDelete }) => {
  const [viewMode, setViewMode] = useState<'browse' | 'create' | 'view'>('browse');
  const [selectedRecord, setSelectedRecord] = useState<RFTReportRecord | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingRecord, setEditingRecord] = useState<RFTReportRecord>({
    id: '',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/'),
    unit: 'Unit-02',
    companyName: 'Lantabur Apparels Ltd.',
    entries: [ { ...EMPTY_ENTRY } ],
    bulkRftPercent: 0,
    shiftPerformance: { yousuf: 0, humayun: 0 },
    createdAt: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => r.date.includes(searchQuery))
      .sort((a, b) => parseCustomDate(b.date).getTime() - parseCustomDate(a.date).getTime());
  }, [records, searchQuery]);

  const handleCreateNew = () => {
    setEditingRecord({
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/'),
      unit: 'Unit-02',
      companyName: 'Lantabur Apparels Ltd.',
      entries: [ { ...EMPTY_ENTRY } ],
      bulkRftPercent: 0,
      shiftPerformance: { yousuf: 0, humayun: 0 },
      createdAt: new Date().toISOString()
    });
    setViewMode('create');
  };

  const handleAddEntry = () => {
    setEditingRecord(prev => ({
      ...prev,
      entries: [...prev.entries, { ...EMPTY_ENTRY }]
    }));
  };

  const handleUpdateEntry = (index: number, field: keyof RFTBatchEntry, value: any) => {
    setEditingRecord(prev => {
      const newEntries = [...prev.entries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return { ...prev, entries: newEntries };
    });
  };

  const handleDeleteEntry = (index: number) => {
    setEditingRecord(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(editingRecord);
    setViewMode('browse');
    setError(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        try {
          const extracted = await extractRFTData(base64, file.type);
          setEditingRecord(prev => ({
            ...prev,
            ...extracted,
            id: prev.id || crypto.randomUUID(),
            createdAt: prev.createdAt || new Date().toISOString()
          }));
        } catch (err: any) {
          setError(err.message || "AI extraction failed.");
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsExtracting(false);
      setError("Failed to read file.");
    }
  };

  const totals = useMemo(() => {
    const data = (viewMode === 'view' && selectedRecord) ? selectedRecord : editingRecord;
    const totalQty = data.entries.reduce((sum, e) => sum + (Number(e.fQty) || 0), 0);
    const avgLoad = data.entries.length > 0 
      ? data.entries.reduce((sum, e) => sum + (Number(e.loadCapPercent) || 0), 0) / data.entries.length
      : 0;
    return { totalQty, avgLoad };
  }, [editingRecord, selectedRecord, viewMode]);

  // Fix: Explicitly use React.FC to handle key and other standard props correctly in TypeScript
  const EntryRow: React.FC<{ entry: RFTBatchEntry, index: number, readOnly?: boolean }> = ({ entry, index, readOnly }) => (
    <tr className="border-b border-app-border group hover:bg-app-accent/5 transition-colors">
      <td className="p-2 border-r border-app-border text-center font-bold">
        {readOnly ? entry.mc : <input type="text" className="w-full bg-transparent text-center focus:outline-none" value={entry.mc} onChange={e => handleUpdateEntry(index, 'mc', e.target.value)} />}
      </td>
      <td className="p-2 border-r border-app-border text-center font-medium">
        {readOnly ? entry.batchNo : <input type="text" className="w-full bg-transparent text-center focus:outline-none" value={entry.batchNo} onChange={e => handleUpdateEntry(index, 'batchNo', e.target.value)} />}
      </td>
      <td className="p-2 border-r border-app-border font-medium">
        {readOnly ? entry.buyer : <input type="text" className="w-full bg-transparent focus:outline-none" value={entry.buyer} onChange={e => handleUpdateEntry(index, 'buyer', e.target.value)} />}
      </td>
      <td className="p-2 border-r border-app-border font-medium">
        {readOnly ? entry.order : <input type="text" className="w-full bg-transparent focus:outline-none" value={entry.order} onChange={e => handleUpdateEntry(index, 'order', e.target.value)} />}
      </td>
      <td className="p-2 border-r border-app-border text-xs">
        {readOnly ? entry.colour : <input type="text" className="w-full bg-transparent focus:outline-none" value={entry.colour} onChange={e => handleUpdateEntry(index, 'colour', e.target.value)} />}
      </td>
      <td className="p-2 border-r border-app-border font-black text-xs">
        {readOnly ? entry.fType : <input type="text" className="w-full bg-transparent focus:outline-none" value={entry.fType} onChange={e => handleUpdateEntry(index, 'fType', e.target.value)} />}
      </td>
      <td className="p-2 border-r border-app-border text-right font-black text-xs text-app-accent">
        {readOnly ? entry.fQty.toLocaleString() : <input type="number" className="w-full bg-transparent text-right focus:outline-none" value={entry.fQty} onChange={e => handleUpdateEntry(index, 'fQty', parseFloat(e.target.value))} />}
      </td>
      <td className="p-2 border-r border-app-border text-right text-[9px] font-bold text-app-text-muted">
        {readOnly ? entry.loadCapPercent : <input type="number" className="w-full bg-transparent text-right focus:outline-none" value={entry.loadCapPercent} onChange={e => handleUpdateEntry(index, 'loadCapPercent', parseFloat(e.target.value))} />}
      </td>
      <td className="p-2 border-r border-app-border text-center">
        {readOnly ? (entry.shadeOk ? <CheckCircle2 className="mx-auto text-emerald-500" size={14} /> : '') : <input type="checkbox" className="accent-emerald-500" checked={entry.shadeOk} onChange={e => handleUpdateEntry(index, 'shadeOk', e.target.checked)} />}
      </td>
      <td className="p-2 border-r border-app-border text-center">
        {readOnly ? (entry.shadeNotOk ? <AlertCircle className="mx-auto text-rose-500" size={14} /> : '') : <input type="checkbox" className="accent-rose-500" checked={entry.shadeNotOk} onChange={e => handleUpdateEntry(index, 'shadeNotOk', e.target.checked)} />}
      </td>
      <td className="p-2 border-r border-app-border text-[9px] font-black uppercase tracking-tighter text-blue-500">
        {readOnly ? entry.dyeingType : <input type="text" className="w-full bg-transparent focus:outline-none" value={entry.dyeingType} onChange={e => handleUpdateEntry(index, 'dyeingType', e.target.value)} />}
      </td>
      <td className="p-2 border-r border-app-border text-[9px] font-bold text-amber-600">
        {readOnly ? entry.shiftUnload : <input type="text" className="w-full bg-transparent focus:outline-none" value={entry.shiftUnload} onChange={e => handleUpdateEntry(index, 'shiftUnload', e.target.value)} />}
      </td>
      <td className="p-2">
        <div className="flex items-center gap-2">
          {readOnly ? <span className="text-[9px] italic opacity-60">{entry.remarks}</span> : <input type="text" className="flex-1 bg-transparent focus:outline-none text-[9px]" value={entry.remarks} onChange={e => handleUpdateEntry(index, 'remarks', e.target.value)} />}
          {!readOnly && <button onClick={() => handleDeleteEntry(index)} className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-all"><Trash2 size={12} /></button>}
        </div>
      </td>
    </tr>
  );

  if (viewMode === 'create' || (viewMode === 'view' && selectedRecord)) {
    const data = viewMode === 'view' ? selectedRecord! : editingRecord;
    const isReadOnly = viewMode === 'view';

    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('browse')} className="p-2 bg-app-card border border-app-border rounded-lg hover:bg-app-bg transition-colors"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-black text-app-text tracking-tight uppercase">
                {isReadOnly ? 'RFT Report Insight' : 'Command New RFT Log'}
              </h1>
              <p className="text-sm text-app-text-muted">Machine-level batch tracking and shift telemetry</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isReadOnly && (
              <button onClick={() => fileInputRef.current?.click()} disabled={isExtracting} className="flex items-center gap-2 px-4 py-2 bg-app-accent/10 text-app-accent border border-app-accent/20 rounded-lg text-xs font-black uppercase hover:bg-app-accent hover:text-white transition-all">
                {isExtracting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} AI Extraction
              </button>
            )}
            {!isReadOnly && (
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase hover:bg-emerald-700 transition-all shadow-lg">
                <Save size={14} /> Commit Sheet
              </button>
            )}
            {isReadOnly && (
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-app-bg border border-app-border text-app-text-muted rounded-lg text-xs font-black uppercase hover:text-app-text transition-all">
                <Download size={14} /> Print PDF
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
        </header>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold rounded-lg flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-app-card p-4 rounded-xl border border-app-border shadow-sm flex flex-col justify-center">
             <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Company</p>
             {isReadOnly ? <p className="font-bold text-app-text text-sm">{data.companyName}</p> : <input className="bg-transparent font-bold text-app-text text-sm focus:outline-none border-b border-app-border" value={data.companyName} onChange={e => setEditingRecord({...data, companyName: e.target.value})} />}
           </div>
           <div className="bg-app-card p-4 rounded-xl border border-app-border shadow-sm flex flex-col justify-center">
             <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Unit</p>
             {isReadOnly ? <p className="font-bold text-app-text text-sm">{data.unit}</p> : <input className="bg-transparent font-bold text-app-text text-sm focus:outline-none border-b border-app-border" value={data.unit} onChange={e => setEditingRecord({...data, unit: e.target.value})} />}
           </div>
           <div className="bg-app-card p-4 rounded-xl border border-app-border shadow-sm flex flex-col justify-center">
             <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Date</p>
             {isReadOnly ? <p className="font-bold text-app-text text-sm">{data.date}</p> : <input className="bg-transparent font-bold text-app-text text-sm focus:outline-none border-b border-app-border" value={data.date} onChange={e => setEditingRecord({...data, date: e.target.value})} />}
           </div>
           <div className="bg-gradient-to-br from-app-accent to-app-accent-hover p-4 rounded-xl text-white shadow-md flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Shift Aggregate</p>
                <p className="text-2xl font-black">{totals.totalQty.toLocaleString()} <span className="text-xs font-medium">kg</span></p>
              </div>
              <LayoutGrid size={24} className="opacity-30" />
           </div>
        </div>

        {/* Data Grid */}
        <div className="bg-app-card rounded-xl border border-app-border shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] select-none text-[25vw] font-black text-app-text flex items-center justify-center -rotate-12 whitespace-nowrap overflow-hidden">
             PAGE 1
          </div>

          <div className="overflow-x-auto relative z-10 custom-scrollbar">
            <table className="w-full text-[10px] border-collapse min-w-[1250px]">
              <thead className="bg-[#14b8a6]/20 text-app-text uppercase font-black tracking-tighter border-b border-app-border sticky top-0 bg-app-card z-20 shadow-sm">
                <tr>
                  <th className="p-3 border-r border-app-border w-12 text-center">MC</th>
                  <th className="p-3 border-r border-app-border w-32 text-center">Batch no.</th>
                  <th className="p-3 border-r border-app-border w-40 text-left">Buyer</th>
                  <th className="p-3 border-r border-app-border w-40 text-left">Order</th>
                  <th className="p-3 border-r border-app-border w-40 text-left">Colour</th>
                  <th className="p-3 border-r border-app-border w-32 text-left">F/Type</th>
                  <th className="p-3 border-r border-app-border w-24 text-right">F.Qty</th>
                  <th className="p-3 border-r border-app-border w-24 text-right">Load %</th>
                  <th className="p-3 border-r border-app-border w-20 text-center">OK</th>
                  <th className="p-3 border-r border-app-border w-20 text-center">NOT OK</th>
                  <th className="p-3 border-r border-app-border w-32 text-left">Dyeing</th>
                  <th className="p-3 border-r border-app-border w-32 text-left">Shift</th>
                  <th className="p-3 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, idx) => (
                  <EntryRow key={idx} entry={entry} index={idx} readOnly={isReadOnly} />
                ))}
              </tbody>
              <tfoot className="bg-[#facc15]/20 font-black border-t-2 border-app-border">
                <tr>
                  <td colSpan={6} className="p-3 text-right border-r border-app-border uppercase tracking-widest text-[9px]">Sheet Totals</td>
                  <td className="p-3 text-right border-r border-app-border text-sm text-app-accent">{totals.totalQty.toLocaleString()}</td>
                  <td className="p-3 text-right border-r border-app-border text-[10px]">{totals.avgLoad.toFixed(1)}%</td>
                  <td colSpan={5} className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {!isReadOnly && (
            <div className="p-4 bg-app-bg/30 border-t border-app-border text-center">
              <button onClick={handleAddEntry} className="inline-flex items-center gap-2 px-8 py-2.5 bg-app-accent/10 text-app-accent border border-app-accent/20 rounded-lg text-xs font-black uppercase hover:bg-app-accent hover:text-white transition-all shadow-sm active:scale-95">
                <Plus size={16} /> Append Row
              </button>
            </div>
          )}
        </div>

        {/* Footer Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-[#a3e635]/30 p-8 rounded-2xl border border-[#a3e635]/40 shadow-sm flex items-center justify-between group hover:bg-[#a3e635]/40 transition-colors">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-white/50 backdrop-blur-sm text-emerald-700 rounded-2xl shadow-inner ring-1 ring-[#a3e635]/50">
                  <Percent size={40} strokeWidth={2.5} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter leading-none mb-1">Bulk RFT %</h3>
                   <p className="text-[11px] font-bold text-emerald-700/60 uppercase tracking-widest">Global Quality Index</p>
                </div>
              </div>
              <div className="text-6xl font-black text-emerald-900 tracking-tighter">
                {isReadOnly ? data.bulkRftPercent : <input className="w-32 bg-transparent text-right focus:outline-none border-b-2 border-emerald-900/20" type="number" step="0.01" value={data.bulkRftPercent} onChange={e => setEditingRecord({...data, bulkRftPercent: parseFloat(e.target.value)})} />}
              </div>
           </div>

           <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-3 bg-[#f87171]/10 border-b border-app-border flex items-center justify-between">
                <h4 className="text-[11px] font-black text-app-text uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} className="text-rose-500" /> Shift wise Performance
                </h4>
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75"></div>
                </div>
              </div>
              <div className="flex divide-x divide-app-border flex-1">
                <div className="flex-1 p-6 flex flex-col items-center justify-center group hover:bg-rose-500/5 transition-colors">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">YOUSUF</span>
                  {isReadOnly ? <span className="text-4xl font-black text-app-text tracking-tighter">{data.shiftPerformance.yousuf.toLocaleString()}</span> : <input className="w-full bg-transparent text-center font-black text-4xl tracking-tighter focus:outline-none" type="number" value={data.shiftPerformance.yousuf} onChange={e => setEditingRecord({...data, shiftPerformance: {...data.shiftPerformance, yousuf: parseFloat(e.target.value)}})} />}
                  <span className="text-[9px] font-bold text-app-text-muted mt-2 uppercase">KG Output</span>
                </div>
                <div className="flex-1 p-6 flex flex-col items-center justify-center group hover:bg-blue-500/5 transition-colors">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">HUMAYUN</span>
                  {isReadOnly ? <span className="text-4xl font-black text-app-text tracking-tighter">{data.shiftPerformance.humayun.toLocaleString()}</span> : <input className="w-full bg-transparent text-center font-black text-4xl tracking-tighter focus:outline-none" type="number" value={data.shiftPerformance.humayun} onChange={e => setEditingRecord({...data, shiftPerformance: {...data.shiftPerformance, humayun: parseFloat(e.target.value)}})} />}
                  <span className="text-[9px] font-bold text-app-text-muted mt-2 uppercase">KG Output</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-app-accent/10 text-app-accent text-[10px] font-black rounded-sm border border-app-accent/20 uppercase tracking-widest flex items-center gap-1">
              <ClipboardCheck size={10} /> Quality Node
            </span>
          </div>
          <h1 className="text-3xl font-black text-app-text tracking-tight uppercase">RFT Intelligence Node</h1>
          <p className="text-app-text-muted font-medium text-sm">Right-First-Time batch quality registry & insight</p>
        </div>
        <button onClick={handleCreateNew} className="flex items-center gap-2 px-8 py-3 bg-app-accent text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-app-accent-hover transition-all shadow-xl active:scale-95">
          <Plus size={18} /> New Entry
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-app-card p-6 rounded-xl border border-app-border shadow-sm">
             <div className="flex items-center gap-2 mb-4">
               <Search size={16} className="text-app-accent" />
               <h3 className="text-[10px] font-black text-app-text uppercase tracking-widest">Search Registry</h3>
             </div>
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Date search (e.g. 20/12)..." 
                  className="w-full pl-4 pr-10 py-3 bg-app-bg border border-app-border rounded-xl text-xs font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-3 top-3 text-app-text-muted">
                  <Filter size={14} />
                </div>
             </div>
           </div>

           <div className="bg-gradient-to-br from-[#14b8a6] to-[#0d9488] p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform duration-700 rotate-12">
                <CheckCircle2 size={140} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-80">RFT Integrity</p>
              <h4 className="text-4xl font-black tracking-tighter">94.8%</h4>
              <p className="text-[9px] font-bold mt-2 opacity-70 leading-tight">Rolling 30-day average RFT compliance across production units.</p>
           </div>
           
           <div className="bg-app-card p-6 rounded-xl border border-app-border shadow-sm">
             <div className="flex items-center gap-2 mb-3">
               <Activity size={14} className="text-app-accent" />
               <h3 className="text-[10px] font-black text-app-text uppercase tracking-widest">Recent Activity</h3>
             </div>
             <div className="space-y-3">
               {records.slice(0, 3).map(r => (
                 <div key={r.id} className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-app-text-muted">{r.date}</span>
                    <span className="text-[9px] font-black text-emerald-500">{r.bulkRftPercent}% RFT</span>
                 </div>
               ))}
             </div>
           </div>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredRecords.map(record => (
              <div 
                key={record.id} 
                className="bg-app-card p-6 rounded-2xl border border-app-border shadow-sm hover:border-app-accent hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden" 
                onClick={() => { setSelectedRecord(record); setViewMode('view'); }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-app-accent/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                
                <div className="flex items-start justify-between mb-5 relative z-10">
                   <div className="p-3 bg-app-bg rounded-xl border border-app-border group-hover:bg-app-accent group-hover:text-white transition-all group-hover:rotate-6 shadow-sm">
                     <FileText size={22} />
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest group-hover:text-app-accent transition-colors">Batch Registry</p>
                     <p className="text-lg font-black text-app-text tracking-tighter">{record.date}</p>
                   </div>
                </div>
                
                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-app-text-muted uppercase text-[9px] tracking-widest">Load Count</span>
                    <span className="text-app-text font-black px-2 py-0.5 bg-app-bg rounded-md border border-app-border">{record.entries.length} Batches</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-app-text-muted uppercase text-[9px] tracking-widest">Quality RFT</span>
                    <span className="text-emerald-500 font-black text-sm">{record.bulkRftPercent}%</span>
                  </div>
                </div>
                
                <div className="flex gap-2 relative z-10">
                   <button className="flex-1 px-3 py-2 bg-app-bg border border-app-border text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-app-accent hover:text-white transition-all shadow-sm">Open Sheet</button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDelete(record.id); }} 
                     className="p-2.5 bg-app-bg border border-app-border text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            ))}
            
            {filteredRecords.length === 0 && (
              <div className="col-span-full py-24 bg-app-card rounded-2xl border border-app-border border-dashed flex flex-col items-center justify-center text-app-text-muted transition-colors hover:bg-app-bg/50">
                <div className="p-6 bg-app-accent/5 rounded-full mb-6">
                  <ClipboardCheck size={64} className="opacity-20 text-app-accent" />
                </div>
                <h3 className="text-xl font-bold text-app-text uppercase tracking-tight">Registry is Empty</h3>
                <p className="text-sm text-center max-w-xs mt-2 font-medium">Click "New Entry" to start recording batch performance or search for a different date range.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
