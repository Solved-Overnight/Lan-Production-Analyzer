
import React from 'react';
import { ThemeType, AccentType } from './types';
import { Palette, Monitor, Check, Sun, Moon, Zap, Coffee, Ghost } from 'lucide-react';

interface SettingsProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  accent: AccentType;
  setAccent: (accent: AccentType) => void;
}

const THEMES: { id: ThemeType; label: string; icon: any; color: string }[] = [
  { id: 'light', label: 'Light', icon: Sun, color: '#f8fafc' },
  { id: 'dark', label: 'Dark', icon: Moon, color: '#0f172a' },
  { id: 'material', label: 'Material', icon: Zap, color: '#eceff1' },
  { id: 'tokio-night', label: 'Tokio Night', icon: Coffee, color: '#1a1b26' },
  { id: 'monokai', label: 'Monokai', icon: Zap, color: '#272822' },
  { id: 'dracula', label: 'Dracula', icon: Ghost, color: '#282a36' },
];

const ACCENTS: { id: AccentType; color: string }[] = [
  { id: 'indigo', color: '#6366f1' },
  { id: 'blue', color: '#3b82f6' },
  { id: 'emerald', color: '#10b981' },
  { id: 'rose', color: '#f43f5e' },
  { id: 'amber', color: '#f59e0b' },
  { id: 'violet', color: '#8b5cf6' },
  { id: 'cyan', color: '#06b6d4' },
];

export const Settings: React.FC<SettingsProps> = ({ theme, setTheme, accent, setAccent }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      <header>
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-app-text-muted mt-1">Customize your workspace appearance</p>
      </header>

      {/* Theme Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-app-accent mb-4">
          <Monitor size={20} />
          <h2 className="text-lg font-bold">Background Theme</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {THEMES.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all text-left overflow-hidden ${
                  isActive 
                    ? 'border-app-accent bg-app-card shadow-lg ring-4 ring-app-accent/5' 
                    : 'border-app-border bg-app-card hover:border-app-text-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-app-accent text-app-accent-contrast' : 'bg-app-bg text-app-text-muted group-hover:text-app-text'}`}>
                    <Icon size={18} />
                  </div>
                  {isActive && <div className="bg-app-accent text-app-accent-contrast rounded-full p-0.5"><Check size={12} strokeWidth={3} /></div>}
                </div>
                <span className={`font-semibold text-sm ${isActive ? 'text-app-text' : 'text-app-text-muted'}`}>
                  {t.label}
                </span>
                <div 
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-tl-xl" 
                  style={{ backgroundColor: t.color }}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* Accent Color Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-app-accent mb-4">
          <Palette size={20} />
          <h2 className="text-lg font-bold">Accent Color</h2>
        </div>

        <div className="bg-app-card p-6 rounded-2xl border border-app-border shadow-sm">
          <div className="flex flex-wrap gap-4">
            {ACCENTS.map((a) => {
              const isActive = accent === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  className={`relative w-12 h-12 rounded-full transition-transform hover:scale-110 active:scale-95 flex items-center justify-center shadow-md ${
                    isActive ? 'ring-4 ring-offset-4 ring-offset-app-card ring-app-accent' : ''
                  }`}
                  style={{ backgroundColor: a.color }}
                >
                  {isActive && <Check size={20} className="text-white drop-shadow-md" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-app-bg border border-app-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-app-accent flex items-center justify-center text-app-accent-contrast shadow-sm">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Accent Preview</p>
                <p className="text-xs text-app-text-muted capitalize">Current style: {accent}</p>
              </div>
            </div>
            <button className="px-4 py-1.5 bg-app-accent text-app-accent-contrast rounded-lg text-xs font-bold shadow-md hover:bg-app-accent-hover transition-colors">
              Example Button
            </button>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="pt-8 border-t border-app-border text-center">
        <p className="text-xs text-app-text-muted italic">
          Settings are saved automatically to your browser's local storage.
        </p>
      </footer>
    </div>
  );
};
