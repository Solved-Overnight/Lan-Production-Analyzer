
import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Lock } from 'lucide-react';
import { ADMIN_PASSKEY } from '../config';

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionLabel: string;
}

export const PasskeyModal: React.FC<PasskeyModalProps> = ({ isOpen, onClose, onSuccess, actionLabel }) => {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPasskey('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey === ADMIN_PASSKEY) {
      setError(false);
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPasskey('');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={onClose}>
      <div 
        className="bg-app-card rounded-lg shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-app-border animate-in fade-in zoom-in duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-app-border flex justify-between items-center bg-app-bg/20">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-app-text">Admin Required</h3>
          </div>
          <button onClick={onClose} className="text-app-text-muted hover:text-app-text transition-colors"><X size={18} /></button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center mb-2">
            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-tight mb-1">Target Action</p>
            <p className="text-xs font-black text-app-accent uppercase">{actionLabel}</p>
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={16} />
            <input 
              autoFocus
              type="password"
              placeholder="Enter Admin Passkey"
              className={`w-full pl-10 pr-4 py-2 bg-app-bg border rounded-md text-sm focus:outline-none focus:ring-2 transition-all ${error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-app-border focus:ring-app-accent/20'}`}
              value={passkey}
              onChange={(e) => {
                setPasskey(e.target.value);
                if (error) setError(false);
              }}
            />
          </div>
          
          {error && (
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight text-center animate-bounce">
              Incorrect Passkey. Access Denied.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-app-bg border border-app-border text-app-text rounded-md text-xs font-bold uppercase hover:bg-app-card transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-app-accent text-white rounded-md text-xs font-bold uppercase hover:bg-app-accent-hover transition-all shadow-md active:scale-95"
            >
              Authorize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
